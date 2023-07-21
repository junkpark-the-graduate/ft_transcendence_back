import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateChannelMemberDto } from '../dto/create-channel-member.dto';
import { DeleteChannelMemberDto } from '../dto/delete-channel-member.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelEntity } from '../entities/channel.entity';
import { Repository } from 'typeorm';
import { ChannelMemberEntity } from '../entities/channel-member.entity';
import { ChannelService } from './channel.service';
import { ChatService } from 'src/chat/chat.service';
import { ChannelKickService } from './channel-kick.service';

@Injectable()
export class ChannelMemberService {
  constructor(
    private channelService: ChannelService,

    private chatService: ChatService,

    private channelKickService: ChannelKickService,

    @InjectRepository(ChannelEntity)
    private readonly channelRepository: Repository<ChannelEntity>,

    @InjectRepository(ChannelMemberEntity)
    private readonly channelMemberRepository: Repository<ChannelMemberEntity>,
  ) {}

  async join(createChannelMemberDto: CreateChannelMemberDto) {
    const channel = await this.channelService.findOne(
      createChannelMemberDto.channelId,
      ['channelMembers', 'channelBannedMembers'],
    );

    // Todo: 비밀번호 체크
    // if (channel.password !== createChannelMemberDto.password)
    //   throw new ConflictException('비밀번호가 틀렸습니다.');

    if (
      channel.channelMembers.find(
        (member) => member.userId === createChannelMemberDto.userId,
      )
    ) {
      // TODO : 이미 참여한 채널일때의 상황 구별해야함
      return channel;
      // throw new ConflictException("이미 참여한 채녈입니다");
    }

    const bannedMember = channel.channelBannedMembers.find(
      (member) => member.userId === createChannelMemberDto.userId,
    );
    if (bannedMember) throw new UnauthorizedException('차단된 사용자입니다.');

    const channelMember = this.channelMemberRepository.create(
      createChannelMemberDto,
    );
    await this.channelMemberRepository.save(channelMember);

    return channel;
  }

  async exit(deleteChannelMemberDto: DeleteChannelMemberDto) {
    const channel = await this.channelService.findOne(
      deleteChannelMemberDto.channelId,
      ['channelMembers'],
    );

    this.channelService.checkIsChannelMember(
      channel,
      deleteChannelMemberDto.userId,
    );

    if (deleteChannelMemberDto.userId === channel.ownerId) {
      this.channelService.delete(
        deleteChannelMemberDto.userId,
        deleteChannelMemberDto.channelId,
      );
    } else {
      this.channelMemberRepository.delete(deleteChannelMemberDto);
      this.chatService.removeConnectedMember(
        deleteChannelMemberDto.channelId.toString(),
        deleteChannelMemberDto.userId,
      );
    }
  }
}
