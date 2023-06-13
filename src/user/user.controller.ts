import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
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
import { User } from './user.entity';

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: '유저 생성 API', description: '유저를 생성' })
  @ApiCreatedResponse({ description: '유저를 생성', type: User })
  @ApiResponse({ status: 200, description: 'OK' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({
    summary: '전체 유저 조회 API',
    description: '접속 중인 유저 리스트 조회',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: '특정 유저 조회 API',
    description: 'id로 유저 조회',
  })
  @ApiResponse({ status: 200, description: 'OK', type: User })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findOne(@Param('id') id: number) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: '특정 유저 업데이트 API',
    description: '특정 id의 유저 정보 업데이트',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }
}