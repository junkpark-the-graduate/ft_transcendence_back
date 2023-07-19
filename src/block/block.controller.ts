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
import { BlockService } from './block.service';
import { BlockDto } from './dto/block.dto';

@Controller('block')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Post()
  async block(@Body() BlockDto: BlockDto) {
    await this.blockService.block(BlockDto.userId, BlockDto.blocking);
    return { message: 'User blocked successfully.' };
  }

  @Delete(':userId/:blocking')
  async unblock(
    @Param('userId') userId: number,
    @Param('blocking') blocking: number,
  ) {
    await this.blockService.unblock(userId, blocking);
    return { message: 'User unblocked successfully.' };
  }

  @Get(':userId')
  async getFollowingsByUser(@Param('userId') userId: number) {
    const blockings = await this.blockService.getFollowingsByUser(userId);
    return blockings;
  }
}
