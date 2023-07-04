import { Module } from '@nestjs/common';
import { ChannelService } from './channel.service';
import { ChannelController } from './channel.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelEntity } from './entities/channel.entity';
import { ChannelMemberEntity } from './entities/channel-member.entity';
import { ChannelMutedMemberEntity } from './entities/channel-muted-member.entity';
import { ChannelBlockedMemberEntity } from './entities/channel-blocked-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChannelEntity,
      ChannelMemberEntity,
      ChannelMutedMemberEntity,
      ChannelBlockedMemberEntity,
    ]),
  ],
  controllers: [ChannelController],
  providers: [ChannelService],
})
export class ChannelModule {}
