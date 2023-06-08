import { Controller, Post, Query, Get, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { AuthDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('/')
  async signIn(@Query() authDto: AuthDto) {
    return this.authService.signIn(authDto);
  }

  @Get('/abc')
  async asd(@Query() data: any, @Body() data2: any) {
    console.log(data);
    console.log(data2);
    return '1234';
  }

  @Post('/abc')
  async qwe(@Query() data: any) {
    console.log(data);
    return 'asdqwe';
  }
}
