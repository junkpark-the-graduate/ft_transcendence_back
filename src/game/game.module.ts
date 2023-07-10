import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { GameEngine } from './game.engine';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameEntity } from './entities/game.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GameEntity])],
  controllers: [GameController],
  providers: [GameService, GameGateway, GameEngine],
})
export class GameModule {}
