import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ChannelMemberEntity } from '../entities/channel-member.entity';
import { ChannelService } from './channel.service';

@Injectable()
export class ChannelKickService {
  constructor(
    @Inject(forwardRef(() => ChannelService))
    private channelService: ChannelService,

    @InjectRepository(ChannelMemberEntity)
    private readonly channelMemberRepository: Repository<ChannelMemberEntity>,

    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  async kick(userId: number, channelId: number, memberId: number) {
    const channel = await this.channelService.findOne(channelId, [
      'channelMembers',
    ]);

    this.channelService.checkIsChannelAdmin(channel, userId);

    const channelMember = this.channelService.checkIsChannelMember(
      channel,
      memberId,
    );

    this.channelService.checkIsNotChannelOwner(channel, memberId);

    this.channelService.checkIsMe(userId, memberId);

    this.chatGateway.kickMember(channelId, memberId);

    await this.channelMemberRepository.delete({ userId: memberId });

    return channelMember;
  }
}
