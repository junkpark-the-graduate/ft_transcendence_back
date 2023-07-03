import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

const PADDLE_WIDTH = 8;
const PADDLE_HEIGHT = 1;
const PADDLE_SPEED = 1;
const BALL_SIZE = 1;
let BALL_SPEED = 0.5;
const PLANE_WIDTH = 50;
const PLANE_HEIGHT = 100;

@Injectable()
export class GameEngine {
  //gameInit() {
  //}

  gameUpdate(socket: Socket) {
    const paddle1 = socket['paddle1'];
    const paddle2 = socket['paddle2'];
    const ball = socket['ball'];

    ball.position.x += ball.dir.x * BALL_SPEED;
    ball.position.y += ball.dir.y * BALL_SPEED;
    paddle2.position.x = ball.position.x;

    // 1인칭
    // camera.position.x = paddle1.position.x;

    if (
      ball.position.x <= -PLANE_WIDTH / 2 ||
      ball.position.x >= PLANE_WIDTH / 2
    ) {
      ball.dir.x = -ball.dir.x;
    }
    if (
      ball.position.y <= -PLANE_HEIGHT / 2 ||
      ball.position.y >= PLANE_HEIGHT / 2
    ) {
      ball.position.x = 0;
      ball.position.y = 0;
    }

    if (
      ball.position.x <= paddle1.position.x + PADDLE_WIDTH / 2 &&
      ball.position.x >= paddle1.position.x - PADDLE_WIDTH / 2
    ) {
      if (
        ball.position.y <= paddle1.position.y + PADDLE_HEIGHT / 2 &&
        ball.position.y >= paddle1.position.y - PADDLE_HEIGHT / 2
      ) {
        ball.dir.x = (Math.random() - 0.5) * 2;
        ball.dir.y = -ball.dir.y;
        if (BALL_SPEED * 1.2 < PADDLE_HEIGHT) BALL_SPEED *= 1.2;
      }
    }

    if (
      ball.position.x <= paddle2.position.x + PADDLE_WIDTH / 2 &&
      ball.position.x >= paddle2.position.x - PADDLE_WIDTH / 2
    ) {
      // and if ball is aligned with paddle on y plane

      if (
        ball.position.y <= paddle2.position.y + PADDLE_HEIGHT / 2 &&
        ball.position.y >= paddle2.position.y - PADDLE_HEIGHT / 2
      ) {
        // ball is intersecting with the front half of the paddle
        ball.dir.x = (Math.random() - 0.5) * 2;
        ball.dir.y = -ball.dir.y;
        if (BALL_SPEED * 1.2 < PADDLE_HEIGHT) BALL_SPEED *= 1.2;
      }
    }
    return {
      paddle1: paddle1,
      paddle2: paddle2,
      ball: ball,
    };
  }
}
