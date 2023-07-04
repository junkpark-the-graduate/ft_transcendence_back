import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { CreateChannelMemberDto } from './dto/create-channel-member.dto';
import { CreateChannelMutedMemberDto } from './dto/create-channel-muted-member.dto';
import { CreateChannelBannedMemberDto } from './dto/create-channel-banned-member.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiCreatedResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChannelEntity } from './entities/channel.entity';

@Controller('channel')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiOperation({ summary: '채널 생성 API', description: '채널을 생성' })
  @ApiCreatedResponse({ description: '채널을 생성', type: ChannelEntity }) // Todo: ChannelEntity 반환값에서 password 제거
  @ApiResponse({ status: 200, description: 'OK' })
  create(@Request() req, @Body() createChannelDto: CreateChannelDto) {
    console.log('!!!!!!!!!!!!!!11');
    console.log('req.user.id', req.user.id);
    console.log('createChannelDto', createChannelDto);
    return this.channelService.create(createChannelDto, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiOperation({ summary: '채널 조회 API', description: '모든 채널 조히' })
  // @ApiCreatedResponse({ description: '채널을 생성', type: ChannelEntity }) // Todo: ChannelEntity 반환값에서 password 제거
  @ApiResponse({ status: 200, description: 'OK' })
  findAll() {
    return this.channelService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':channelId/member')
  @ApiOperation({ summary: '채널 참여', description: '채널 참여' })
  @ApiResponse({ status: 200, description: 'OK' })
  join(@Request() req, @Param('channelId') channelId: number) {
    const createChannelMemberDto: CreateChannelMemberDto = {
      channelId,
      userId: req.user.id,
      isAdmin: false,
    };
    return this.channelService.join(createChannelMemberDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':channelId/muted-member')
  @ApiOperation({ summary: '멤버 뮤트', description: 'time만큼 뮤트' })
  @ApiResponse({ status: 200, description: 'OK' })
  mute(
    @Request() req,
    @Param('channelId') channelId: number,
    @Query('memberId') memberId: number,
  ) {
    const userId = req.user.id;
    const createChannelMutedMemberDto: CreateChannelMutedMemberDto = {
      channelId,
      userId: memberId,
    };
    return this.channelService.mute(createChannelMutedMemberDto, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':channelId/banned-member')
  @ApiOperation({ summary: '멤버 블락', description: '블락' })
  @ApiResponse({ status: 200, description: 'OK' })
  ban(
    @Request() req,
    @Param('channelId') channelId: number,
    @Query('memberId') memberId: number,
  ) {
    const userId = req.user.id;
    const createChannelBannedMemberDto: CreateChannelBannedMemberDto = {
      channelId,
      userId: memberId,
    };
    return this.channelService.ban(createChannelBannedMemberDto, userId);
  }
}