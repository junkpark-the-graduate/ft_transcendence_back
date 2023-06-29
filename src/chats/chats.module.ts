import { Module } from '@nestjs/common';
import { ChatsGateway } from './chats.gateway';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  providers: [ChatsGateway],
})
export class ChatsModule {}
