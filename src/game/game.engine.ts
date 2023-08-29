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
import { GameService } from './game.service';

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

export enum Role {
  Player1,
  Player2,
  Spectator,
}

@Injectable()
export class GameEngine {
  constructor(
    @InjectRepository(GameEntity)
    private readonly gameRepository: Repository<GameEntity>,
    private gameService: GameService,
    private userService: UserService,
  ) {}

  gameInit(room) {
    const { player1, player2 } = room;

    room['createdAt'] = new Date();
    room['ball'] = {
      pos: {
        x: 0,
        y: 0,
      },
      dir: {
        x: 0,
        y: 1,
      },
      speed: BALL_SPEED,
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

    player1['role'] = Role.Player1;
    player2['role'] = Role.Player2;
  }

  gameLoop(room: any) {
    let timeout = 0;
    const ready_interval = setInterval(() => {
      console.log('timeout: ', timeout);
      if (room['readyCount'] === 2 || timeout > 30) {
        room['isPlaying'] = true;
        clearInterval(ready_interval);
        const interval = setInterval(() => {
          room.emit('game', this.gameUpdate(room));
        }, 1000 / 60);
        room['interval'] = interval;
      }
      ++timeout;
    }, 1000);
  }

  movePaddleLeft(socket: Socket) {
    if (socket['role'] === Role.Player1) {
      if (socket['paddle'].x > -(PLANE_WIDTH / 2) + PADDLE_WIDTH / 2)
        socket['paddle'].x -= PADDLE_SPEED;
    } else if (socket['role'] === Role.Player2) {
      if (socket['paddle'].x < PLANE_WIDTH / 2 - PADDLE_WIDTH / 2)
        socket['paddle'].x += PADDLE_SPEED;
    }
  }
  movePaddleRight(socket: Socket) {
    if (socket['role'] === Role.Player1) {
      if (socket['paddle'].x < PLANE_WIDTH / 2 - PADDLE_WIDTH / 2)
        socket['paddle'].x += PADDLE_SPEED;
    } else if (socket['role'] === Role.Player2) {
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

  private async endGame(room: any, result: any) {
    const { player1, player2 } = room;
    const { winner, loser } = result;

    clearInterval(room['interval']);
    this.gameService.saveGameResult({
      player1Id: player1['ftId'],
      player2Id: player2['ftId'],
      gameType: room['type'],
      gameResult: winner === player1 ? 'player1' : 'player2',
      createdAt: room['createdAt'],
    });

    let mmrChange: number;
    if (room['type'] === 'ladder') {
      mmrChange = Math.round(
        MMR_K * (1 - 1 / (10 ** ((loser['mmr'] - winner['mmr']) / 400) + 1)),
      );
      winner['mmr'] += mmrChange;
      loser['mmr'] -= mmrChange;
      this.userService.updateMmr(winner['ftId'], winner['mmr']);
      this.userService.updateMmr(loser['ftId'], loser['mmr']);
    }

    const player1Data = await this.userService.findOne(player1['ftId']);
    const player2Data = await this.userService.findOne(player2['ftId']);
    room.emit('game_over', {
      gameResult: {
        gameType: room['type'],
        gameWinner: winner === player1 ? player1Data.name : player2Data.name,
        playTime: new Date().getTime() - room['createdAt'].getTime(),
        score: room.score.player1 + ' : ' + room.score.player2,
        player1: {
          ...player1Data,
          isWin: winner === player1,
          mmr: Math.round(player1['mmr']),
          mmrChange: room['type'] === 'ladder' ? mmrChange : 0,
        },
        player2: {
          ...player2Data,
          isWin: winner === player2,
          mmr: Math.round(player2['mmr']),
          mmrChange: room['type'] === 'ladder' ? mmrChange : 0,
        },
      },
    });
    room.fetchSockets().then((sockets) => {
      sockets.forEach((socket) => {
        socket['room'] = null;
      });
    });
    room.socketsLeave(room['roomId']);
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
      ball.pos.x = 0;
      ball.pos.y = 0;
      ball.speed = BALL_SPEED;

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
        if (ball.speed * 1.1 < PADDLE_HEIGHT) ball.speed *= 1.1;
      }
    }
  }

  private gameUpdate(room: any) {
    const { player1, player2, ball } = room;
    const paddle1 = player1['paddle'];
    const paddle2 = player2['paddle'];

    ball.pos.x += ball.dir.x * ball.speed;
    ball.pos.y += ball.dir.y * ball.speed;
    this.checkBoundaryCollision(room, ball);
    this.checkPaddleCollision(ball, paddle1);
    this.checkPaddleCollision(ball, paddle2);

    return {
      score: room.score,
      paddle1: paddle1,
      paddle2: paddle2,
      ball: {
        pos: ball.pos,
      },
    };
  }
}
