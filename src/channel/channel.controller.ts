import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiCreatedResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChannelEntity } from './entities/channel.entity';

@Controller('channel')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  // @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiOperation({ summary: '채널 생성 API', description: '채널을 생성' })
  @ApiCreatedResponse({ description: '채널을 생성', type: ChannelEntity }) // Todo: ChannelEntity 반환값에서 password 제거
  @ApiResponse({ status: 200, description: 'OK' })
  create(@Body() createChannelDto: CreateChannelDto) {
    return this.channelService.create(createChannelDto);
  }

  @Get()
  findAll() {
    return this.channelService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.channelService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto) {
    return this.channelService.update(+id, updateChannelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.channelService.remove(+id);
  }
}
