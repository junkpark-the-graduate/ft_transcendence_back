import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { GameEngine } from './game.engine';

@Module({
  controllers: [GameController],
  providers: [GameService, GameGateway, GameEngine],
})
export class GameModule {}
