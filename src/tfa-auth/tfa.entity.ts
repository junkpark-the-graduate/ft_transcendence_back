import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryColumn, Generated, OneToOne } from 'typeorm';

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
  @Column({ nullable: false })
  ftId: number;

  @ApiProperty()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
