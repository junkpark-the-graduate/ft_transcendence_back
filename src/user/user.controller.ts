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
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserEntity } from './user.entity';
import { AuthGuard } from '@nestjs/passport';

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
}
