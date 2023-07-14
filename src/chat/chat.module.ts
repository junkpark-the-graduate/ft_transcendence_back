import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { UserModule } from 'src/user/user.module';
import { ChannelModule } from 'src/channel/channel.module';
import { ChatService } from './chat.service';

@Module({
  imports: [UserModule, forwardRef(() => ChannelModule)],
  providers: [ChatGateway, ChatService],
  exports: [ChatGateway, ChatService],
})
export class ChatModule {}
