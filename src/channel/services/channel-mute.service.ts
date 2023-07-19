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

@Injectable()
export class ChannelMuteService {
  constructor(
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
    const channel = await this.channelRepository.findOne({
      where: {
        id: createChannelMutedMemberDto.channelId,
      },
      relations: {
        channelMembers: true,
        channelMutedMembers: true,
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
      (member) => member.userId === createChannelMutedMemberDto.userId,
    );
    if (!channelMember) throw new NotFoundException('채널 멤버가 아닙니다.');
    if (channelMember.userId === channel.ownerId)
      throw new UnauthorizedException('소유자는 뮤트할 수 없습니다.');

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
    const channel = await this.channelRepository.findOne({
      where: {
        id: channelId,
      },
      relations: {
        channelMembers: true,
        channelMutedMembers: true,
      },
    });
    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

    const mutedMember = channel.channelMutedMembers.find(
      (member) => member.userId === userId,
    );
    if (!mutedMember) throw new NotFoundException('채널 뮤트 멤버가 아닙니다.');

    await this.channelMutedMemberRepository.delete({
      channelId: channelId,
      userId: userId,
    });

    return mutedMember;
  }

  async deleteChannelMutedMember(
    userId: number,
    deleteChannelMutedMemberDto: DeleteChannelMutedMemberDto,
  ): Promise<ChannelMutedMemberEntity> {
    const user = await this.channelMemberRepository.findOne({
      where: {
        userId,
        channelId: deleteChannelMutedMemberDto.channelId,
      },
    });
    if (!user) throw new NotFoundException('존재하지 않는 채널 멤버입니다.');
    if (!user.isAdmin)
      throw new UnauthorizedException('채널 관리자가 아닙니다.');

    const channelMutedMember = await this.channelMutedMemberRepository.findOne({
      where: {
        channelId: deleteChannelMutedMemberDto.channelId,
        userId: deleteChannelMutedMemberDto.userId,
      },
    });
    if (!channelMutedMember)
      throw new NotFoundException('존재하지 않는 채널 뮤트 멤버입니다.');

    await this.channelMutedMemberRepository.delete(deleteChannelMutedMemberDto);
    return channelMutedMember;
  }
}
