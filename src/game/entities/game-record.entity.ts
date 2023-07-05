import { ApiProperty } from '@nestjs/swagger';
import { GameEntity } from './game.entity';
import { UserEntity } from 'src/user/user.entity';
import {
  Entity,
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class GameRecordEntity {
  @ApiProperty()
  @PrimaryColumn()
  userFtId: number;

  @ApiProperty()
  @PrimaryColumn()
  gameId: number;

  //@JoinColumn({ name: 'gameId' })
  @ManyToOne(() => GameEntity, (game) => game.id)
  game: GameEntity;

  //@JoinColumn({ name: 'userId' })
  @ManyToOne(() => UserEntity, (user) => user.ftId)
  user: UserEntity;
}
