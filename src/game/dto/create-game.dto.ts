import { GameEntity } from '../entities/game.entity';
import { OmitType } from '@nestjs/mapped-types';

export class CreateGameDto extends OmitType(GameEntity, ['id'] as const) {}
