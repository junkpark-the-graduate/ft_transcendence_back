import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { Repository } from 'typeorm';
import { ChannelEntity } from './entities/channel.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(ChannelEntity)
    private readonly channelRepository: Repository<ChannelEntity>,
  ) {}

  async create(createChannelDto: CreateChannelDto) {
    try {
      const channel = this.channelRepository.create(createChannelDto);
      await this.channelRepository.save(channel);
      return channel;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  findAll() {
    return `This action returns all channel`;
  }

  findOne(id: number) {
    return `This action returns a #${id} channel`;
  }

  update(id: number, updateChannelDto: UpdateChannelDto) {
    return `This action updates a #${id} channel`;
  }

  remove(id: number) {
    return `This action removes a #${id} channel`;
  }
}
