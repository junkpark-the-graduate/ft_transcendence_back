import { Injectable } from '@nestjs/common';
//import { Socket } from 'socket.io';
import { Server, Socket } from 'socket.io';
import {
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_SPEED,
  BALL_SIZE,
  BALL_SPEED,
  PLANE_WIDTH,
  PLANE_HEIGHT,
} from './game.constants';

interface Game {
  paddle1: {
    x: number;
    y: number;
  };
  paddle2: {
    x: number;
    y: number;
  };
  ball: {
    x: number;
    y: number;
  };
}

@Injectable()
export class GameEngine {
  //private gameData: Map<string, Game> = new Map<string, Game>();

  updateGame(player1, player2, room) {
    const game = {
      paddle1: player1['paddle'],
      paddle2: player2['paddle'],
      ball: {
        x: 0,
        y: 0,
      },
    };
    room.emit('game', game);
  }
  gameInit(player1, player2, room) {
    // const roomName = 'dummy_room';
    // this.gameData[roomName] = {
    //   player1,
    //   player2,
    //   ball: {
    //     x: 0,
    //     y: 0,
    //   },
    // };
    // const game = {
    //   player1,
    //   player2,
    //   ball: {
    //     x: 0,
    //     y: 0,
    //   },
    // };
    room['ball'] = {
      pos: {
        x: 0,
        y: 0,
      },
      dir: {
        x: 1,
        y: 1,
      },
    };
    player1.emit('game_init', { isPlayer1: true });
    player2.emit('game_init', { isPlayer1: false });

    player1['paddle'] = {
      x: 0,
      y: -30,
    };

    player2['paddle'] = {
      x: 0,
      y: 30,
    };

    // let game_init: Game;
    // game_init.paddle1.x = 0;
    // game_init.paddle1.y = -30;
    // game_init.paddle2.x = 0;
    // game_init.paddle2.y = 30;
    // game_init.ball.x = 0;
    // game_init.ball.y = 0;

    // player1['state'] = game_init;
    // player2['state'] = game_init;
  }

  // room.emit('game', {
  //   paddle1: { // if player1 -> 내꺼
  //     position: {
  //       x: 0,
  //       y: -30,
  //     },
  //   },
  //   paddle2: {
  //     position: { // 상대꺼?
  //       x: 0,
  //       y: 30,
  //     },

  // socket['paddle1'] = {
  //   position: {
  //     x: 0,
  //     y: -30,
  //   },
  // };
  // socket['paddle2'] = {
  //   position: {
  //     x: 0,
  //     y: 30,
  //   },
  // };
  // socket['ball'] = {
  //   position: {
  //     x: 0,
  //     y: 0,
  //   },
  //   dir: {
  //     x: 1,
  //     y: 1,
  //   },
  //   speed: 1,
  // };
  //}

  gameLoop(player1, player2, room: any) {
    const ball = room['ball'];
    const interval = setInterval(() => {
      room.emit('game', this.gameUpdate(player1, player2, ball));
    }, 1000 / 60);
    room['interval'] = interval;
  }

  movePaddleLeft(socket: Socket) {
    if (socket['paddle'].x > -(PLANE_WIDTH / 2) + PADDLE_WIDTH / 2)
      socket['paddle'].x -= PADDLE_SPEED;
  }
  movePaddleRight(socket: Socket) {
    if (socket['paddle'].x < PLANE_WIDTH / 2 - PADDLE_WIDTH / 2)
      socket['paddle'].x += PADDLE_SPEED;
  }

  gameUpdate(player1, player2, ball) {
    const paddle1 = player1['paddle'];
    const paddle2 = player2['paddle'];

    ball.pos.x += ball.dir.x * BALL_SPEED;
    ball.pos.y += ball.dir.y * BALL_SPEED;
    // paddle2.position.x = ball.pos.x;

    // 1인칭
    // camera.position.x = paddle1.position.x;

    if (ball.pos.x <= -PLANE_WIDTH / 2 || ball.pos.x >= PLANE_WIDTH / 2) {
      ball.dir.x = -ball.dir.x;
    }
    if (ball.pos.y <= -PLANE_HEIGHT / 2 || ball.pos.y >= PLANE_HEIGHT / 2) {
      ball.pos.x = 0;
      ball.pos.y = 0;
    }

    if (
      ball.pos.x <= paddle1.x + PADDLE_WIDTH / 2 &&
      ball.pos.x >= paddle1.x - PADDLE_WIDTH / 2
    ) {
      if (
        ball.pos.y <= paddle1.y + PADDLE_HEIGHT / 2 &&
        ball.pos.y >= paddle1.y - PADDLE_HEIGHT / 2
      ) {
        ball.dir.x = (Math.random() - 0.5) * 2;
        ball.dir.y = -ball.dir.y;
        //if (BALL_SPEED * 1.2 < PADDLE_HEIGHT) BALL_SPEED *= 1.2;
      }
    }

    if (
      ball.pos.x <= paddle2.x + PADDLE_WIDTH / 2 &&
      ball.pos.x >= paddle2.x - PADDLE_WIDTH / 2
    ) {
      // and if ball is aligned with paddle on y plane

      if (
        ball.pos.y <= paddle2.y + PADDLE_HEIGHT / 2 &&
        ball.pos.y >= paddle2.y - PADDLE_HEIGHT / 2
      ) {
        // ball is intersecting with the front half of the paddle
        ball.dir.x = (Math.random() - 0.5) * 2;
        ball.dir.y = -ball.dir.y;
        // if (BALL_SPEED * 1.2 < PADDLE_HEIGHT) BALL_SPEED *= 1.2;
      }
    }
    return {
      paddle1: player1['paddle'],
      paddle2: player2['paddle'],
      ball: {
        pos: ball.pos,
      },
    };

    // const { player1, player2, ball } = game;
    //const paddle1 = player1['paddle'];
    //const paddle2 = player2['paddle'];
    //const ball = player1['ball'];

    // return {
    //   paddle1: paddle1,
    //   paddle2: paddle2,
    //   ball: ball,
    // };
  }
}
