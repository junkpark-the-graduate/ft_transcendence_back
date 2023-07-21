import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { CreateChannelMutedMemberDto } from '../dto/create-channel-muted-member.dto';
import { DeleteChannelMutedMemberDto } from '../dto/delete-channel-muted-member.dto';
import { ChannelMutedMemberEntity } from '../entities/channel-muted-member.entity';
import { ChannelEntity } from '../entities/channel.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatService } from 'src/chat/chat.service';
import { ChannelMemberEntity } from '../entities/channel-member.entity';
import { ChannelService } from './channel.service';

@Injectable()
export class ChannelMuteService {
  constructor(
    private channelService: ChannelService,

    @InjectRepository(ChannelEntity)
    private readonly channelRepository: Repository<ChannelEntity>,

    @InjectRepository(ChannelMemberEntity)
    private readonly channelMemberRepository: Repository<ChannelMemberEntity>,

    @InjectRepository(ChannelMutedMemberEntity)
    private readonly channelMutedMemberRepository: Repository<ChannelMutedMemberEntity>,

    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  async mute(
    createChannelMutedMemberDto: CreateChannelMutedMemberDto,
    userId: number,
  ) {
    const channel = await this.channelService.findOne(
      createChannelMutedMemberDto.channelId,
      ['channelMembers', 'channelMutedMembers'],
    );

    this.channelService.checkIsChannelAdmin(channel, userId);

    this.channelService.checkIsChannelMember(
      channel,
      createChannelMutedMemberDto.userId,
    );

    this.channelService.checkIsNotChannelOwner(
      channel,
      createChannelMutedMemberDto.userId,
    );

    this.channelService.checkIsMe(userId, createChannelMutedMemberDto.userId);

    let mutedMember = channel.channelMutedMembers.find(
      (member) => member.userId === createChannelMutedMemberDto.userId,
    );

    if (mutedMember) return mutedMember;

    mutedMember = this.channelMutedMemberRepository.create(
      createChannelMutedMemberDto,
    );
    await this.channelMutedMemberRepository.save(mutedMember);

    this.chatService.addMutedMember(
      channel.id,
      mutedMember.userId,
      mutedMember.mutedTime,
      mutedMember.createdAt,
    );

    return mutedMember;
  }

  async unmute(channelId: number, userId: number) {
    const channel = await this.channelService.findOne(channelId, [
      'channelMembers',
      'channelMutedMembers',
    ]);

    const mutedMember = channel.channelMutedMembers.find(
      (member) => member.userId === userId,
    );

    console.log('mutedMember!!!!!!!!!!!!!!!!!!!!', mutedMember);
    // if (!mutedMember) throw new NotFoundException('채널 뮤트 멤버가 아닙니다.');
    if (!mutedMember) return;

    await this.channelMutedMemberRepository.delete({
      channelId: channelId,
      userId: userId,
    });

    return mutedMember;
  }

  // async deleteChannelMutedMember(
  //   userId: number,
  //   deleteChannelMutedMemberDto: DeleteChannelMutedMemberDto,
  // ): Promise<ChannelMutedMemberEntity> {
  //   const user = await this.channelMemberRepository.findOne({
  //     where: {
  //       userId,
  //       channelId: deleteChannelMutedMemberDto.channelId,
  //     },
  //   });
  //   if (!user) throw new NotFoundException('존재하지 않는 채널 멤버입니다.');
  //   if (!user.isAdmin)
  //     throw new UnauthorizedException('채널 관리자가 아닙니다.');

  //   const channelMutedMember = await this.channelMutedMemberRepository.findOne({
  //     where: {
  //       channelId: deleteChannelMutedMemberDto.channelId,
  //       userId: deleteChannelMutedMemberDto.userId,
  //     },
  //   });
  //   if (!channelMutedMember)
  //     throw new NotFoundException('존재하지 않는 채널 뮤트 멤버입니다.');

  //   await this.channelMutedMemberRepository.delete(deleteChannelMutedMemberDto);
  //   return channelMutedMember;
  // }
}
