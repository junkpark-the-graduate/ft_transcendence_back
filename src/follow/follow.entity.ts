import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Follow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  following: number;
}
