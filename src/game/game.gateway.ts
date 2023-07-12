import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameEngine } from './game.engine';
import { JwtService } from '@nestjs/jwt';
import { GameMatchmaker } from './game.matchmaker';
import { UserService } from 'src/user/user.service';
import { GameType } from './game.constants';

@WebSocketGateway(4242, {
  namespace: 'game',
  cors: {
    origin: [
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
  },
})

//interface PlayerData {
//  ftId: number;
//  mmr: number;
//  matchTime: number;
//  isPlayer1: boolean;
//  paddle: {x: number, y: number}
//}
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  //private waitingQueue: Socket[] = [];

  @WebSocketServer() io: Server;
  private logger = new Logger('GameGateway');

  constructor(
    private gameEngine: GameEngine,
    private gameMatchmaker: GameMatchmaker,
    private jwtService: JwtService,
    private userService: UserService,
  ) {
    this.logger.log('GameGateway constructor');
  }

  afterInit(server: any) {
    this.logger.log('GameGateway initialized');

    const interval = setInterval(() => {
      const match = this.gameMatchmaker.matchPlayers();
      if (match) {
        console.log('match_found');
        match[1].emit('match_found', 'Match found');
        match[2].emit('match_found', 'Match found');
        match[1].join('dummy_room');
        match[2].join('dummy_room');
        const room = this.io.in('dummy_room');
        switch (match[0]) {
          case GameType.NORMAL:
            room['type'] = 'normal';
            break;
          case GameType.LADDER:
            room['type'] = 'ladder';
            break;
          case GameType.FRIENDLY:
            room['type'] = 'frendly';
            break;
        }
        room['player1'] = match[1];
        room['player2'] = match[2];
        this.gameEngine.gameInit(room);
        this.gameEngine.gameLoop(room);
      }
    }, 5000);
  }

  async handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log(`Client connected: ${socket.id}`);
    const accessToken = socket.handshake.query.accessToken as string;
    try {
      const decoded = this.jwtService.verify(accessToken);
      socket['ftId'] = decoded['sub'];
      socket['mmr'] = (await this.userService.findOne(socket['ftId']))['mmr'];
    } catch (error) {
      socket.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log(`Client disconnected: ${socket.id}`);
    socket.leave('dummy_room');
  }

  @SubscribeMessage('normal_matching')
  handleNormalMatching(@ConnectedSocket() socket: Socket) {
    socket['matchTime'] = Date.now();
    this.gameMatchmaker.addPlayer(GameType.NORMAL, socket);
  }

  @SubscribeMessage('ladder_matching')
  handleLadderMatching(@ConnectedSocket() socket: Socket) {
    socket['matchTime'] = Date.now();
    this.gameMatchmaker.addPlayer(GameType.LADDER, socket);
  }

  @SubscribeMessage('cancel_matching')
  handlecancelMatching(@ConnectedSocket() socket: Socket) {
    this.gameMatchmaker.removePlayer(socket);
  }

  @SubscribeMessage('key_left')
  handleHello(
    @ConnectedSocket() socket: Socket,
    //@MessageBody('isPlayer1') isPlayer1: boolean,
  ) {
    this.gameEngine.movePaddleLeft(socket);
  }

  @SubscribeMessage('key_right')
  handleKeyRight(
    @ConnectedSocket() socket: Socket,
    //@MessageBody('isPlayer1') isPlayer1,
  ) {
    this.gameEngine.movePaddleRight(socket);
  }
}
