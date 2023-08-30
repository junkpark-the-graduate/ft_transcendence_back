import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { ChatModule } from './chat/chat.module';
import { ChannelModule } from './channel/channel.module';
import { DummyModule } from './dummy/dummy.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FollowModule } from './follow/follow.module';
import { BlockModule } from './block/block.module';
import { GameModule } from './game/game.module';

const typeOrmModuleOptions = {
  type: process.env.DB_TYPE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
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
    GameModule,
    FollowModule,
    BlockModule,
    DummyModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
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
