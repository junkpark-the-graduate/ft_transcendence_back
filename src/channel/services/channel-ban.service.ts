import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CreateChannelBannedMemberDto } from '../dto/create-channel-banned-member.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteChannelBannedMemberDto } from '../dto/delete-channel-banned-member.dto';
import { Repository } from 'typeorm';
import { ChannelBannedMemberEntity } from '../entities/channel-banned-member.entity';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ChannelMemberEntity } from '../entities/channel-member.entity';
import { ChannelService } from './channel.service';

@Injectable()
export class ChannelBanService {
  constructor(
    private channelService: ChannelService,

    @InjectRepository(ChannelMemberEntity)
    private readonly channelMemberRepository: Repository<ChannelMemberEntity>,

    @InjectRepository(ChannelBannedMemberEntity)
    private readonly channelBannedMemberRepository: Repository<ChannelBannedMemberEntity>,

    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  async ban(
    createChannelBannedMemberDto: CreateChannelBannedMemberDto,
    userId: number,
  ) {
    const channel = await this.channelService.findOne(
      createChannelBannedMemberDto.channelId,
      ['channelMembers', 'channelBannedMembers'],
    );

    this.channelService.checkIsChannelAdmin(channel, userId);

    this.channelService.checkIsChannelMember(
      channel,
      createChannelBannedMemberDto.userId,
    );

    this.channelService.checkIsNotChannelOwner(
      channel,
      createChannelBannedMemberDto.userId,
    );

    this.channelService.checkIsMe(userId, createChannelBannedMemberDto.userId);

    let banMember = channel.channelBannedMembers.find(
      (member) => member.userId === createChannelBannedMemberDto.userId,
    );
    if (banMember) return banMember;
    banMember = this.channelBannedMemberRepository.create(
      createChannelBannedMemberDto,
    );
    await this.channelBannedMemberRepository.save(banMember);

    this.chatGateway.kickMember(
      createChannelBannedMemberDto.channelId,
      createChannelBannedMemberDto.userId,
    );

    await this.channelMemberRepository.delete(createChannelBannedMemberDto);
    return banMember;
  }

  async deleteChannelBannedMember(
    userId: number,
    deleteChannelBannedMemberDto: DeleteChannelBannedMemberDto,
  ): Promise<ChannelBannedMemberEntity> {
    const channel = await this.channelService.findOne(
      deleteChannelBannedMemberDto.channelId,
      ['channelMembers', 'channelBannedMembers'],
    );

    this.channelService.checkIsChannelAdmin(channel, userId);

    const channelBannedMember =
      await this.channelBannedMemberRepository.findOne({
        where: {
          channelId: deleteChannelBannedMemberDto.channelId,
          userId: deleteChannelBannedMemberDto.userId,
        },
      });
    if (!channelBannedMember)
      throw new NotFoundException('존재하지 않는 채널 차단 멤버입니다.');

    await this.channelBannedMemberRepository.delete(
      deleteChannelBannedMemberDto,
    );
    return channelBannedMember;
  }
}
