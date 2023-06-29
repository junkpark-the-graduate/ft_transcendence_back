import { Logger, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Socket } from 'socket.io';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { WsJwtGuard } from 'src/auth/ws-jwt-guard.guard';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';

interface Chat {
  username: string;
  message: string;
  socketId: string;
}

interface User {
  id: number;
  name: string;
  image: string;
}

@WebSocketGateway(4242, {
  namespace: 'chattings',
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
})
export class ChatsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger('chat');
  private connectedUsers: User[] = [];

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {
    this.logger.log('constructor');
  }

  afterInit() {
    this.logger.log('init');
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    const token = socket.handshake.query.token as string;
    if (!token) {
      throw new UnauthorizedException('Token not found.');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);

      this.connectedUsers = this.connectedUsers.filter(
        (user) => user.id !== payload.sub,
      );
      console.log('this.connectedUser', this.connectedUsers);
      this.logger.log(`disconnected : ${socket.id} ${socket.nsp.name}`);
    } catch (err) {
      throw new UnauthorizedException('Invalid token.');
    }
  }

  async handleConnection(@ConnectedSocket() socket: Socket) {
    const token = socket.handshake.query.token as string;
    if (!token) {
      throw new UnauthorizedException('Token not found.');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);

      const newUser = await this.userService.findOne(payload.sub);
      this.connectedUsers.push({
        id: newUser.id,
        name: newUser.name,
        image: newUser.image,
      });
      this.logger.log(`connected : ${socket.id} ${socket.nsp.name} ${token}`);
    } catch (err) {
      throw new UnauthorizedException('Invalid token.');
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('submit_chat')
  handleSubmitChat(
    @MessageBody() chat: Chat,
    @ConnectedSocket() socket: Socket,
  ) {
    const { userId } = socket.data;
    const user = this.connectedUsers.find((user) => user.id === userId);
    socket.broadcast.emit('new_chat', {
      username: user.name,
      message: chat.message,
      socketId: socket.id,
    });
  }
}
