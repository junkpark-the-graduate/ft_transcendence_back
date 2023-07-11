import { ApiProperty } from '@nestjs/swagger';
import { GameRecordEntity } from 'src/game/entities/game-record.entity';
import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';

@Entity()
export class UserEntity {
  @PrimaryColumn({ unique: true, nullable: false })
  @ApiProperty()
  ftId: number;

  @ApiProperty()
  @Column({ unique: true, length: 250, nullable: false })
  email: string;

  @ApiProperty()
  @Column({ unique: true, length: 50, nullable: false })
  name: string;

  @ApiProperty()
  @Column({ nullable: true })
  image: string;

  @Column({ default: 1000 })
  mmr: number;

  @Column({ default: false })
  twoFactor: boolean;

  @OneToMany(() => GameRecordEntity, (gameRecord) => gameRecord.userFtId)
  gameRecords: GameRecordEntity[];
}
