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
import { ChannelService } from './services/channel.service';
import { ChannelBanService } from './services/channel-ban.service';
import { ChannelMemberService } from './services/channel-member.service';
import { ChannelKickService } from './services/channel-kick.service';
import { ChannelMuteService } from './services/channel-mute.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { CreateChannelMemberDto } from './dto/create-channel-member.dto';
import { CreateChannelMutedMemberDto } from './dto/create-channel-muted-member.dto';
import { CreateChannelBannedMemberDto } from './dto/create-channel-banned-member.dto';
import { DeleteChannelBannedMemberDto } from './dto/delete-channel-banned-member.dto';
import { DeleteChannelMemberDto } from './dto/delete-channel-member.dto';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ChannelEntity } from './entities/channel.entity';

@Controller('channel')
export class ChannelController {
  constructor(
    private readonly channelService: ChannelService,
    private readonly channelMemberService: ChannelMemberService,
    private readonly channelKickService: ChannelKickService,
    private readonly channelMuteService: ChannelMuteService,
    private readonly channelBanService: ChannelBanService,
  ) {}

  // /channel/:channelId----------------------------------------------------------------------------------------------------------------------

  @UseGuards(AuthGuard('jwt'))
  @Get('/joined')
  @ApiOperation({
    summary: '유저가 가입한 채널 조회 API',
    description: '유저가 가입한 모든 채널 조회',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  findJoinedChannel(@Request() req) {
    return this.channelService.findJoinedChannel(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiOperation({ summary: '채널 생성 API', description: '채널을 생성' })
  @ApiCreatedResponse({ description: '채널을 생성', type: ChannelEntity }) // Todo: ChannelEntity 반환값에서 password 제거
  @ApiResponse({ status: 201, description: 'Created' })
  create(@Request() req, @Body() createChannelDto: CreateChannelDto) {
    return this.channelService.create(createChannelDto, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':channelId')
  @ApiOperation({ summary: '채널 삭제 API', description: '채널 삭제' })
  @ApiResponse({ status: 200, description: 'OK' })
  delete(@Request() req, @Param('channelId') channelId: number) {
    return this.channelService.delete(req.user.id, channelId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiOperation({ summary: '채널 조회 API', description: '모든 채널 조회' })
  // @ApiCreatedResponse({ description: '채널을 생성', type: ChannelEntity }) // Todo: ChannelEntity 반환값에서 password 제거
  @ApiResponse({ status: 200, description: 'OK' })
  findAll() {
    return this.channelService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':channelId')
  @ApiOperation({ summary: '채널 조회 API', description: '채널 1개 조회' })
  // @ApiCreatedResponse({ description: '채널을 생성', type: ChannelEntity }) // Todo: ChannelEntity 반환값에서 password 제거
  @ApiResponse({ status: 200, description: 'OK' })
  findOne(@Param('channelId') channelId: number) {
    return this.channelService.findOne(channelId);
  }

  // /channel/:channelId/member ---------------------------------------------------------------------------------------------------------------
  @UseGuards(AuthGuard('jwt'))
  @Get(':channelId/member')
  @ApiOperation({
    summary: '채널 멤버 조회 API',
    description: '모든 채널 멤버 조히',
  })
  // @ApiCreatedResponse({ description: '채널을 생성', type: ChannelEntity }) // Todo: ChannelEntity 반환값에서 password 제거
  @ApiResponse({ status: 200, description: 'OK' })
  findAllChannelMember(@Param('channelId') channelId: number) {
    return this.channelService.findAllChannelMember(channelId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':channelId/member')
  @ApiOperation({ summary: '채널 참여', description: '채널 참여' })
  @ApiResponse({ status: 201, description: 'Created' })
  join(@Request() req, @Param('channelId') channelId: number) {
    const createChannelMemberDto: CreateChannelMemberDto = {
      channelId,
      userId: req.user.id,
      isAdmin: false,
    };
    return this.channelMemberService.join(createChannelMemberDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':channelId/member')
  @ApiOperation({ summary: '채널 나가기 API', description: '채널 나가기' })
  @ApiResponse({ status: 200, description: 'OK' })
  exit(@Request() req, @Param('channelId') channelId: number) {
    const deleteChannelMemberDto: DeleteChannelMemberDto = {
      channelId,
      userId: req.user.id,
    };
    return this.channelMemberService.exit(deleteChannelMemberDto);
  }

  // /channel/:channelId/muted-member ---------------------------------------------------------------------------------------------------------------
  @UseGuards(AuthGuard('jwt'))
  @Get(':channelId/muted-member')
  @ApiOperation({
    summary: '채널 뮤트 멤버 조회 API',
    description: '모든 채널 뮤트 멤버 조회',
  })
  // @ApiCreatedResponse({ description: '채널을 생성', type: ChannelEntity }) // Todo: ChannelEntity 반환값에서 password 제거
  @ApiResponse({ status: 200, description: 'OK' })
  findAllChannelMutedMember(@Param('channelId') channelId: number) {
    return this.channelService.findAllChannelMutedMember(channelId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':channelId/muted-member')
  @ApiOperation({ summary: '멤버 뮤트', description: 'time만큼 뮤트' })
  @ApiResponse({ status: 201, description: 'Created' })
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
    return this.channelMuteService.mute(createChannelMutedMemberDto, userId);
  }

  // /channel/:channelId/banned-member ---------------------------------------------------------------------------------------------------------------
  @UseGuards(AuthGuard('jwt'))
  @Get(':channelId/banned-member')
  @ApiOperation({
    summary: '채널 차단 멤버 조회 API',
    description: '모든 채널 차단 멤버 조회',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  findAllChannelBannedMember(@Param('channelId') channelId: number) {
    return this.channelService.findAllChannelBannedMember(channelId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':channelId/banned-member')
  @ApiOperation({
    summary: '멤버 차단(ban)',
    description: '채널에서 쫓겨나고 해당 채널에 다시 들어올 수 없음',
  })
  @ApiResponse({ status: 201, description: 'Created' })
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
    return this.channelBanService.ban(createChannelBannedMemberDto, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':channelId/banned-member')
  @ApiOperation({
    summary: '채널 차단 멤버 삭제 API',
    description: '차단된 멤버 삭제(차단 해제)',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  deleteChannelBannedMember(
    @Request() req,
    @Param('channelId') channelId: number,
    @Query('memberId') memberId: number,
  ) {
    const userId = req.user.id;
    const deleteChannelBannedMemberDto: DeleteChannelBannedMemberDto = {
      channelId,
      userId: memberId,
    };
    console.log('userId', userId);
    console.log('deleteChannelBannedMemberDto', deleteChannelBannedMemberDto);

    return this.channelBanService.deleteChannelBannedMember(
      userId,
      deleteChannelBannedMemberDto,
    );
  }

  // /channel/:channelId/kicked-member ---------------------------------------------------------------------------------------------------------------
  @UseGuards(AuthGuard('jwt'))
  @Delete(':channelId/kicked-member')
  @ApiOperation({
    summary: '멤버 쫓아내기',
    description:
      '관리자에 의해 채널에서 멤버를 쫓아냄. 채널 소유자는 쫓아낼 수 없음',
  })
  @ApiResponse({ status: 200, description: 'Ok' })
  kick(
    @Request() req,
    @Param('channelId') channelId: number,
    @Query('memberId') memberId: number,
  ) {
    return this.channelKickService.kick(req.user.id, channelId, memberId);
  }

  // /channel/:channelId/admin ---------------------------------------------------------------------------------------------------------------
  @UseGuards(AuthGuard('jwt'))
  @Get(':channelId/admin')
  @ApiOperation({
    summary: '채널 관리자 조회 API',
    description: '채널 관리자 조회',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  checkChannelAdmin(@Request() req, @Param('channelId') channelId: number) {
    return this.channelService.checkChannelAdmin(req.user.id, channelId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':channelId/admin')
  @ApiOperation({
    summary: '채널 관리자 추가 API',
    description: '채널 관리자 추가',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  updateChannelAdmin(
    @Request() req,
    @Param('channelId') channelId: number,
    @Query('memberId') memberId: number,
  ) {
    return this.channelService.updateChannelAdmin(
      req.user.id,
      channelId,
      memberId,
    );
  }
}
