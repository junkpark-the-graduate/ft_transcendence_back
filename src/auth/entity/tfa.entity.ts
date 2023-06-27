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
export class TfaEntity {
  @ApiProperty()
  @PrimaryColumn({ unique: true, nullable: false })
  @Generated('uuid')
  twoFactorCode: string;

  @ApiProperty()
  @Column({ default: false })
  isValidated: boolean;

  @ApiProperty()
  @Column({ nullable: false, unique: true })
  id: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
