import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from 'src/user/user.entity';
import { ChannelEntity } from 'src/channel/entities/channel.entity';

@Entity()
export class ChatEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @ApiProperty()
  @Column({ nullable: false })
  channelId: number;

  @ApiProperty()
  @Column({ nullable: false })
  userId: number;

  @ApiProperty()
  @Column({ nullable: false })
  message: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.chats)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => ChannelEntity, (channel) => channel.chats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'channelId' })
  channel: ChannelEntity;
}
