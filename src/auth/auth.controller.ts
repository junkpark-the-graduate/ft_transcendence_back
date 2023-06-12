import { Controller, Post, Query, Get, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { AuthDto } from './dto/auth.dto';
import { ApiQuery } from '@nestjs/swagger';

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

  @Get('/')
  async dummyAPI() {
    return 'helloWorld!';
  }
}
