import { Controller, Post, Body, Get } from '@nestjs/common';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { DummyService } from './dummy.service';

@Controller('dummy')
export class DummyController {
  constructor(
    private readonly userService: UserService,
    private readonly dummyService: DummyService,
  ) {}

  dummy = {
    id: 1,
    name: 'test1',
    email: 'test1@gmail.com',
    image: null,
  };

  @Post()
  create() {
    const dto = this.dummy as CreateUserDto;
    return this.userService.create(dto);
  }

  @Get()
  getDummyAccessToken() {
    return this.dummyService.getDummyAccessToken(this.dummy.id);
  }
}
