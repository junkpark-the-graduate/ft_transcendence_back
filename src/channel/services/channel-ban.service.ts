import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { CreateChannelBannedMemberDto } from '../dto/create-channel-banned-member.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteChannelBannedMemberDto } from '../dto/delete-channel-banned-member.dto';
import { ChannelEntity } from '../entities/channel.entity';
import { Repository } from 'typeorm';
import { ChannelBannedMemberEntity } from '../entities/channel-banned-member.entity';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ChannelMemberEntity } from '../entities/channel-member.entity';

@Injectable()
export class ChannelBanService {
  constructor(
    @InjectRepository(ChannelEntity)
    private readonly channelRepository: Repository<ChannelEntity>,

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
    const channel = await this.channelRepository.findOne({
      where: {
        id: createChannelBannedMemberDto.channelId,
      },
      relations: {
        channelMembers: true,
        channelBannedMembers: true,
      },
    });
    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');
    const admin = channel.channelMembers.find(
      (member) => member.userId === userId,
    );
    if (!admin) throw new NotFoundException('채널 멤버가 아닙니다.');
    if (!admin.isAdmin)
      throw new UnauthorizedException('채널 관리자가 아닙니다');

    const channelMember = channel.channelMembers.find(
      (member) => member.userId === createChannelBannedMemberDto.userId,
    );
    if (!channelMember) throw new NotFoundException('채널 멤버가 아닙니다.');
    if (channelMember.userId === channel.ownerId)
      throw new UnauthorizedException(' 밴할 소유자는수 없습니다.');

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
    const user = await this.channelMemberRepository.findOne({
      where: {
        userId,
        channelId: deleteChannelBannedMemberDto.channelId,
      },
    });
    if (!user) throw new NotFoundException('존재하지 않는 채널 멤버입니다.');
    if (!user.isAdmin)
      throw new UnauthorizedException('채널 관리자가 아닙니다.');

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
