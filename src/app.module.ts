import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { NestModule, MiddlewareConsumer, Logger } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email/email.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');
  use(req: Request, res: Response, next: NextFunction) {
    const { ip, method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';
    res.on('finish', () => {
      const { statusCode } = res;
      this.logger.log(
        `${method} ${statusCode} - ${originalUrl} - ${ip} - ${userAgent}`,
      );
    });
    next();
  }
}

@Module({
  imports: [
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
          from: `"nest-modules" <${process.env.GMAIL_ID}>`,
        },
      }),
    }),
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      // TODO: forRootAsync
      type: 'postgres',
      host: 'db',
      port: 5432,
      username: 'postgres',
      password: 'password',
      database: 'postgres',
      entities: ['dist/**/*.entity{.js,.ts}'],
      synchronize: true,
      logging: true,
    }),
    AuthModule,
    UserModule,
  ],
  controllers: [],
  providers: [EmailService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
