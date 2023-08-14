import { ApiProperty } from '@nestjs/swagger';
import { GameRecordEntity } from 'src/game/entities/game-record.entity';
import { ChannelBannedMemberEntity } from 'src/channel/entities/channel-banned-member.entity';
import { ChannelMemberEntity } from 'src/channel/entities/channel-member.entity';
import { ChannelMutedMemberEntity } from 'src/channel/entities/channel-muted-member.entity';
import { ChannelEntity } from 'src/channel/entities/channel.entity';
import {
  Entity,
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BlockEntity } from '../block/block.entity';
import { ChatEntity } from 'src/chat/chat.entity';
import { FollowEntity } from 'src/follow/follow.entity';

export enum EUserStatus {
  offline,
  online,
  gaming,
}

@Entity()
export class UserEntity {
  @PrimaryColumn({ unique: true, nullable: false })
  @ApiProperty()
  id: number;

  @ApiProperty()
  @Column({ unique: true, length: 50, nullable: false })
  name: string;

  @ApiProperty()
  @Column({ unique: true, length: 250, nullable: false })
  email: string;

  @ApiProperty()
  @Column({ nullable: true })
  image: string;

  @ApiProperty()
  @Column({ default: false })
  twoFactorEnabled: boolean;

  @OneToMany(() => GameRecordEntity, (gameRecord) => gameRecord.userFtId)
  gameRecords: GameRecordEntity[];

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: EUserStatus,
    default: EUserStatus.offline,
  })
  status: EUserStatus;

  @ApiProperty()
  @Column({ default: 1000 })
  mmr: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ChatEntity, (chat) => chat.user)
  chats: ChatEntity[];

  @OneToMany(() => ChannelEntity, (channel) => channel.user)
  channels: ChannelEntity[];

  @OneToMany(() => ChannelMemberEntity, (channelMember) => channelMember.user)
  channelMembers: ChannelMemberEntity[];

  @OneToMany(
    () => ChannelMutedMemberEntity,
    (channelMutedMember) => channelMutedMember.user,
  )
  channelMutedMembers: ChannelMutedMemberEntity[];

  @OneToMany(
    () => ChannelBannedMemberEntity,
    (channelBannedMember) => channelBannedMember.user,
  )
  channelBannedMembers: ChannelBannedMemberEntity[];

  @OneToMany(() => BlockEntity, (blockedUser) => blockedUser.user)
  users: BlockEntity[];

  @OneToMany(() => BlockEntity, (blockedUser) => blockedUser.blocking)
  blockings: BlockEntity[];

  @OneToMany(() => FollowEntity, (followedUser) => followedUser.user)
  usersForFollow: FollowEntity[];

  @OneToMany(() => FollowEntity, (followedUser) => followedUser.blocking)
  followings: FollowEntity[];
}
