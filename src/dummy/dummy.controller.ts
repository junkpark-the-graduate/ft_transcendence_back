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

  private createDummyUser() {
    const dummys = [];
    for (let i = 1; i <= 100; i++) {
      const dummy = {
        id: i,
        name: `test${i}`,
        email: `test${i}@gmail.com`,
        image: null,
      };
      dummys.push(dummy);
    }
    return dummys;
  }

  @Post()
  async create() {
    const dummys = this.createDummyUser();
    const res = [];
    let dto = null;
    for (const dummy of dummys) {
      dto = dummy as CreateUserDto;
      res.push(await this.userService.create(dto));
    }
    return res;
  }

  @Get()
  async getDummyAccessToken() {
    const dummys = this.createDummyUser();
    const res = [];

    for (const dummy of dummys) {
      res.push(await this.dummyService.getDummyAccessToken(dummy.id));
    }
    return res;
  }
}
