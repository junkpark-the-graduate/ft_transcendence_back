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

@WebSocketGateway(4242, {
  namespace: 'game',
  cors: {
    origin: [
      'http://127.0.0.1:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3001',
      'http://localhost:3001',
    ],
    credentials: true,
  },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() io: Server;
  private logger = new Logger('GameGateway');

  constructor(private gameEngine: GameEngine) {
    this.logger.log('GameGateway constructor');
  }

  afterInit(server: any) {
    this.logger.log('GameGateway initialized');
  }

  async handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log(`Client connected: ${socket.id}`);

    socket.join('dummy_room');
    console.log('socket.rooms: ', socket.rooms);

    // check two player
    const clientsInRoom = await this.io.in('dummy_room').fetchSockets();
    //console.log(clientsInRoom);
    if (clientsInRoom.length === 2) {
      const player1 = clientsInRoom[0];
      const player2 = clientsInRoom[1];

      const room = this.io.in('dummy_room');
      this.io.in('dummy_room').emit('game_test', 'Game start');
      this.gameEngine.gameInit(player1, player2, room);
      console.log('room["test"]: ', room['test']);
      this.gameEngine.gameLoop(player1, player2, room);

      console.log('player1: ', player1['paddle1']);
      // this.gameEngine.gameLoop(socket);
    } else {
      socket.emit('game_test', 'Waiting for another player');
    }
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log(`Client disconnected: ${socket.id}`);
    // TODO interval 삭제
    //const interval = socket['interval'];
    //const interval = this.io.in('dummy_room')['interval'];

    socket.leave('dummy_room');
    //clearInterval(interval);
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
