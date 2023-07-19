import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelEntity } from '../entities/channel.entity';
import { Repository } from 'typeorm';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ChannelMemberEntity } from '../entities/channel-member.entity';

@Injectable()
export class ChannelKickService {
  constructor(
    @InjectRepository(ChannelEntity)
    private readonly channelRepository: Repository<ChannelEntity>,

    @InjectRepository(ChannelMemberEntity)
    private readonly channelMemberRepository: Repository<ChannelMemberEntity>,

    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  async kick(userId: number, channelId: number, memberId: number) {
    const channel = await this.channelRepository.findOne({
      where: {
        id: channelId,
      },
      relations: {
        channelMembers: true,
      },
    });
    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

    const admin = channel.channelMembers.find(
      (member) => member.userId === userId,
    );
    if (!admin) throw new NotFoundException('채널 멤버가 아닙니다.');
    if (!admin.isAdmin)
      throw new UnauthorizedException('채널 관리자가 아닙니다.');

    const channelMember = channel.channelMembers.find(
      (member) => member.userId === memberId,
    );
    if (!channelMember) throw new NotFoundException('채널 멤버가 아닙니다.');
    if (channelMember.userId === channel.ownerId)
      throw new UnauthorizedException('소유자는 쫓아낼 수 없습니다.');

    this.chatGateway.kickMember(channelId, memberId);

    await this.channelMemberRepository.delete({ userId: memberId });

    return channelMember;
  }
}
