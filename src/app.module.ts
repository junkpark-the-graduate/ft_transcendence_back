import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { FtAuthService } from './ft-auth/ft-auth.service';
import { databaseProviders } from './database/database.providers';
import { DatabaseModule } from './database/database.module';

//import { TypeOrmModule } from '@nestjs/typeorm';
//import { User } from './user/entities/user.entity';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    UserModule,
    //TypeOrmModule.forRoot({
    //  type: 'postgres',
    //  host: 'localhost',
    //  port: 5432,
    //  username: 'postgres',
    //  password: 'password',
    //  database: 'postgres',
    //  entities: [__dirname + '/../**/*.entity.{js,ts}'],
    //  synchronize: true,
    //}),
    DatabaseModule,
  ],
  controllers: [],
  providers: [...databaseProviders],
})
export class AppModule {}
