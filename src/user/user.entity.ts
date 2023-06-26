import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

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

  @Column({ default: false })
  twoFactor: boolean;
}
