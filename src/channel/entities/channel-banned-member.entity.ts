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
import { ChannelEntity } from './channel.entity';
import { UserEntity } from 'src/user/user.entity';

@Entity()
export class ChannelBannedMemberEntity {
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
  @Column({ default: true })
  isBanned: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => ChannelEntity, (channel) => channel.channelBannedMembers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'channelId' })
  channel: ChannelEntity;

  @ManyToOne(() => UserEntity, (user) => user.channelBannedMembers)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
