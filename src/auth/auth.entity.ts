import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryColumn, Generated, OneToOne } from 'typeorm';

@Entity()
export class Auth {
  @ApiProperty()
  @PrimaryColumn({ unique: true, nullable: false })
  @Generated('uuid')
  twoFactorToken: string;

  @ApiProperty()
  @Column({ default: false })
  isValidated: boolean;

  @ApiProperty()
  @Column({ nullable: false })
  ftId: number;
}
