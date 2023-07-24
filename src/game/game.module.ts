import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { GameEngine } from './game.engine';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameEntity } from './entities/game.entity';
import { GameMatchmaker } from './game.matchmaker';
import { UserService } from 'src/user/user.service';
import { UserEntity } from 'src/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameEntity]),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [GameController],
  providers: [
    GameService,
    GameGateway,
    GameEngine,
    GameMatchmaker,
    UserService,
  ],
})
export class GameModule {}
