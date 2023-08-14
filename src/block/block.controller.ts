import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BlockEntity } from '../block/block.entity';
import { CreateBlockingDto } from './dto/create-blocking.dto';
import { DeleteBlockingDto } from './dto/delete-blocking.dto';
import { BlockService } from './block.service';

@Controller('block')
@ApiTags('block')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('/')
  @ApiOperation({
    summary: '특정 유저 블락 API',
    description: '유저를 블락하면 해당 유저와 채팅을 할 수 없음',
  })
  @ApiResponse({ status: 201, description: 'Created', type: BlockEntity })
  block(@Request() req, @Query('blockingId') blockingId: number) {
    const createBlockingDto: CreateBlockingDto = {
      userId: req.user.id,
      blockingId: blockingId,
    };
    return this.blockService.block(createBlockingDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('/')
  @ApiOperation({
    summary: '블락 해제 API',
    description: '블락된 유저 해제',
  })
  @ApiResponse({ status: 200, description: 'Ok', type: BlockEntity })
  unBlock(@Request() req, @Query('blockingId') blockingId: number) {
    const deleteBlockingDto: DeleteBlockingDto = {
      userId: req.user.id,
      blockingId: blockingId,
    };
    return this.blockService.unBlock(deleteBlockingDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/')
  @ApiOperation({
    summary: '전체 블락 유저 조회 API',
    description: '전체 블락 유저 조회',
  })
  @ApiResponse({ status: 200, description: 'Ok', type: BlockEntity })
  findAllBlockedUser() {
    return this.blockService.findAllBlockedUser();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/userid')
  @ApiOperation({
    summary: '전체 블락 유저 조회 by user id API',
    description: '해당 유저가 블락한 전체 유저 조회',
  })
  @ApiResponse({ status: 200, description: 'Ok', type: BlockEntity })
  findAllBlockedUserByUserId(@Request() req) {
    return this.blockService.findAllBlockedUserByUserId(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/blockingid')
  @ApiOperation({
    summary: '전체 블락 유저 조회 by target id API',
    description: '해당 유저를 블락한 전체 유저 조회',
  })
  @ApiResponse({ status: 200, description: 'Ok', type: BlockEntity })
  findAllBlockedUserByBlockingId(
    @Request() req,
    @Query('blockingId') blockingId: number,
  ) {
    return this.blockService.findAllBlockedUserByBlockingId(blockingId);
  }
}
