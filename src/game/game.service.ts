import { Injectable } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { GameQueryDto } from './dto/game-query.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameEntity } from './entities/game.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameEntity)
    private readonly gameRepository: Repository<GameEntity>,
  ) {}

  async findAll(gameQueryDto: GameQueryDto): Promise<GameEntity[]> {
    const { sort, offset, gameType } = gameQueryDto;

    return await this.gameRepository.find({
      where: {
        gameType: gameType === 'all' ? undefined : gameType,
      },
      order: {
        createdAt: sort.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
      },
      take: 10,
      skip: offset ? offset : 0,
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} game`;
  }

  getUserMatchHistory() {
    return `This action returns all game`;
  }
}
