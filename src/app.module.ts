import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { ChatModule } from './chat/chat.module';
import { DummyModule } from './dummy/dummy.module';
import { ChannelModule } from './channel/channel.module';
import { BlockModule } from './block/block.module';
import { DummyModule } from './dummy/dummy.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FollowModule } from './follow/follow.module';
import { BlockModule } from './block/block.module';

const typeOrmModuleOptions = {
  type: process.env.DB_TYPE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/**/*.entity{.js,.ts}'],
  synchronize: true,
  logging: true,
  keepConnectionAlive: true,
  autoLoadEntities: true,
} as TypeOrmModuleOptions;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(typeOrmModuleOptions),
    AuthModule,
    UserModule,
    FollowModule,
    BlockModule,
    DummyModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'dist', 'public'),
    }),
    ChatModule,
    DummyModule,
    ChannelModule,
    BlockModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
