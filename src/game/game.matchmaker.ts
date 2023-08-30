import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { GameType } from './game.constants';

interface Match {
  gameType: GameType;
  player1: Socket;
  player2: Socket;
}

@Injectable()
export class GameMatchmaker {
  private normalPool: Socket[] = [];
  private ladderPool: Socket[] = [];
  constructor() {}

  public addPlayer(gameType: GameType, player: Socket): void {
    switch (gameType) {
      case GameType.NORMAL:
        this.normalPool.push(player);
        this.normalPool.sort((a, b) => a['mmr'] - b['mmr']);
        break;
      case GameType.LADDER:
        this.ladderPool.push(player);
        this.ladderPool.sort((a, b) => a['mmr'] - b['mmr']);
        break;
    }
  }

  public removePlayer(player: Socket): void {
    let index = this.ladderPool.indexOf(player);
    if (index !== -1) {
      this.ladderPool.splice(index, 1);
    } else {
      index = this.normalPool.indexOf(player);
      if (index !== -1) {
        this.normalPool.splice(index, 1);
      }
    }
  }

  private matchPlayersByGameType(gameType: GameType): Match | null {
    const pool =
      gameType === GameType.LADDER ? this.ladderPool : this.normalPool;
    const now: number = Date.now();

    for (let i = 0; i + 1 < pool.length; ++i) {
      const player1 = pool[i];
      const player2 = pool[i + 1];
      const range1 = player1['mmr'] + (now - player1['matchTime']) / 200;
      const range2 = player2['mmr'] - (now - player2['matchTime']) / 200;
      if (range1 >= range2) {
        this.removePlayer(player1);
        this.removePlayer(player2);
        return { gameType, player1, player2 };
      }
    }
    return null;
  }

  public matchPlayers(): Match | null {
    // console.log('normalPool.length: ', this.normalPool.length);
    // console.log('ladderPool.length: ', this.ladderPool.length);
    if (this.ladderPool.length >= 2) {
      const match = this.matchPlayersByGameType(GameType.LADDER);
      if (match) return match;
    }
    if (this.normalPool.length >= 2) {
      const match = this.matchPlayersByGameType(GameType.NORMAL);
      if (match) return match;
    }
    return null;
  }
}
