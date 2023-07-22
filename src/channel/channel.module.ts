import { Module, forwardRef } from '@nestjs/common';
import { ChannelService } from './services/channel.service';
import { ChannelBanService } from './services/channel-ban.service';
import { ChannelMemberService } from './services/channel-member.service';
import { ChannelKickService } from './services/channel-kick.service';
import { ChannelMuteService } from './services/channel-mute.service';
import { ChannelController } from './channel.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelEntity } from './entities/channel.entity';
import { ChannelMemberEntity } from './entities/channel-member.entity';
import { ChannelMutedMemberEntity } from './entities/channel-muted-member.entity';
import { ChannelBannedMemberEntity } from './entities/channel-banned-member.entity';
import { ChatModule } from 'src/chat/chat.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChannelEntity,
      ChannelMemberEntity,
      ChannelMutedMemberEntity,
      ChannelBannedMemberEntity,
    ]),
    forwardRef(() => ChatModule),
    UserModule,
  ],
  controllers: [ChannelController],
  providers: [
    ChannelService,
    ChannelBanService,
    ChannelMuteService,
    ChannelMemberService,
    ChannelKickService,
  ],
  exports: [
    ChannelService,
    ChannelBanService,
    ChannelMuteService,
    ChannelMemberService,
    ChannelKickService,
  ],
})
export class ChannelModule {}
