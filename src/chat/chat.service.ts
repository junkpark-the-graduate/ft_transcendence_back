import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelService } from 'src/channel/channel.service';
import { Socket } from 'socket.io';

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
  connectedMembers: User[];
  mutedMembers: MutedMember[];
}

@Injectable()
export class ChatService {
  constructor(
    @Inject(forwardRef(() => ChannelService))
    private channelService: ChannelService,
  ) {}

  private channels: {
    [channelId: string]: Channel;
  } = {};

  public removeConnectedMember(channelId: string, userId: number) {
    this.channels[channelId].connectedMembers = this.channels[
      channelId
    ].connectedMembers.filter((user) => user.id !== userId);
  }

  public async initChannels(channelId: string) {
    const channel = await this.channelService.findOne(channelId);
    if (!channel) throw new NotFoundException('채널이 존재하지 않습니다.');

    if (!this.channels[channelId]) {
      this.channels[channelId] = {
        connectedMembers: [],
        mutedMembers: [],
      };
    }

    this.channels[channelId].mutedMembers = [
      ...channel.channelMutedMembers.map((channelMutedMember) => {
        return {
          id: channelMutedMember.user.id,
          mutedTime: channelMutedMember.mutedTime,
          createdAt: channelMutedMember.createdAt,
        };
      }),
    ];

    // mutedMembers에 있는 유저들 중에서 뮤트 시간이 지난 유저들은 mutedMembers에서 제거
    this.channels[channelId].mutedMembers.forEach((mutedMember) => {
      if (!this.isMutedMember(channelId, mutedMember.id)) {
        this.removeMutedMember(channelId, mutedMember.id);
      }
    });
  }

  public async addConnectedMember(
    channelId: string,
    userId: number,
    socket: Socket,
  ) {
    const member = await this.channelService.findOneChannelMember(
      channelId,
      userId,
    );
    if (!member)
      throw new NotFoundException('채널에 참여하지 않은 유저입니다.');

    this.channels[channelId].connectedMembers.push({
      socket: socket,
      id: member.user.id,
      name: member.user.name,
      image: member.user.image,
    });
  }

  public getMemberInChannel(channelId: string, userId: number) {
    return this.channels[channelId].connectedMembers.find(
      (user) => user.id === userId,
    );
  }

  public addMutedMember(
    channelId: number,
    userId: number,
    mutedTime: number,
    createdAt: Date,
  ) {
    const channel = this.channels[channelId.toString()];
    let mutedMember = channel.mutedMembers.find(
      (member) => member.id === userId,
    );

    if (!mutedMember) {
      mutedMember = { id: userId, mutedTime, createdAt };
      channel.mutedMembers.push(mutedMember);
    } else {
      mutedMember.createdAt = createdAt;
    }
  }

  public isMutedMember(channelId: string, userId: number): boolean {
    const mutedMember = this.channels[channelId].mutedMembers.find(
      (member) => member.id === userId,
    );
    if (!mutedMember) return false;
    if (this.isExpiredMutedTime(mutedMember)) {
      this.removeMutedMember(channelId, userId);
      return false;
    }
    return true;
  }

  public isExpiredMutedTime(mutedMember): boolean {
    const mutedTime: number = mutedMember.mutedTime * 60000; // Convert mutedTime to milliseconds
    const createdAt: Date = mutedMember.createdAt;
    const now: Date = new Date();
    const diff: number = now.getTime() - createdAt.getTime();

    // TODO: 원상복구 꼭하기
    //if (diff >= mutedTime)
    if (diff >= 0.25 * 60000) return true;
    return false;
  }

  public removeMutedMember(channelId: string, userId: number) {
    this.channelService.unmute(parseInt(channelId), userId);

    this.channels[channelId].mutedMembers = this.channels[
      channelId
    ].mutedMembers.filter((member) => member.id !== userId);
  }
}