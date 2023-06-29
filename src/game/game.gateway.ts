import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway(4242, {
  namespace: 'game',
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger('GameGateway');

  constructor() {
    this.logger.log('GameGateway constructor');
  }

  afterInit(server: any) {
    this.logger.log('GameGateway initialized');
  }

  handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log(`Client connected: ${socket.id}`);
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log(`Client disconnected: ${socket.id}`);
  }

  @SubscribeMessage('hello')
  handleHello(@ConnectedSocket() socket: Socket, @MessageBody() data) {
    console.log(data);

    this.logger.log(`Client ${socket.id} says hello`);
    socket.emit('hello', `Hello ${socket.id}`);
  }
}
