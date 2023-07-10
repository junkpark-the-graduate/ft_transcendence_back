import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { UserModule } from 'src/user/user.module';
import { ChannelModule } from 'src/channel/channel.module';

@Module({
  imports: [UserModule, forwardRef(() => ChannelModule)],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
