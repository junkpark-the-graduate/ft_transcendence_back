import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ValidationPipe,
  Response,
  Request,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserEntity } from './user.entity';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Not } from 'typeorm';

class UserRanking {
  @ApiProperty({
    example: 1,
    description: '랭킹',
  })
  ranking: number;
}

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiOperation({ summary: '유저 생성 API', description: '유저를 생성' })
  @ApiCreatedResponse({ description: '유저를 생성', type: UserEntity })
  @ApiResponse({ status: 200, description: 'OK' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiOperation({
    summary: '특정 유저 조회 API',
    description: 'accessToken으로 유저 조회',
  })
  @ApiResponse({ status: 200, description: 'OK', type: UserEntity })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findOne(@Request() req) {
    return this.userService.findOne(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
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

  @UseGuards(AuthGuard('jwt'))
  @Get('/:id')
  @ApiOperation({
    summary: '특정 유저 조회 API',
    description: 'id로 특정 유저 조회',
  })
  @ApiResponse({ status: 200, description: 'OK', type: UserEntity })
  findUser(@Param('id', new ParseIntPipe()) userId: number) {
    return this.userService.findOne(userId);
  }

  @Post('check-name')
  async checkDuplicateName(
    @Body() { name }: { name: string },
  ): Promise<{ isDuplicate: boolean }> {
    const isDuplicate = await this.userService.checkDuplicateName(name);
    return { isDuplicate };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch()
  @ApiOperation({
    summary: '특정 유저 업데이트 API',
    description: '특정 유저의 정보 업데이트',
  })
  @ApiResponse({ status: 200, description: 'OK', type: UserEntity })
  update(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(req.user.id, updateUserDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@Request() req, @UploadedFile() file: Express.Multer.File) {
    console.log('id: ', req.user.id);
    console.log('file:', file);
    return this.userService.updateImage(
      req.user.id,
      file.filename,
      file.mimetype,
    );
  }
}
