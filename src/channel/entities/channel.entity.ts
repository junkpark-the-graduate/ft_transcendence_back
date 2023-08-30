import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChannelMemberEntity } from './channel-member.entity';
import { ChannelBannedMemberEntity } from './channel-banned-member.entity';
import { ChannelMutedMemberEntity } from './channel-muted-member.entity';
import { UserEntity } from 'src/user/user.entity';
import { Exclude } from 'class-transformer';
import { ChatEntity } from 'src/chat/chat.entity';

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
  @Column({ length: 300, nullable: true })
  @Exclude()
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

  @OneToMany(() => ChatEntity, (chat) => chat.channel, {
    cascade: true,
  })
  chats: ChatEntity[];

  @OneToMany(
    () => ChannelMemberEntity,
    (channelMember) => channelMember.channel,
    {
      cascade: true,
    },
  )
  channelMembers: ChannelMemberEntity[];

  @OneToMany(
    () => ChannelBannedMemberEntity,
    (channelBannedMember) => channelBannedMember.channel,
    {
      cascade: true,
    },
  )
  channelBannedMembers: ChannelBannedMemberEntity[];

  @OneToMany(
    () => ChannelMutedMemberEntity,
    (channelMutedMember) => channelMutedMember.channel,
    {
      cascade: true,
    },
  )
  channelMutedMembers: ChannelMutedMemberEntity[];

  @ManyToOne(() => UserEntity, (user) => user.channels)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
