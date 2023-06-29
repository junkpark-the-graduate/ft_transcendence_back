import { Logger } from '@nestjs/common';
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

interface Chat {
  username: string;
  message: string;
  socketId: string;
}

@WebSocketGateway(4242, {
  namespace: 'chattings',
  cors: { origin: 'http://localhost:3000', credentials: true },
})
export class ChatsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger('chat');

  constructor() {
    this.logger.log('constructor');
  }

  afterInit() {
    this.logger.log('init');
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log(`disconnected : ${socket.id} ${socket.nsp.name}`);
  }

  handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log(`connected : ${socket.id} ${socket.nsp.name}`);
  }

  @SubscribeMessage('submit_chat')
  handleSubmitChat(
    @MessageBody() chat: Chat,
    @ConnectedSocket() socket: Socket,
  ) {
    console.log('submit_chat!!!!!!!!!', chat);
    socket.broadcast.emit('new_chat', {
      username: chat.username,
      message: chat.message,
      socketId: socket.id,
    });
  }
}
