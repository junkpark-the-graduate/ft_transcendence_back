import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { UserModule } from 'src/user/user.module';
import { ChannelModule } from 'src/channel/channel.module';

@Module({
  imports: [UserModule, ChannelModule],
  providers: [ChatGateway],
})
export class ChatModule {}
