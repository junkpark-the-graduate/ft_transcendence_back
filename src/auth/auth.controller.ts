import { TwoFactorDto } from './dto/twoFactor.dto';

import { Controller, Post, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';

import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '../user/user.entity';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/')
  @ApiOperation({ summary: 'sign in with 42 intra' })
  @ApiCreatedResponse({ description: 'sign in success', type: User })
  async signIn(@Query() authDto: AuthDto) {
    return this.authService.signIn(authDto);
    // if (ret === 'twoFactor') {
    // res.redirect('http://localhost:3000/auth/tfa-loading');
    // return;
    // } else {
    // return ret;
    // }
  }

  @Post('/2fa')
  @ApiOperation({ summary: 'signIn with twoFactor' })
  @ApiCreatedResponse({ description: '', type: User })
  async signInWithTwoFactor(@Query() twoFactorDto: TwoFactorDto) {
    console.log('twoFactorDto', twoFactorDto);
    return this.authService.twoFactorAuth(twoFactorDto);
  }
}
