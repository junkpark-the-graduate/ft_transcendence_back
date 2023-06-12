import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ unique: true, nullable: false })
  ftId: number;

  @ApiProperty()
  @Column({ length: 250, nullable: false })
  email: string;

  @ApiProperty()
  @Column({ length: 50, nullable: false })
  name: string;
}
