import { ApiProperty } from '@nestjs/swagger';
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
}
