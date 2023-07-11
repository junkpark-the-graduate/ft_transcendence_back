import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class GameMatchmaker {
  private pool: Socket[] = [];

  constructor() {}

  public addPlayer(player: Socket): void {
    this.pool.push(player);
    this.pool.sort((a, b) => a['mmr'] - b['mmr']);
  }

  public removePlayer(player: Socket): void {
    const index = this.pool.indexOf(player);
    if (index !== -1) {
      this.pool.splice(index, 1);
    }
  }

  public matchPlayers(): [Socket, Socket] | null {
    console.log('pool.length: ', this.pool.length);
    if (this.pool.length < 2) {
      return null; // 플레이어가 충분하지 않을 때는 매칭을 진행하지 않음
    }
    let i: number;
    let now: number = Date.now();
    for (i = 0; i + 1 < this.pool.length; ++i) {
      const player1 = this.pool[i];
      const player2 = this.pool[i + 1];
      const range1 = player1['mmr'] + ((now - player1['matchTime']) / 1000) * 5;
      const range2 = player2['mmr'] - ((now - player2['matchTime']) / 1000) * 5;
      if (range1 >= range2) {
        this.removePlayer(player1);
        this.removePlayer(player2);
        return [player1, player2];
      }
    }
    return null;
  }
}
