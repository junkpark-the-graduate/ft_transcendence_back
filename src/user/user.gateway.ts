import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserService } from './user.service';
import { EUserStatus } from './user.entity';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway(4242, {
  namespace: 'user',
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
@Injectable()
export class UserGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger('user');
  private onlineUsers = new Set<number>(); // 저장된 userId의 목록

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.log('init');
  }

  async handleConnection(socket: Socket) {
    const accessToken = socket.handshake.query.accessToken as string;

    if (!accessToken) {
      this.logger.error('Token not found.');
      socket.disconnect();
      return;
    }

    try {
      const userId: number = this.jwtService.verify(accessToken)['sub'];
      socket['userId'] = userId;

      // 사용자 연결 시에, 해당 사용자를 생성하고 온라인 상태로 초기화
      await this.userService.updateUserStatus(userId, EUserStatus.online);

      this.onlineUsers.add(userId);
      this.server.emit('userStatusUpdate', Array.from(this.onlineUsers));
      this.server.emit('userStatusUpdate', {
        userId,
        status: EUserStatus.online,
      });
    } catch (err) {
      this.logger.error('Invalid accessToken.', err);
      socket.disconnect();
      return;
    }
  }

  async handleDisconnect(socket: Socket) {
    const accessToken = socket.handshake.query.accessToken as string;

    if (!accessToken) {
      return;
    }
    try {
      const userId: number = this.jwtService.verify(accessToken)['sub'];
      socket['userId'] = userId;
      this.onlineUsers.delete(userId);

      this.server.emit('userStatusUpdate', Array.from(this.onlineUsers));
      await this.userService.updateUserStatus(userId, EUserStatus.offline); // Modify this line
    } catch (err) {
      this.logger.error('Invalid token.', err);
      return;
    }
  }

  // 클라이언트에서 onlineUsers 목록을 요청하는 경우의 핸들러
  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers() {
    return Array.from(this.onlineUsers);
  }

  // 유저의 상태 변경 이벤트를 발생시키는 함수
  async emitUserStatusUpdate(userId: number, status: EUserStatus) {
    this.onlineUsers.add(userId);
    this.server.emit('userStatusUpdate', { userId, status });
    await this.userService.updateUserStatus(userId, status);
  }

  // 클라이언트로부터 특정 id를 가진 유저의 상태를 요청하는 경우의 핸들러
  @SubscribeMessage('getUserStatusById') // 원하는 이벤트 이름으로 설정
  async handleGetUserStatusById(@MessageBody() userId: number) {
    try {
      // 유저의 상태를 검색하여 응답
      const userStatus = await this.userService.findUserStatusById(userId);
      return userStatus;
    } catch (err) {
      // 유저를 찾지 못한 경우에 대한 예외 처리를 하지 않음
      // 클라이언트에서 오프라인 상태로 처리하도록 함
      return EUserStatus.offline;
    }
  }
}
