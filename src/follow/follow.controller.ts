import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FollowService } from './follow.service';
import { FollowDto } from './dto/follow.dto';

@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  // @UseGuards(AuthGuard('jwt')) // 예시로 JWT 인증 가드를 사용
  @Post()
  async follow(@Body() followDto: FollowDto) {
    await this.followService.follow(followDto.userId, followDto.following);
    return { message: 'User followed successfully.' };
  }

  // @UseGuards(AuthGuard('jwt')) // 예시로 JWT 인증 가드를 사용
  @Delete(':userId/:following') // URL에 userId와 following 추가
  async unfollow(
    @Param('userId') userId: number,
    @Param('following') following: number,
  ) {
    await this.followService.unfollow(userId, following);
    return { message: 'User unfollowed successfully.' };
  }

  @Get(':userId')
  async getFollowingsByUser(@Param('userId') userId: number) {
    const followings = await this.followService.getFollowingsByUser(userId);
    return { followings };
  }
}
