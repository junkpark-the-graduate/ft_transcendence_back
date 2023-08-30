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
import { GameEngine, Role } from './game.engine';
import { JwtService } from '@nestjs/jwt';
import { GameMatchmaker } from './game.matchmaker';
import { UserService } from 'src/user/user.service';
import { GameType } from './game.constants';
import { v4 } from 'uuid';
import { EUserStatus } from 'src/user/user.entity';

@WebSocketGateway(parseInt(process.env.GAME_SOCKET_PORT), {
  namespace: 'game',
  cors: {
    origin: [
      process.env.FRONT_END_POINT,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
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

    const interval = setInterval(async () => {
      const match = this.gameMatchmaker.matchPlayers();
      // 접속중인 유저와 게임 룸
      // console.log('접속중인 유저와 게임 룸: ', this.io.adapter['rooms']);
      if (match) {
        const { gameType, player1, player2 } = match;
        console.log('match_found');
        const roomId = v4();
        player1.emit('match_found', {
          roomId,
          opponent: await this.userService.findOne(player2['ftId']),
        });
        // TODO 필요한 데이터만 보내기
        player2.emit('match_found', {
          roomId,
          opponent: await this.userService.findOne(player1['ftId']),
        });
        player1.join(roomId);
        player2.join(roomId);
        const room = this.io.in(roomId);

        room['roomId'] = roomId;
        player1['room'] = room;
        player2['room'] = room;
        room['readyCount'] = 0;
        room['type'] = gameType;
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

      const sockets = await this.io.fetchSockets();
      sockets.forEach((socket) => {
        if (socket['ftId'] === ftId) {
          socket.disconnect();
        }
      });
      socket['ftId'] = ftId;
      socket['mmr'] = (await this.userService.findOne(socket['ftId']))['mmr'];
      this.userService.updateUserStatus(socket['ftId'], EUserStatus.online);
    } catch (error) {
      console.log('handleConnection error: ', error);
      socket.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log(`Client disconnected: ${socket.id}`);
    const room = socket['room'];
    if (room && socket['role'] !== Role.Spectator) {
      if (room['isPlaying']) {
        this.disconnectedUserMap.set(socket['ftId'], socket['room']);
      }
    }
    this.gameMatchmaker.removePlayer(socket);
    this.userService.updateUserStatus(socket['ftId'], EUserStatus.offline);
  }

  @SubscribeMessage('reconnect')
  handleReconnect(@ConnectedSocket() socket: Socket) {
    const ftId = socket['ftId'];
    const room = this.disconnectedUserMap.get(ftId);
    return { roomId: room ? room['roomId'] : undefined };
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(@ConnectedSocket() socket: Socket, @MessageBody() data) {
    const { roomId } = data;
    const room = this.gameRoomMap.get(roomId);
    const ftId = socket['ftId'];

    if (!room) {
      this.disconnectedUserMap.delete(ftId);
      return { isSuccess: false };
    }
    if (!socket['room']) {
      // reconnection
      if (this.disconnectedUserMap.get(ftId)) {
        this.disconnectedUserMap.delete(ftId);
        socket.join(room['roomId']);
        const disconnectSocket =
          room['player1'].ftId === ftId ? room['player1'] : room['player2'];
        const role: Role = disconnectSocket['role'];
        socket['room'] = room;
        socket['paddle'] = disconnectSocket.paddle;
        socket['role'] = role;
        role === Role.Player1
          ? (room['player1'] = socket)
          : (room['player2'] = socket);
      } else {
        socket['room'] = room;
        socket.join(roomId);
        // friendly game
        if (room['readyCount'] !== 2) {
          socket['role'] = Role.Player2;
          room['player2'] = socket;
          room['type'] = 'friendly';
        } else {
          // Spectator
          socket['role'] = Role.Spectator;
        }
        this.gameEngine.gameInit(room);
        this.gameEngine.gameLoop(room);
      }
    }
    return { isSuccess: true };
  }

  // TODO: 초대할 때 누가 초대 됐는지 inviteeId 넣어주기
  @SubscribeMessage('create_room')
  handleCreateRoom(@ConnectedSocket() socket: Socket) {
    const roomId = v4();
    const room = this.io.in(roomId);

    this.gameRoomMap.set(roomId, room);
    room['player1'] = socket;
    room['roomId'] = roomId;
    socket.join(roomId);
    socket['room'] = room;
    socket['role'] = Role.Player1;
    room['readyCount'] = 0;
    return roomId; // 초대하면 초대한 사람이 초대 받을 사람한테 /game/join?roomId={roomId} 보내주고, 초대한 사람은 /game/join?roomId={roomId}로 라우팅이 되어야 함
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(@ConnectedSocket() socket: Socket) {
    const room = socket['room'];
    if (room) {
      if (room['isPlaying']) {
        this.disconnectedUserMap.set(socket['ftId'], room);
      }
      console.log(room['roomId']);
      socket.leave(room['roomId']);
      console.log('leave_room');
      socket['room'] = null;
    }
  }

  @SubscribeMessage('decline_invitation')
  handleDeclineInvitation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data,
  ) {
    const { roomId } = data;

    const room = this.gameRoomMap.get(roomId);
    if (room /* && room['inviteeId'] === socket['ftId'] */) {
      socket['room'] = null;
      room.emit('decline_invitation'); // 프론트에서 이 이벤트 받으면 alert, /game 리디렉션
      room.socketsLeave(roomId);
    }
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
    console.log('server game_init');
    console.log(socket['role']);
    if (socket['role'] !== Role.Spectator && socket['room']['readyCount'] < 2) {
      socket['room']['readyCount'] += 1;
    }
    return socket['role'];
  }

  @SubscribeMessage('cancel_matching')
  handleCancelMatching(@ConnectedSocket() socket: Socket) {
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
