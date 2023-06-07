import { Controller, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/')
  create(@Query() authDto: AuthDto) {
    return this.authService.postAuthTo42(authDto);
  }
}
