import { Module, forwardRef } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelEntity } from './entities/channel.entity';
import { ChannelMemberEntity } from './entities/channel-member.entity';
import { ChannelMutedMemberEntity } from './entities/channel-muted-member.entity';
import { ChannelBannedMemberEntity } from './entities/channel-banned-member.entity';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChannelEntity,
      ChannelMemberEntity,
      ChannelMutedMemberEntity,
      ChannelBannedMemberEntity,
    ]),
    forwardRef(() => ChatModule),
  ],
  controllers: [ChannelController],
  providers: [ChannelService],
  exports: [ChannelService],
})
export class ChannelModule {}
