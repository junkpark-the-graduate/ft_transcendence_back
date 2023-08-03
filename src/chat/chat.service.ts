import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ChannelService } from 'src/channel/services/channel.service';
import { Socket } from 'socket.io';
import { ChannelMuteService } from 'src/channel/services/channel-mute.service';

interface User {
  socket: Socket;
  id: number;
  name: string;
  image: string;
}

interface MutedMember {
  id: number;
  mutedTime: number;
  createdAt: Date;
}

interface Channel {
  connectedMembers: Map<number, User>;
  mutedMembers: Map<number, MutedMember>;
}

@Injectable()
export class ChatService {
  constructor(
    @Inject(forwardRef(() => ChannelService))
    private channelService: ChannelService,
    private channelMuteService: ChannelMuteService,
  ) {}

  private channels: Map<string, Channel> = new Map<string, Channel>();

  removeConnectedMember(channelId: string, userId: number) {
    this.channels[channelId].connectedMembers.delete(userId);
  }

  async initChannels(channelId: string) {
    const channel = await this.channelService.findOne(channelId);
    if (!channel) throw new NotFoundException('채널이 존재하지 않습니다.');

    if (!this.channels[channelId]) {
      this.channels[channelId] = {
        connectedMembers: new Map<number, User>(),
        mutedMembers: new Map<number, MutedMember>(),
      };
    }

    channel.channelMutedMembers.forEach((channelMutedMember) => {
      const mutedMember: MutedMember = {
        id: channelMutedMember.user.id,
        mutedTime: channelMutedMember.mutedTime,
        createdAt: channelMutedMember.createdAt,
      };
      this.channels[channelId].mutedMembers.set(
        channelMutedMember.user.id,
        mutedMember,
      );
    });
  }

  async addConnectedMember(channelId: string, userId: number, socket: Socket) {
    const member = await this.channelService.findOneChannelMember(
      channelId,
      userId,
    );
    if (!member)
      throw new NotFoundException('채널에 참여하지 않은 유저입니다.');

    this.channels[channelId].connectedMembers.set(userId, {
      socket: socket,
      id: member.user.id,
      name: member.user.name,
      image: member.user.image,
    });
  }

  getMemberInChannel(channelId: string, userId: number) {
    if (!this.channels[channelId]) return null;
    return this.channels[channelId].connectedMembers.get(userId);
  }

  addMutedMember(
    channelId: number,
    userId: number,
    mutedTime: number,
    createdAt: Date,
  ) {
    const channel = this.channels[channelId.toString()];
    let mutedMember = channel.mutedMembers.get(userId);

    if (!mutedMember) {
      mutedMember = { id: userId, mutedTime, createdAt };
      channel.mutedMembers.set(userId, mutedMember);
    } else {
      mutedMember.createdAt = createdAt;
    }
  }

  isMutedMember(channelId: string, userId: number): boolean {
    const mutedMember = this.channels[channelId].mutedMembers.get(userId);
    if (!mutedMember) return false;
    if (this.isExpiredMutedTime(mutedMember)) {
      return false;
    }
    return true;
  }

  isExpiredMutedTime(mutedMember): boolean {
    const mutedTime: number = mutedMember.mutedTime * 60000; // Convert mutedTime to milliseconds
    const createdAt: Date = mutedMember.createdAt;
    const now: Date = new Date();
    const diff: number = now.getTime() - createdAt.getTime();

    // TODO: 원상복구 꼭하기
    //if (diff >= mutedTime)
    if (diff >= 0.25 * 60000) return true;
    return false;
  }

  removeMutedMember(channelId: string, userId: number) {
    this.channelMuteService.unmute(parseInt(channelId), userId);
    this.channels[channelId].mutedMembers.delete(userId);
  }
}
