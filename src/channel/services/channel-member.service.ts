import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateChannelMemberDto } from '../dto/create-channel-member.dto';
import { DeleteChannelMemberDto } from '../dto/delete-channel-member.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelMemberEntity } from '../entities/channel-member.entity';
import { ChannelService } from './channel.service';
import { ChatService } from 'src/chat/chat.service';
import { EChannelType } from '../entities/channel.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChannelMemberService {
  constructor(
    private channelService: ChannelService,

    private chatService: ChatService,

    @InjectRepository(ChannelMemberEntity)
    private readonly channelMemberRepository: Repository<ChannelMemberEntity>,
  ) {}

  async join(createChannelMemberDto: CreateChannelMemberDto) {
    const channel = await this.channelService.findOne(
      createChannelMemberDto.channelId,
      ['channelMembers', 'channelBannedMembers'],
    );

    if (
      channel.channelMembers.find(
        (member) => member.userId === createChannelMemberDto.userId,
      )
    ) {
      return channel;
    }

    // Todo channel type에 따른 참여 가능 여부 체크
    // channel type	| pw	| search	| join ability
    // direct	      | x	  | x	      | 2명만 참여가능
    // public	      | x	  | o       | 누구나 참여가능
    // private	    | x	  | x	      | 초대로만 참여가능
    // protected	  | o	  | o	      | pw 입력 후 참여가능

    if (channel.type === EChannelType.direct) {
      if (channel.channelMembers.length >= 2)
        throw new UnauthorizedException('채널 인원이 가득 찼습니다.');
    } else if (channel.type === EChannelType.protected) {
      const isMatch = await bcrypt.compare(
        createChannelMemberDto.password,
        channel.password,
      );
      if (!isMatch) throw new UnauthorizedException('비밀번호가 틀렸습니다.');
    } else if (channel.type === EChannelType.private) {
      throw new UnauthorizedException('비밀 채널입니다.');
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
