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

  async create(createChannelDto: CreateChannelDto, ownerId: number) {
    try {
      const { name, password, type } = createChannelDto;
      console.log('createChannelDto', createChannelDto);
      const channel = this.channelRepository.create({
        ownerId,
        name,
        password,
        type,
      });
      await this.channelRepository.save(channel);
      return channel;
    } catch (error) {
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
