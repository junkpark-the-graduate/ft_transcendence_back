import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { userProviders } from './user.providers';
import { DatabaseModule } from 'src/database/database.module';

//import { TypeOrmModule } from '@nestjs/typeorm';
//import { User } from './entities/user.entity';

@Module({
  //imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [...userProviders, UserService],
  //exports: [TypeOrmModule],
})
export class UserModule {}
