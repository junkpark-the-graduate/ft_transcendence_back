import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChannelEntity } from './channel.entity';
import { UserEntity } from 'src/user/user.entity';

@Entity()
export class ChannelMutedMemberEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @Column({ nullable: false })
  @ApiProperty()
  channelId: number;

  @ApiProperty()
  @Column({ nullable: false })
  userId: number;

  @ApiProperty()
  @Column({ default: true })
  isMuted: boolean;

  @ApiProperty()
  @Column({ default: 5 }) // 분 으로 단위 통일
  mutedTime: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => ChannelEntity, (channel) => channel.channelMembers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'channelId' })
  channel: ChannelEntity;

  @ManyToOne(() => UserEntity, (user) => user.channelMutedMembers)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
