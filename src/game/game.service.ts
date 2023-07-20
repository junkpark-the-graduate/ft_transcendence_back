import { Injectable } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { GameQueryDto } from './dto/game-query.dto';

@Injectable()
export class GameService {
  create() {
    return 'create';
  }

  findAll(gameQueryDto: GameQueryDto) {
    return `This action returns all game`;
  }

  findOne(id: number) {
    return `This action returns a #${id} game`;
  }

  getUserMatchHistory() {
    return `This action returns all game`;
  }
}
