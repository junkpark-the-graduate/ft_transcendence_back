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
  UseInterceptors,
  UploadedFile,
  Query,
  Res,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiCreatedResponse,
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

  // @UseGuards(AuthGuard('jwt'))
  // @Get('/tmp')
  // @ApiOperation({
  //   summary: '전체 유저 조회 API',
  //   description: '접속 중인 유저 리스트 조회',
  // })
  // @ApiResponse({ status: 200, description: 'OK' })
  // findAll() {
  //   return this.userService.findAll();
  // }

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

  @Get('/ranking')
  @ApiOperation({
    summary: '랭킹 조회 API',
    description: '랭킹 조회',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description:
      '보고 싶은 페이지를 넣습니다. 기본적으로 0페이지를 보여줍니다.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description:
      '한 페이지에 보여줄 유저 수를 넣습니다. 기본적으로 10개를 보여줍니다.',
  })
  @ApiResponse({
    status: 200,
    description: 'OK',
    type: UserEntity,
    isArray: true,
  })
  getUserRanking(
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe)
    offset: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.userService.getUserRanking(offset, limit);
  }

  @Get('/:id')
  @ApiOperation({
    summary: '특정 유저 조회 API',
    description: 'id로 특정 유저 조회',
  })
  @ApiResponse({ status: 200, description: 'OK', type: UserEntity })
  findUser(@Param('id') userId: number) {
    return this.userService.findOne(userId);
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
