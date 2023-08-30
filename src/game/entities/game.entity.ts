import { ApiProperty } from '@nestjs/swagger';
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
import { GameRecordEntity } from './game-record.entity';

@Entity()
export class GameEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column()
  player1Id: number;

  @ApiProperty()
  @Column()
  player2Id: number;

  @ApiProperty()
  @Column()
  gameType: string;

  @ApiProperty()
  @Column()
  gameResult: string;

  @ApiProperty()
  @Column()
  createdAt: Date;
}
