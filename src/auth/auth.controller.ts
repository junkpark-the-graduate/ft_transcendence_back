import {
  Controller,
  Post,
  Query,
  Get,
  Body,
  UsePipes,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { AuthDto } from './dto/auth.dto';
import { TwoFactorDto } from './dto/twoFactor.dto';

import {
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '../user/user.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/')
  @ApiOperation({ summary: 'sign in with 42 intra' })
  @ApiCreatedResponse({ description: 'sign in success', type: User })
  async signIn(@Query() authDto: AuthDto) {
    return this.authService.signIn(authDto);
  }

  @Post('/2fa')
  @ApiOperation({ summary: 'signIn with twoFactor' })
  @ApiCreatedResponse({ description: '', type: User })
  async signInWithTwoFactor(@Query() twoFactorDto: TwoFactorDto) {
    return this.authService.twoFactorAuth(twoFactorDto);
  }
}
