import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { GameQueryDto } from './dto/game-query.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GameEntity } from './entities/game.entity';
import { GameRecordEntity } from './entities/game-record.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameEntity)
    private readonly gameRepository: Repository<GameEntity>,
    @InjectRepository(GameRecordEntity)
    private readonly gameRecordRepository: Repository<GameRecordEntity>,
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

  async getUserMatchHistory(
    id: number,
    gameQueryDto: GameQueryDto,
  ): Promise<GameEntity[]> {
    const { sort, gameType, limit, offset } = gameQueryDto;

    const gameRecordEntities = await this.gameRecordRepository.find({
      where: {
        userFtId: id,
      },
    });

    const gameIds = gameRecordEntities.map((gameRecordEntity) => {
      return gameRecordEntity.gameId;
    });

    let gameEntities = await this.gameRepository.findBy({
      id: In(gameIds),
      gameType: gameType,
    });

    if (sort === 'DESC') {
      gameEntities.reverse();
    }

    gameEntities = gameEntities.splice(offset * limit, limit);
    return gameEntities;
  }

  async saveGameResult(createGameDto: CreateGameDto) {
    const { player1Id, player2Id, gameType, gameResult } = createGameDto;

    const gameEntity = this.gameRepository.create({
      player1Id,
      player2Id,
      gameType,
      gameResult,
      createdAt: new Date(),
    });

    const savedGameEntity = await this.gameRepository.save(gameEntity);

    console.log(savedGameEntity);

    const gameRecord1 = this.gameRecordRepository.create({
      userFtId: player1Id,
      gameId: savedGameEntity.id,
    });

    const gameRecord2 = this.gameRecordRepository.create({
      userFtId: player2Id,
      gameId: savedGameEntity.id,
    });

    const savedGameRecord1 = await this.gameRecordRepository.save(gameRecord1);
    const savedGameRecord2 = await this.gameRecordRepository.save(gameRecord2);

    console.log(savedGameRecord1);
    console.log(savedGameRecord2);
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
