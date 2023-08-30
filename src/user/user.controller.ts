import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiProperty,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserEntity } from './user.entity';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';

class UserRanking {
  @ApiProperty({
    example: 1,
    description: '랭킹',
  })
  ranking: number;
}

@Controller('user')
@ApiTags('user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  // user create --------------------------------------------
  @Post('/')
  @ApiOperation({ summary: '유저 생성 API', description: '유저를 생성' })
  @ApiCreatedResponse({ description: '유저를 생성', type: UserEntity })
  @ApiResponse({ status: 200, description: 'OK' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // ranking ------------------------------------------------
  @Get('/ranking')
  @ApiOperation({
    summary: '랭킹 조회 API',
    description: '랭킹 조회',
  })
  @ApiResponse({
    status: 200,
    description: 'OK',
    type: UserEntity,
    isArray: true,
  })
  getUserRanking() {
    return this.userService.getUserRanking();
  }

  @Get('/ranking/:id')
  @ApiOperation({
    summary: ' 특정 유저 랭킹 조회 API',
    description: 'id를 사용해 특정 유저의 랭킹 조회',
  })
  @ApiResponse({
    status: 200,
    description: 'OK',
    type: UserRanking,
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUserRankingById(
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<UserRanking> {
    console.log(id);
    return await this.userService.getUserRankingById(id);
  }

  // user info access ---------------------------------------
  @Get('/')
  @ApiOperation({
    summary: '특정 유저 조회 API',
    description: 'accessToken으로 유저 조회',
  })
  @ApiResponse({ status: 200, description: 'OK', type: UserEntity })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findOne(@Request() req) {
    return this.userService.findOne(req.user.id);
  }

  @Get('/page')
  @ApiOperation({
    summary: '전체 유저 조회 API',
    description: '접속 중인 유저 리스트 조회',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  getPaginatedUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 30,
    @Query('name') name: string,
  ) {
    limit = limit > 100 ? 100 : limit;
    console.log(name);
    return this.userService.getPaginatedUsers({
      page,
      limit,
      name,
    });
  }

  @Get('/:id')
  @ApiOperation({
    summary: '특정 유저 조회 API by ID',
  })
  @ApiResponse({ status: 200, description: 'OK', type: UserEntity })
  findUserById(@Param('id', new ParseIntPipe()) userId: number) {
    return this.userService.findOne(userId);
  }

  @Get('search/:data')
  @ApiOperation({
    summary: '특정 유저 조회 API by name or ID',
  })
  @ApiResponse({ status: 200, description: 'OK', type: UserEntity })
  findUserByNameOrId(@Param('data') data: string) {
    return this.userService.findOneByNameOrId(data);
  }

  // user info update ---------------------------------------
  @Patch()
  @ApiOperation({
    summary: '특정 유저 업데이트 API',
    description: '특정 유저의 정보 업데이트',
  })
  @ApiResponse({ status: 200, description: 'OK', type: UserEntity })
  update(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(req.user.id, updateUserDto);
  }

  @Post('/check-name')
  async checkDuplicateName(
    @Query('name') name: string,
  ): Promise<{ isDuplicate: boolean }> {
    const isDuplicate = await this.userService.checkDuplicateName(name);
    return { isDuplicate };
  }

  @Patch('/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@Request() req, @UploadedFile() file: Express.Multer.File) {
    return this.userService.updateImage(
      req.user.id,
      file.filename,
      file.mimetype,
    );
  }
}
