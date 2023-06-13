import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Module, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import { FtAuthService } from 'src/ft-auth/ft-auth.service';
import { User } from '../user/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET, // 실제로는 비밀키를 환경 변수 등에서 가져와야 합니다.
      signOptions: { expiresIn: 60 * 60 },
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserService,
    FtAuthService,
    JwtStrategy,
    ValidationPipe,
  ],
})
export class AuthModule {}
