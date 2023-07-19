import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateChannelMemberDto } from '../dto/create-channel-member.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelEntity } from '../entities/channel.entity';
import { Repository } from 'typeorm';
import { ChannelMemberEntity } from '../entities/channel-member.entity';
import { ChannelService } from './channel.service';

@Injectable()
export class ChannelJoinService {
  constructor(
    private channelService: ChannelService,

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
}
