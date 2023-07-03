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
import { GameEngine } from './game.engine';

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

  constructor(private gameEngine: GameEngine) {
    this.logger.log('GameGateway constructor');
  }

  afterInit(server: any) {
    this.logger.log('GameGateway initialized');
  }

  handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log(`Client connected: ${socket.id}`);

    socket['paddle1'] = {
      position: {
        x: 0,
        y: -30,
      },
    };
    socket['paddle2'] = {
      position: {
        x: 0,
        y: 30,
      },
    };
    socket['ball'] = {
      position: {
        x: 0,
        y: 0,
      },
      dir: {
        x: 1,
        y: 1,
      },
      speed: 1,
    };

    const interval = setInterval(() => {
      //socket.emit('game', 'Game event');

      socket.emit('game', this.gameEngine.gameUpdate(socket));
    }, 1000 / 60);

    socket['interval'] = interval;
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    const interval = socket['interval'];
    this.logger.log(`Client disconnected: ${socket.id}`);

    clearInterval(interval);
  }

  @SubscribeMessage('key_left')
  handleHello(@ConnectedSocket() socket: Socket, @MessageBody() data) {
    socket['paddle1'].position.x -= 0.5;
    //console.log('key_left');
  }

  @SubscribeMessage('key_right')
  handleKeyRight(@ConnectedSocket() socket: Socket, @MessageBody() data) {
    socket['paddle1'].position.x += 0.5;
    //console.log('key_right');
  }
}
