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

  gameInit(room) {
    const { player1, player2 } = room;

    setTimeout(() => {
      player1.emit('game_init', { isPlayer1: true });
      player2.emit('game_init', { isPlayer1: false });
    }, 1000);
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
    if (room['interval']) clearInterval(room['interval']);

    setTimeout(() => {
      const interval = setInterval(() => {
        room.emit('game', this.gameUpdate(room));
      }, 1000 / 60);
      room['interval'] = interval;
    }, 3000);
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

  gameUpdate(room) {
    const { player1, player2, ball } = room;
    const paddle1 = player1['paddle'];
    const paddle2 = player2['paddle'];

    ball.pos.x += ball.dir.x * BALL_SPEED;
    ball.pos.y += ball.dir.y * BALL_SPEED;
    // paddle2.position.x = ball.pos.x;

    // 1인칭
    // camera.position.x = paddle1.position.x;

    // 벽
    if (ball.pos.x <= -PLANE_WIDTH / 2 || ball.pos.x >= PLANE_WIDTH / 2) {
      ball.dir.x = -ball.dir.x;
    }

    // 점수
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
      // 일정 점수 도달 시 db 저장
      if (room.score.player1 === WIN_SCORE) {
        clearInterval(room['interval']);
        player1.emit('game_over', true);
        player2.emit('game_over', false);
        const game = this.gameRepository.create({
          player1Id: player1['ftId'],
          player2Id: player2['ftId'],
          gameType: room['type'],
          gameResult: 'player1',
          startTime: new Date(),
        });
        this.gameRepository.save(game);
        // mmr 갱신
        if (room['type'] === 'ladder') {
          const win_rate1 =
            1 / (10 ** ((player2['mmr'] - player1['mmr']) / 400) + 1);
          player1['mmr'] += MMR_K * (1 - win_rate1);
          player2['mmr'] += MMR_K * (win_rate1 - 1);
          this.userService.update(player1['ftId'], {
            mmr: player1['mmr'],
          });
          this.userService.update(player2['ftId'], {
            mmr: player2['mmr'],
          });
          console.log('player1["mmr"]: ', player1['mmr']);
          console.log('player2["mmr"]: ', player2['mmr']);
        }
        player1.leave('dummy_room');
        player2.leave('dummy_room');
      } else if (room.score.player2 === WIN_SCORE) {
        clearInterval(room['interval']);
        player1.emit('game_over', false);
        player2.emit('game_over', true);
        const game = this.gameRepository.create({
          player1Id: player1['ftId'],
          player2Id: player2['ftId'],
          gameType: room['type'],
          gameResult: 'player2',
          startTime: new Date(),
        });
        this.gameRepository.save(game);
        if (room['type'] === 'ladder') {
          const win_rate1 =
            1 / (10 ** ((player2['mmr'] - player1['mmr']) / 400) + 1);
          player1['mmr'] += MMR_K * (win_rate1 - 1);
          player2['mmr'] += MMR_K * (1 - win_rate1);
          this.userService.update(player1['ftId'], {
            mmr: player1['mmr'],
          });
          this.userService.update(player2['ftId'], {
            mmr: player2['mmr'],
          });
          console.log('player1["mmr"]: ', player1['mmr']);
          console.log('player2["mmr"]: ', player2['mmr']);
        }
        player1.leave('dummy_room');
        player2.leave('dummy_room');
      }
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
      if (
        ball.pos.y <= paddle2.y + PADDLE_HEIGHT / 2 &&
        ball.pos.y >= paddle2.y - PADDLE_HEIGHT / 2
      ) {
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
  }
}
