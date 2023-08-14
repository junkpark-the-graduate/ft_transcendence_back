import {
  Controller,
  Delete,
  Get,
  Post,
  Request,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FollowService } from './follow.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FollowEntity } from './follow.entity';
import { DeleteFollowingDto } from './dto/delete-following.dto';
import { CreateFollowingDto } from './dto/create-following.dto';

@Controller('follow')
@ApiTags('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('/')
  @ApiOperation({
    summary: '특정 유저 follow API',
  })
  @ApiResponse({ status: 201, description: 'Created', type: FollowEntity })
  async follow(@Request() req, @Query('followingId') followingId: number) {
    const createFollowingDto: CreateFollowingDto = {
      userId: req.user.id,
      followingId: followingId,
    };
    return this.followService.follow(createFollowingDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('/')
  @ApiOperation({
    summary: '특정 유저 unfollow API',
  })
  @ApiResponse({ status: 200, description: 'Ok', type: FollowEntity })
  async unfollow(@Request() req, @Query('followingId') followingId: number) {
    const deleteFollowingDto: DeleteFollowingDto = {
      userId: req.user.id,
      followingId: followingId,
    };
    return this.followService.unfollow(deleteFollowingDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/userId')
  @ApiOperation({
    summary: '전체 follow 유저 조회 by user id API',
  })
  @ApiResponse({ status: 200, description: 'Ok', type: FollowEntity })
  async getFollowingsByUserId(@Request() req) {
    return this.followService.findAllFollowingsByUserId(req.user.id);
  }
}
