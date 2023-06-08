import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { FtAuthService } from './ft-auth/ft-auth.service';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
