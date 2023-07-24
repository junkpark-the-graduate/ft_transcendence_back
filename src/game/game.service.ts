import { Injectable, NotFoundException } from '@nestjs/common';
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
    const { sort, gameType, limit, offset } = gameQueryDto;

    return await this.gameRepository.find({
      where: {
        gameType: gameType,
      },
      order: {
        createdAt: sort,
      },
      take: limit,
      skip: offset * limit,
    });
  }

  async findOne(id: number) {
    const gameEntity = await this.gameRepository.findOne({
      where: {
        id: id,
      },
    });

    if (!gameEntity) {
      throw new NotFoundException('찾고자 하는 게임이 없습니다.');
    }
    return gameEntity;
  }

  getUserMatchHistory() {
    return `This action returns all game`;
  }

  test() {
    this.gameRepository.insert({
      player1Id: Math.round(Math.random() * 10000),
      player2Id: Math.round(Math.random() * 10000),
      // random
      gameType: ['normal', 'ladder', 'friendly'][
        Math.round(Math.random() * 3) % 3
      ],
      gameResult: ['player1', 'player2'][Math.round(Math.random() * 2) % 2],
      createdAt: new Date(),
    });
    return;
  }
}
