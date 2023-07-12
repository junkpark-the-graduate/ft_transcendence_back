import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { GameType } from './game.constants';

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

  public matchPlayers(): [GameType, Socket, Socket] | null {
    console.log('normalPool.length: ', this.normalPool.length);
    console.log('ladderPool.length: ', this.ladderPool.length);
    const now: number = Date.now();
    if (this.ladderPool.length >= 2) {
      for (let i = 0; i + 1 < this.ladderPool.length; ++i) {
        const player1 = this.ladderPool[i];
        const player2 = this.ladderPool[i + 1];
        const range1 = player1['mmr'] + (now - player1['matchTime']) / 200;
        const range2 = player2['mmr'] - (now - player2['matchTime']) / 200;
        if (range1 >= range2) {
          this.removePlayer(player1);
          this.removePlayer(player2);
          return [GameType.LADDER, player1, player2];
        }
      }
    }
    if (this.normalPool.length >= 2) {
      for (let i = 0; i + 1 < this.normalPool.length; ++i) {
        const player1 = this.normalPool[i];
        const player2 = this.normalPool[i + 1];
        const range1 =
          player1['mmr'] + ((now - player1['matchTime']) / 1000) * 5;
        const range2 =
          player2['mmr'] - ((now - player2['matchTime']) / 1000) * 5;
        if (range1 >= range2) {
          this.removePlayer(player1);
          this.removePlayer(player2);
          return [GameType.NORMAL, player1, player2];
        }
      }
    }
    return null;
  }
}
