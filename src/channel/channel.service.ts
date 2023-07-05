import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { CreateChannelMemberDto } from './dto/create-channel-member.dto';
import { CreateChannelMutedMemberDto } from './dto/create-channel-muted-member.dto';
import { CreateChannelBannedMemberDto } from './dto/create-channel-banned-member.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelEntity } from './entities/channel.entity';
import { ChannelMemberEntity } from './entities/channel-member.entity';
import { ChannelMutedMemberEntity } from './entities/channel-muted-member.entity';
import { ChannelBannedMemberEntity } from './entities/channel-banned-member.entity';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(ChannelEntity)
    private readonly channelRepository: Repository<ChannelEntity>,

    @InjectRepository(ChannelMemberEntity)
    private readonly channelMemberRepository: Repository<ChannelMemberEntity>,

    @InjectRepository(ChannelMutedMemberEntity)
    private readonly channelMutedMemberRepository: Repository<ChannelMutedMemberEntity>,

    @InjectRepository(ChannelBannedMemberEntity)
    private readonly channelBannedMemberRepository: Repository<ChannelBannedMemberEntity>,
  ) {}

  async create(createChannelDto: CreateChannelDto, ownerId: number) {
    try {
      const { name, password, type } = createChannelDto;
      const tmp = await this.channelRepository.findOne({
        where: {
          name: name,
        },
      });

      if (tmp) throw new ConflictException('이미 존재하는 채널 이름입니다.');

      const channel = this.channelRepository.create({
        ownerId,
        name,
        password,
        type,
      });
      await this.channelRepository.save(channel);

      const createChannelMemberDto: CreateChannelMemberDto = {
        channelId: channel.id,
        userId: ownerId,
        isAdmin: true,
      };
      const channelMember = this.channelMemberRepository.create(
        createChannelMemberDto,
      );
      await this.channelMemberRepository.save(channelMember);

      return channel;
    } catch (error) {
      if (error.status) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll() {
    try {
      const channels = await this.channelRepository.find();
      return channels;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(channelId: number | string) {
    if (typeof channelId === 'string') channelId = parseInt(channelId);
    try {
      const channel = await this.channelRepository.findOne({
        where: {
          id: channelId,
        },
        relations: [
          'channelMembers',
          'channelMembers.user',
          'channelMutedMembers',
          'channelMutedMembers.user', //Todo: 필요 없으면 지워야함
          'channelBannedMembers',
          'channelBannedMembers.user',
        ],
      });
      if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

      return channel;
    } catch (error) {
      if (error.status) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOneChannelMember(channelId: number | string, userId: number) {
    if (typeof channelId === 'string') channelId = parseInt(channelId);
    try {
      const channelMember = await this.channelMemberRepository.findOne({
        where: {
          channelId,
          userId,
        },
        relations: ['user'],
      });
      if (!channelMember)
        throw new NotFoundException('존재하지 않는 채널 멤버입니다.');

      return channelMember;
    } catch (error) {
      if (error.status) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async join(createChannelMemberDto: CreateChannelMemberDto) {
    try {
      const channel = await this.channelRepository.findOne({
        where: {
          id: createChannelMemberDto.channelId,
        },
        relations: {
          channelMembers: true,
          channelBannedMembers: true,
        },
      });

      if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');
      // Todo: 비밀번호 체크
      // if (channel.password !== createChannelMemberDto.password)
      //   throw new ConflictException('비밀번호가 틀렸습니다.');

      if (
        channel.channelMembers.find(
          (member) => member.userId === createChannelMemberDto.userId,
        )
      )
        throw new ConflictException('이미 참여한 채널입니다.');

      const bannedMember = channel.channelBannedMembers.find(
        (member) => member.userId === createChannelMemberDto.userId,
      );
      if (bannedMember) throw new UnauthorizedException('차단된 사용자입니다.');

      const channelMember = this.channelMemberRepository.create(
        createChannelMemberDto,
      );
      await this.channelMemberRepository.save(channelMember);

      return channel;
    } catch (error) {
      if (error.status) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async mute(
    createChannelMutedMemberDto: CreateChannelMutedMemberDto,
    userId: number,
  ) {
    try {
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

      // Todo: chat.gateway 에 접근해서 mutedMember 추가

      return mutedMember;
    } catch (error) {
      console.log(error);
      if (error.status) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async ban(
    createChannelBannedMemberDto: CreateChannelBannedMemberDto,
    userId: number,
  ) {
    try {
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
        throw new UnauthorizedException('소유자는 뮤트할 수 없습니다.');

      let banMember = channel.channelBannedMembers.find(
        (member) => member.userId === createChannelBannedMemberDto.userId,
      );
      if (banMember) return banMember;
      banMember = this.channelBannedMemberRepository.create(
        createChannelBannedMemberDto,
      );
      await this.channelBannedMemberRepository.save(banMember);

      // TODO : 채팅방에서 쫓아내고(channelMember table에서 delete) socket disconnect
      return banMember;
    } catch (error) {
      console.log(error);
      if (error.status) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }
}
