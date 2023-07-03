import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { UserModule } from 'src/user/user.module';
import { ChatService } from './chat.service';
@Module({
  imports: [UserModule],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
