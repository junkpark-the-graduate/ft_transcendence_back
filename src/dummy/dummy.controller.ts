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

  dummy1 = {
    id: 1,
    name: 'test1',
    email: 'test1@gmail.com',
    image: null,
  };

  dummy2 = {
    id: 2,
    name: 'test2',
    email: 'test2@gmail.com',
    image: null,
  };

  @Post()
  async create() {
    const dto1 = this.dummy1 as CreateUserDto;
    const dto2 = this.dummy2 as CreateUserDto;
    const res = [];
    res.push(await this.userService.create(dto1));
    res.push(await this.userService.create(dto2));
    return res;
  }

  @Get()
  async getDummyAccessToken() {
    const res = [];
    res.push(await this.dummyService.getDummyAccessToken(this.dummy1.id));
    res.push(await this.dummyService.getDummyAccessToken(this.dummy2.id));
    return res;
  }
}
