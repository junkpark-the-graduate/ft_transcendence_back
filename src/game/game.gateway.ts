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
import { v4 } from 'uuid';

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
//  isPlayer1: boolean;
//  paddle: {x: number, y: number}
//}
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() io: Server;
  private logger = new Logger('GameGateway');

  private disconnectedUserMap = new Map<number, any>();
  private gameRoomMap = new Map<string, any>();

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

    // TODO: 두명 다 나가면 서버가 터짐
    this.io.adapter['on']('delete-room', (roomId) => {
      console.log(`room ${roomId} was delete`);
      this.gameRoomMap.delete(roomId);
    });

    const interval = setInterval(() => {
      const match = this.gameMatchmaker.matchPlayers();
      console.log('rooms: ', this.io.adapter['rooms']);
      if (match) {
        const { gameType, player1, player2 } = match;
        console.log('match_found');
        const roomId = v4();
        player1.emit('match_found', { roomId });
        player2.emit('match_found', { roomId });
        player1.join(roomId);
        player2.join(roomId);
        const room = this.io.in(roomId);
        room['roomId'] = roomId;
        player1['room'] = room;
        player2['room'] = room;
        switch (gameType) {
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
        room['player1'] = player1;
        room['player2'] = player2;

        this.gameRoomMap.set(roomId, room);
        this.gameEngine.gameInit(room);
        this.gameEngine.gameLoop(room);
      }
    }, 5000);
  }

  async handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log(`Client connected: ${socket.id}`);
    const accessToken = socket.handshake.query.accessToken as string;
    try {
      const ftId: number = this.jwtService.verify(accessToken)['sub'];
      socket['ftId'] = ftId;
      socket['mmr'] = (await this.userService.findOne(socket['ftId']))['mmr'];
    } catch (error) {
      console.log('handleConnection error: ', error);
      socket.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log(`Client disconnected: ${socket.id}`);
    const room = socket['room'];
    if (room) {
      this.disconnectedUserMap.set(socket['ftId'], socket['room']);
    }
  }

  @SubscribeMessage('reconnect')
  handleReconnect(@ConnectedSocket() socket: Socket) {
    const ftId = socket['ftId'];
    const room = this.disconnectedUserMap.get(ftId);
    this.disconnectedUserMap.delete(ftId);
    return { roomId: room ? room['roomId'] : undefined };
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(@ConnectedSocket() socket: Socket, @MessageBody() data) {
    const { roomId } = data;
    console.log('roomId', roomId);
    const room = this.gameRoomMap.get(roomId);
    if (!room) {
      return { isSuccess: false };
    }

    console.log('socket[room]: ', socket['room']);

    if (!socket['room']) {
      const ftId = socket['ftId'];
      // reconnection
      if (this.disconnectedUserMap.get(ftId)) {
        //socket.emit('reconnection');
        this.disconnectedUserMap.delete(ftId);
        socket.join(room['roomId']);
        const disconnectSocket =
          room['player1'].ftId === ftId ? room['player1'] : room['player2'];
        const isPlayer1: boolean = disconnectSocket.isPlayer1;
        socket['room'] = room;
        socket['paddle'] = disconnectSocket.paddle;
        socket['isPlayer1'] = isPlayer1;
        isPlayer1 ? (room['player1'] = socket) : (room['player2'] = socket);
        return { isSuccess: true };
      }
      // 초대해서 들어온 경우
      socket.join(roomId);
      socket['room'] = room;
      socket['isPlayer1'] = false;
      room['player2'] = socket;
      room['type'] = 'friendly';
      this.gameEngine.gameInit(room);
      this.gameEngine.gameLoop(room);
    }
    return { isSuccess: true };
  }

  @SubscribeMessage('create_room')
  handleCreateRoom(@ConnectedSocket() socket: Socket) {
    const roomId = v4();
    const room = this.io.in(roomId);

    this.gameRoomMap.set(roomId, room);
    room['player1'] = socket;
    socket.join(roomId);
    socket['room'] = room;
    socket['isPlayer1'] = true;
    return roomId;
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

  @SubscribeMessage('game_init')
  handleGameInit(@ConnectedSocket() socket: Socket) {
    return socket['isPlayer1'];
  }

  @SubscribeMessage('cancel_matching')
  handlecancelMatching(@ConnectedSocket() socket: Socket) {
    this.gameMatchmaker.removePlayer(socket);
  }

  @SubscribeMessage('key_left')
  handleKeyLeft(@ConnectedSocket() socket: Socket) {
    this.gameEngine.movePaddleLeft(socket);
  }

  @SubscribeMessage('key_right')
  handleKeyRight(@ConnectedSocket() socket: Socket) {
    this.gameEngine.movePaddleRight(socket);
  }
}
