import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiTags,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { GameEntity } from './entities/game.entity';
import { GameType } from './game.constants';
import { GameQueryDto } from './dto/game-query.dto';

@ApiTags('game')
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('')
  @ApiOperation({ summary: '전적 조회 API', description: '모든 게임 조회' })
  @ApiQuery({ type: GameQueryDto })
  @ApiOkResponse({
    type: GameEntity,
    isArray: true,
  })
  findAll(
    @Query()
    gameQueryDto: GameQueryDto,
  ) {
    console.log(gameQueryDto);
    return this.gameService.findAll(gameQueryDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: '특정 게임 조회 API',
    description: 'id로 특정 게임 조회',
  })
  @ApiParam({ name: 'id', description: '게임 id' })
  @ApiOkResponse({
    type: GameEntity,
  })
  @ApiNotFoundResponse({
    description: '해당 id의 게임이 없습니다.',
  })
  async findOne(@Param('id', new ParseIntPipe()) id: number) {
    return await this.gameService.findOne(id);
  }

  @Get('/by-ftid/:ftid')
  @ApiOperation({
    summary: '유저의 전적 조회 API',
    description: '유저의 전적 조회',
  })
  @ApiParam({ name: 'ftid', description: '유저 id' })
  @ApiQuery({ type: GameQueryDto })
  @ApiOkResponse({
    type: GameEntity,
    isArray: true,
  })
  @ApiNotFoundResponse({
    description: '해당 id의 유저가 없습니다.',
  })
  getUserMatchHistory(@Param('ftid') id: string) {
    //return this.gameService.getUserMatchHistory(+id);
  }

  @Post('test')
  test() {
    return this.gameService.test();
  }
}
