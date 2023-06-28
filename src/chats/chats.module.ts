// import { SocketSchema, Socket as SocketModel } from './models/sockets.model';
// import { Chatting, ChattingSchema } from './models/chattings.model';
// import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { ChatsGateway } from './chats.gateway';

@Module({
  imports: [],
  providers: [ChatsGateway],
})
export class ChatsModule {}
