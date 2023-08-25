import { ConfigService } from '@nestjs/config';
import { Module, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UserEntity } from '../user/user.entity';
import { UserModule } from 'src/user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { EmailService } from './services/email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { FtAuthService } from './services/ft-auth.service';
import { TfaEntity } from './entity/tfa.entity';
import { TfaAuthService } from './services/tfa-auth.service';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([UserEntity, TfaEntity]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET, // 실제로는 비밀키를 환경 변수 등에서 가져와야 합니다.
      signOptions: { expiresIn: '6h' },
    }),
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.GMAIL_ID,
            pass: process.env.GMAIL_PASSWORD,
          },
        },
        defaults: {
          from: `"ping-pong" <${process.env.GMAIL_ID}>`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    FtAuthService,
    JwtStrategy,
    ValidationPipe,
    TfaAuthService,
    EmailService,
  ],
})
export class AuthModule {}
