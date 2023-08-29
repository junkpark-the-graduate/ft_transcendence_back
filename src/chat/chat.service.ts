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
import { InjectRepository } from '@nestjs/typeorm';
import { ChatEntity } from './chat.entity';
import { Repository } from 'typeorm';

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

    @InjectRepository(ChatEntity)
    private readonly chatRepository: Repository<ChatEntity>,
  ) {}

  private channels: Map<string, Channel> = new Map<string, Channel>();

  removeConnectedMember(channelId: string, userId: number) {
    if (!this.channels[channelId]) return;
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
    return member;
  }

  getMemberInChannel(channelId: string, userId: number) {
    if (!this.channels[channelId]) return null;
    return this.channels[channelId].connectedMembers.get(userId);
  }

  getConnectedMembers(channelId: string) {
    if (!this.channels[channelId]) return null;

    const connectedMembers = this.channels[channelId].connectedMembers;
    const membersInfo = [];
    connectedMembers.forEach((member) => {
      membersInfo.push({
        id: member.id,
        name: member.name,
        image: member.image,
      });
    });
    return membersInfo;
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

    if (diff >= mutedTime) return true; // 5min
    // if (diff >= 0.25 * 60000) return true; // 15sec
    return false;
  }

  removeMutedMember(channelId: string, userId: number) {
    this.channelMuteService.unmute(parseInt(channelId), userId);
    this.channels[channelId].mutedMembers.delete(userId);
  }

  saveMessage(userId: number, channelId: string, message: string) {
    const res = this.chatRepository.create({
      user: { id: userId },
      channel: { id: parseInt(channelId) },
      message: message,
    });
    this.chatRepository.save(res);
  }

  async getChatHistory(channelId: number, page: number) {
    const ITEMS_PER_PAGE = 30;

    const ret = await this.chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.user', 'user', 'user.id = chat.userId') // chat.userId는 실제 컬럼에 따라 달라질 수 있습니다.
      .select(['chat.id', 'chat.message', 'user.id', 'user.name', 'user.image'])
      .where('chat.channelId = :channelId', { channelId: channelId })
      .orderBy('chat.id', 'DESC')
      .skip((page - 1) * ITEMS_PER_PAGE)
      .take(ITEMS_PER_PAGE)
      .getMany();

    return ret.reverse();
  }

  async findConnectedMember(channelId: string, userId: number) {
    const channel = this.channels[channelId];
    if (!channel) return null;
    return channel.connectedMembers.get(userId);
  }
}
