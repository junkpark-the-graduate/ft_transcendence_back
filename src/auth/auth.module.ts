import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { jwtOptions } from './constants';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { FtAuthService } from 'src/ft-auth/ft-auth.service';

@Module({
  imports: [UserModule, JwtModule.register(jwtOptions)],
  controllers: [AuthController],
  providers: [AuthService, UserService, FtAuthService],
})
export class AuthModule {}
