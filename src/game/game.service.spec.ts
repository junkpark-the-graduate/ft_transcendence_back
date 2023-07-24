import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameEntity } from './entities/game.entity';
import { Repository } from 'typeorm';
import { CreateGameDto } from './dto/create-game.dto';
import { GameQueryDto } from './dto/game-query.dto';
import { GameType } from './game.constants';

describe('GameService', () => {
  let service: GameService;
  let gameRepository: Repository<GameEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'postgres',
          password: 'password',
          database: 'test',
          synchronize: true,
          entities: [__dirname + '/**/*.entity'],
        }),
        TypeOrmModule.forFeature([GameEntity]),
      ],
      providers: [
        GameService,
        {
          provide: 'GameRepository',
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    gameRepository = module.get('GameRepository');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(gameRepository).toBeDefined();
    const type = [GameType.NORMAL, GameType.LADDER, GameType.FRIENDLY];
    for (let i = 0; i < 10; i++) {
      gameRepository.insert({
        player1Id: i, // random
        player2Id: i + 1, // random
        gameType: type[i % 3], // random
        gameResult: 'player1',
        createdAt: new Date(),
      });
    }
  });

    // it('should throw an error if the user does not exist', async () => {});
  });

  describe('findAll', () => {
    it('should be defined', () => {
      expect(service.findAll).toBeDefined();
    });

    it('should return an array of games', async () => {
      // given
      jest.spyOn(gameRepository, 'find').mockResolvedValueOnce([
        {
          id: 1,
          player1Id: 1,
          player2Id: 2,
          gameType: 'ladder',
          gameResult: 'player1',
          createdAt: new Date(),
        },
        {
          id: 2,
          player1Id: 1,
          player2Id: 2,
          gameType: 'ladder',
          gameResult: 'player1',
          createdAt: new Date(),
        },
        {
          id: 3,
          player1Id: 1,
          player2Id: 2,
          gameType: 'normal',
          gameResult: 'player2',
          createdAt: new Date(),
        },
      ]);

      // when
      const queryDto: GameQueryDto = {
        // find했을 때 3개의 길이짜리가 나옴
        sort: 'asc',
        offset: 0,
        type: GameType.LADDER,
      };
      const result = await service.findAll(queryDto);

      // then
      expect(result).toBeDefined();
      expect(result.length).toBe(2);
    });

    it('should return an empty array', async () => {});

    it('wrong query', async () => {});
  });

  describe('findOne', () => {
    it('should return a game', async () => {});

    it('should throw an error if the game does not exist', async () => {});
  });

  describe('getUserMatchHistory', () => {});
});
