import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryColumn,
  Generated,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Tfa {
  @ApiProperty()
  @PrimaryColumn({ unique: true, nullable: false })
  @Generated('uuid')
  twoFactorCode: string;

  @ApiProperty()
  @Column({ default: false })
  isValidated: boolean;

  @ApiProperty()
  @Column({ nullable: false, unique: true })
  ftId: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
