import { Controller, Post, Query, Get, Body, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { AuthDto } from './dto/auth.dto';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '../user/user.entity';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('/')
  @ApiOperation({ summary: 'sign in with 42 intra' })
  @ApiCreatedResponse({ description: 'sign in success', type: User })
  async signIn(@Query() authDto: AuthDto) {
    return this.authService.signIn(authDto);
  }
}
