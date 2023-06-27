import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EUserStatus {
  offline,
  online,
  gaming,
}

@Entity()
export class UserEntity {
  @PrimaryColumn({ unique: true, nullable: false })
  @ApiProperty()
  id: number;

  @ApiProperty()
  @Column({ unique: true, length: 50, nullable: false })
  name: string;

  @ApiProperty()
  @Column({ unique: true, length: 250, nullable: false })
  email: string;

  @ApiProperty()
  @Column({ nullable: true })
  image: string;

  @ApiProperty()
  @Column({ default: false })
  twoFactorEnabled: boolean;

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: EUserStatus,
    default: EUserStatus.offline,
  })
  status: EUserStatus;

  @ApiProperty()
  @Column({ default: 1000 })
  mmr: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
