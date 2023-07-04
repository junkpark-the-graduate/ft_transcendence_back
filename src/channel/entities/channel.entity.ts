import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ChannelMemberEntity } from './channel-member.entity';
import { ChannelBlockedMemberEntity } from './channel-blocked-member.entity';
import { ChannelMutedMemberEntity } from './channel-muted-member.entity';

export enum EChannelType {
  direct,
  private,
  protected,
  public,
}

@Entity()
export class ChannelEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty()
  id: number;

  @ApiProperty()
  @Column({ nullable: false })
  ownerId: number;

  @ApiProperty()
  @Column({ unique: true, length: 50, nullable: false })
  name: string;

  @ApiProperty()
  @Column({ length: 50, nullable: true })
  password: string;

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: EChannelType,
    default: EChannelType.public,
  })
  type: EChannelType;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(
    () => ChannelMemberEntity,
    (channelMember) => channelMember.channel,
  )
  channelMembers: ChannelMemberEntity[];

  @OneToMany(
    () => ChannelBlockedMemberEntity,
    (channelBlockedMember) => channelBlockedMember.channel,
  )
  channelBlockedMembers: ChannelBlockedMemberEntity[];

  @OneToMany(
    () => ChannelMutedMemberEntity,
    (channelMutedMember) => channelMutedMember.channel,
  )
  channelMutedMembers: ChannelMutedMemberEntity[];
}
