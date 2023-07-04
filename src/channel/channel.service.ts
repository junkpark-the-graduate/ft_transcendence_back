import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { CreateChannelMemberDto } from './dto/create-channel-member.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelEntity } from './entities/channel.entity';
import { ChannelMemberEntity } from './entities/channel-member.entity';
import { ChannelMutedMemberEntity } from './entities/channel-muted-member.entity';
import { ChannelBlockedMemberEntity } from './entities/channel-blocked-member.entity';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(ChannelEntity)
    private readonly channelRepository: Repository<ChannelEntity>,

    @InjectRepository(ChannelMemberEntity)
    private readonly channelMemberRepository: Repository<ChannelMemberEntity>,

    @InjectRepository(ChannelMutedMemberEntity)
    private readonly channelMutedMemberRepository: Repository<ChannelMutedMemberEntity>,

    @InjectRepository(ChannelBlockedMemberEntity)
    private readonly channelBlockedMemberRepository: Repository<ChannelBlockedMemberEntity>,
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

  // findOne(id: number) {
  //   return `This action returns a #${id} channel`;
  // }

  // update(id: number, updateChannelDto: UpdateChannelDto) {
  //   return `This action updates a #${id} channel`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} channel`;
  // }

  async join(createChannelMemberDto: CreateChannelMemberDto) {
    try {
      const channel = await this.channelRepository.findOne({
        where: {
          id: createChannelMemberDto.channelId,
        },
        relations: {
          channelMembers: true,
        },
      });

      if (!channel) throw new ConflictException('존재하지 않는 채널입니다.');
      // Todo: 비밀번호 체크
      // if (channel.password !== createChannelMemberDto.password)
      //   throw new ConflictException('비밀번호가 틀렸습니다.');

      if (
        channel.channelMembers.find(
          (member) => member.userId === createChannelMemberDto.userId,
        )
      )
        throw new ConflictException('이미 참여한 채널입니다.');

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
}
