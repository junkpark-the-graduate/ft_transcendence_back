import { Controller, Post, Query } from '@nestjs/common';
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
  create(@Query() authDto: AuthDto) {
    this.authService.ftToken(authDto);
    this.userService.upsert();
  }
}
