import { TwoFactorTokenDto, TwoFactorCodeDto } from './dto/twoFactor.dto';

import { Controller, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TfaAuthService } from './services/tfa-auth.service';
import { AuthDto } from './dto/auth.dto';

import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserEntity } from '../user/user.entity';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tfaAuthService: TfaAuthService,
  ) {}

  @Post('/')
  @ApiOperation({ summary: 'sign in with 42 intra' })
  @ApiCreatedResponse({ description: 'sign in success', type: UserEntity })
  signIn(@Query() authDto: AuthDto) {
    return this.authService.signIn(authDto);
  }

  @Post('/tfa')
  @ApiOperation({ summary: 'signIn with twoFactor' })
  @ApiCreatedResponse({ description: '', type: UserEntity })
  signInWithTwoFactor(@Query() twoFactorTokenDto: TwoFactorTokenDto) {
    console.log('twoFactorTokenDto', twoFactorTokenDto);
    return this.tfaAuthService.authTwoFactorToken(twoFactorTokenDto);
  }

  @Post('/tfa-verification')
  @ApiOperation({ summary: 'twoFactor verification' })
  @ApiCreatedResponse({ description: '' })
  verifyTwoFactorCode(@Query() twoFactorCodeDto: TwoFactorCodeDto) {
    console.log('twoFactorCodeDto', twoFactorCodeDto);
    return this.tfaAuthService.verifyTwoFactorCode(twoFactorCodeDto);
  }
}
