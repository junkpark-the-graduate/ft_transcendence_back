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
import {
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_SPEED,
  BALL_SIZE,
  BALL_SPEED,
  PLANE_WIDTH,
  PLANE_HEIGHT,
} from './game.constants';
import { JwtService } from '@nestjs/jwt';

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
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private waitingQueue: Socket[] = [];

  @WebSocketServer() io: Server;
  private logger = new Logger('GameGateway');

  constructor(private gameEngine: GameEngine, private jwtService: JwtService) {
    this.logger.log('GameGateway constructor');
  }

  afterInit(server: any) {
    this.logger.log('GameGateway initialized');

    const interval = setInterval(() => {
      console.log('waitingQueue.length: ', this.waitingQueue.length);

      if (this.waitingQueue.length >= 2) {
        const player1 = this.waitingQueue.shift();
        const player2 = this.waitingQueue.shift();
        player1.emit('match_found', 'Match found');
        player2.emit('match_found', 'Match found');
        player1.join('dummy_room');
        player2.join('dummy_room');
        const room = this.io.in('dummy_room');
        room['player1'] = player1;
        room['player2'] = player2;

        this.gameEngine.gameInit(room);
        this.gameEngine.gameLoop(room);
      }
    }, 5000);
  }

  // jwt token 검증
  handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log(`Client connected: ${socket.id}`);
    const accessToken = socket.handshake.query.accessToken as string;

    try {
      const decoded = this.jwtService.verify(accessToken);
      socket['ftId'] = decoded['sub'];
    } catch (error) {
      socket.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log(`Client disconnected: ${socket.id}`);
    socket.leave('dummy_room');
  }

  @SubscribeMessage('start_matchmaking')
  handleStartMatchmaking(@ConnectedSocket() socket: Socket) {
    this.waitingQueue.push(socket);
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
