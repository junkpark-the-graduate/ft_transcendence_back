import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import {
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_SPEED,
  BALL_SIZE,
  BALL_SPEED,
  PLANE_WIDTH,
  PLANE_HEIGHT,
  WIN_SCORE,
  MMR_K,
} from './game.constants';
import { GameEntity } from './entities/game.entity';
import { UserService } from 'src/user/user.service';

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
  constructor(
    @InjectRepository(GameEntity)
    private readonly gameRepository: Repository<GameEntity>,
    private userService: UserService,
  ) {}

  gameInit(room) {
    const { player1, player2 } = room;

    room['startTime'] = new Date();
    room['ball'] = {
      pos: {
        x: 0,
        y: 0,
      },
      dir: {
        x: 0,
        y: 1,
      },
    };
    room['score'] = {
      player1: 0,
      player2: 0,
    };
    player1['paddle'] = {
      x: 0,
      y: -30,
    };

    player2['paddle'] = {
      x: 0,
      y: 30,
    };

    player1['isPlayer1'] = true;
    player2['isPlayer1'] = false;
  }

  gameLoop(room: any) {
    const interval = setInterval(() => {
      room.emit('game', this.gameUpdate(room));
    }, 1000 / 60);
    room['interval'] = interval;
  }

  movePaddleLeft(socket: Socket) {
    if (socket['isPlayer1']) {
      if (socket['paddle'].x > -(PLANE_WIDTH / 2) + PADDLE_WIDTH / 2)
        socket['paddle'].x -= PADDLE_SPEED;
    } else {
      if (socket['paddle'].x < PLANE_WIDTH / 2 - PADDLE_WIDTH / 2)
        socket['paddle'].x += PADDLE_SPEED;
    }
  }
  movePaddleRight(socket: Socket) {
    if (socket['isPlayer1']) {
      if (socket['paddle'].x < PLANE_WIDTH / 2 - PADDLE_WIDTH / 2)
        socket['paddle'].x += PADDLE_SPEED;
    } else {
      if (socket['paddle'].x > -(PLANE_WIDTH / 2) + PADDLE_WIDTH / 2)
        socket['paddle'].x -= PADDLE_SPEED;
    }
  }

  private getResult(room: any) {
    const { player1, player2 } = room;

    if (room.score.player1 === WIN_SCORE) {
      return { winner: player1, loser: player2 };
    } else if (room.score.player2 === WIN_SCORE) {
      return { winner: player2, loser: player1 };
    }
    return null;
  }

  private updateMmr(result: any) {
    const { winner, loser } = result;

    // Elo system
    const winner_rate = 1 / (10 ** ((loser['mmr'] - winner['mmr']) / 400) + 1);
    winner['mmr'] += MMR_K * (1 - winner_rate);
    loser['mmr'] -= MMR_K * (1 - winner_rate);

    console.log('change rate', MMR_K * (1 - winner_rate));
    this.userService.updateMmr(winner['ftId'], Math.round(winner['mmr']));
    this.userService.updateMmr(loser['ftId'], Math.round(loser['mmr']));
  }

  private endGame(room: any, result: any) {
    const { player1, player2 } = room;
    const { winner, loser } = result;

    clearInterval(room['interval']);
    const game = this.gameRepository.create({
      player1Id: player1['ftId'],
      player2Id: player2['ftId'],
      gameType: room['type'],
      gameResult: winner === player1 ? 'player1' : 'player2',
      startTime: room['startTime'],
    });
    this.gameRepository.save(game);

    winner.emit('game_over', true);
    loser.emit('game_over', false);

    if (room['type'] === 'ladder') {
      this.updateMmr(result);
    }
    player1['room'] = null;
    player2['room'] = null;
    room.disconnectSockets(true);
  }

  private checkBoundaryCollision(room: any, ball: any) {
    if (ball.pos.x <= -PLANE_WIDTH / 2 || ball.pos.x >= PLANE_WIDTH / 2) {
      ball.dir.x = -ball.dir.x;
    }
    if (ball.pos.y <= -PLANE_HEIGHT / 2 || ball.pos.y >= PLANE_HEIGHT / 2) {
      ball.dir.x = 0;
      if (ball.pos.y > 0) {
        room.score.player1++;
        ball.dir.y = 1;
      } else {
        room.score.player2++;
        ball.dir.y = -1;
      }
      room.emit('score', { score: room.score });
      ball.pos.x = 0;
      ball.pos.y = 0;

      const result = this.getResult(room);
      if (result) {
        this.endGame(room, result);
      }
    }
  }

  private checkPaddleCollision(ball: any, paddle: any) {
    if (
      ball.pos.x <= paddle.x + PADDLE_WIDTH / 2 &&
      ball.pos.x >= paddle.x - PADDLE_WIDTH / 2
    ) {
      if (
        ball.pos.y <= paddle.y + PADDLE_HEIGHT / 2 &&
        ball.pos.y >= paddle.y - PADDLE_HEIGHT / 2
      ) {
        ball.dir.x = (Math.random() - 0.5) * 2;
        ball.dir.y = -ball.dir.y;
        // if (BALL_SPEED * 1.2 < PADDLE_HEIGHT) BALL_SPEED *= 1.2;
      }
    }
  }

  private gameUpdate(room: any) {
    const { player1, player2, ball } = room;
    const paddle1 = player1['paddle'];
    const paddle2 = player2['paddle'];

    ball.pos.x += ball.dir.x * BALL_SPEED;
    ball.pos.y += ball.dir.y * BALL_SPEED;
    this.checkBoundaryCollision(room, ball);
    this.checkPaddleCollision(ball, paddle1);
    this.checkPaddleCollision(ball, paddle2);

    return {
      paddle1: paddle1,
      paddle2: paddle2,
      ball: {
        pos: ball.pos,
      },
    };
  }
}
