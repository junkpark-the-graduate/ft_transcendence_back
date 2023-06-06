import { Controller, Post, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/:code')
  create(@Param() authDto: AuthDto) {
    return this.authService.postAuthTo42(authDto);
  }
}
