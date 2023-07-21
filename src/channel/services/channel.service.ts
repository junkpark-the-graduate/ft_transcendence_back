import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateChannelDto } from '../dto/create-channel.dto';
import { CreateChannelMemberDto } from '../dto/create-channel-member.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelEntity } from '../entities/channel.entity';
import { ChannelMemberEntity } from '../entities/channel-member.entity';
import { ChannelMutedMemberEntity } from '../entities/channel-muted-member.entity';
import { ChannelBannedMemberEntity } from '../entities/channel-banned-member.entity';

@Injectable()
export class ChannelService {
  constructor(
    @InjectRepository(ChannelEntity)
    private readonly channelRepository: Repository<ChannelEntity>,

    @InjectRepository(ChannelMemberEntity)
    private readonly channelMemberRepository: Repository<ChannelMemberEntity>,

    @InjectRepository(ChannelMutedMemberEntity)
    private readonly channelMutedMemberRepository: Repository<ChannelMutedMemberEntity>,

    @InjectRepository(ChannelBannedMemberEntity)
    private readonly channelBannedMemberRepository: Repository<ChannelBannedMemberEntity>, // @Inject(forwardRef(() => ChatGateway)) // private readonly chatGateway: ChatGateway, // @Inject(forwardRef(() => ChatService)) // private readonly chatService: ChatService,
  ) {}

  async create(createChannelDto: CreateChannelDto, ownerId: number) {
    const { name, password, type } = createChannelDto;
    const tmp = await this.channelRepository.findOne({
      where: {
        name: name,
      },
    });

    if (tmp) throw new ConflictException('이미 존재하는 채널 이름입니다.');

    const channel = this.channelRepository.create({
      ownerId,
      name,
      password,
      type,
    });
    await this.channelRepository.save(channel);

    const createChannelMemberDto: CreateChannelMemberDto = {
      channelId: channel.id,
      userId: ownerId,
      isAdmin: true,
    };
    const channelMember = this.channelMemberRepository.create(
      createChannelMemberDto,
    );
    await this.channelMemberRepository.save(channelMember);

    return channel;
  }

  async delete(userId: number, channelId: number) {
    const channel = await this.channelRepository.findOne({
      where: {
        id: channelId,
      },
    });
    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

    // TODO : 비번 걸린 채널이면 비번 확인

    if (userId === channel.ownerId) {
      await this.channelMemberRepository.delete({ channelId: channelId });
      await this.channelRepository.delete(channelId);
      return channel;
    } else {
      throw new UnauthorizedException('채널 삭제 권한이 없습니다.');
    }
  }

  async findAll(): Promise<ChannelEntity[]> {
    const channels = await this.channelRepository.find();
    return channels;
  }

  async findOne(channelId: number | string, relations?: string[]) {
    if (typeof channelId === 'string') channelId = parseInt(channelId);
    if (!relations)
      relations = [
        'channelMembers',
        'channelMembers.user',
        'channelMutedMembers',
        'channelMutedMembers.user', //Todo: 필요 없으면 지워야함
        'channelBannedMembers',
        'channelBannedMembers.user',
      ];

    const channel = await this.channelRepository.findOne({
      where: {
        id: channelId,
      },
      relations: relations,
    });
    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

    return channel;
  }

  async findOneChannelMember(channelId: number | string, userId: number) {
    if (typeof channelId === 'string') channelId = parseInt(channelId);

    const channelMember = await this.channelMemberRepository.findOne({
      where: {
        channelId,
        userId,
      },
      relations: ['user'],
    });
    if (!channelMember)
      throw new NotFoundException('존재하지 않는 채널 멤버입니다.');

    return channelMember;
  }

  async findAllChannelMember(
    channelId: number,
  ): Promise<ChannelMemberEntity[]> {
    // TODO: 채널관리만 조회할 수 있도록
    const channelMembers = await this.channelMemberRepository.find({
      where: {
        channelId: channelId,
      },
    });
    console.log(channelMembers);
    return channelMembers;
  }

  async findAllChannelMutedMember(
    channelId: number,
  ): Promise<ChannelMutedMemberEntity[]> {
    // TODO: 채널관리만 조회할 수 있도록
    const channelMutedMembers = await this.channelMutedMemberRepository.find({
      where: {
        channelId: channelId,
      },
    });
    console.log(channelMutedMembers);
    return channelMutedMembers;
  }

  async findAllChannelBannedMember(
    channelId: number,
  ): Promise<ChannelBannedMemberEntity[]> {
    // TODO: 채널관리만 조회할 수 있도록
    const channelBannedMembers = await this.channelBannedMemberRepository.find({
      where: {
        channelId: channelId,
      },
    });
    console.log(channelBannedMembers);
    return channelBannedMembers;
  }

  async checkChannelAdmin(userId: number, channelId: number): Promise<boolean> {
    const channelMember = await this.channelMemberRepository.findOne({
      where: {
        userId: userId,
        channelId: channelId,
      },
    });
    if (!channelMember)
      throw new NotFoundException('존재하지 않는 채널 멤버입니다.');
    if (!channelMember.isAdmin)
      throw new UnauthorizedException('채널 관리자가 아닙니다.');

    return true;
  }

  async updateChannelAdmin(
    userId: number,
    channelId: number,
    memberId: number,
  ) {
    const channel = await this.channelRepository.findOne({
      where: {
        id: channelId,
      },
      relations: {
        user: true,
        channelMembers: true,
      },
    });

    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');
    if (channel.ownerId !== userId)
      throw new UnauthorizedException('채널 소유자가 아닙니다.');

    if (memberId === userId)
      throw new UnauthorizedException('채널 소유자입니다.');

    const member = channel.channelMembers.find(
      (member) => member.userId === memberId,
    );
    if (!member) throw new NotFoundException('존재하지 않는 채널 멤버입니다.');

    member.isAdmin = !member.isAdmin;
    await this.channelMemberRepository.save(member);
    return member;
  }

  checkIsChannelMember(
    channel: ChannelEntity,
    userId: number,
  ): ChannelMemberEntity {
    const member = channel.channelMembers.find(
      (member) => member.userId === userId,
    );
    if (!member) throw new NotFoundException('채널 멤버가 아닙니다.');
    return member;
  }

  checkIsChannelAdmin(
    channel: ChannelEntity,
    userId: number,
  ): ChannelMemberEntity {
    const admin = channel.channelMembers.find(
      (member) => member.userId === userId,
    );
    if (!admin) throw new NotFoundException('채널 멤버가 아닙니다.');
    if (!admin.isAdmin)
      throw new UnauthorizedException('채널 관리자가 아닙니다.');
    return admin;
  }

  checkIsChannelOwner(channel: ChannelEntity, userId: number, type: string) {
    if (type === 'user' && channel.ownerId !== userId)
      throw new UnauthorizedException('채널 소유자가 아닙니다.');
    else if (type === 'member' && channel.ownerId === userId)
      throw new UnauthorizedException(
        '채널 소유자에게는 해당 작업을 수행할 수 없습니다.',
      );
  }

  checkIsMe(userId: number, memberId: number) {
    if (userId === memberId)
      throw new UnauthorizedException(
        '자신에게는 해당 작업을 수행할 수 없습니다.',
      );
  }
}
