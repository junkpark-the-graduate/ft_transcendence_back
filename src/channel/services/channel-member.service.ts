import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateChannelMemberDto } from '../dto/create-channel-member.dto';
import { DeleteChannelMemberDto } from '../dto/delete-channel-member.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ChannelMemberEntity } from '../entities/channel-member.entity';
import { ChannelService } from './channel.service';
import { ChatService } from 'src/chat/chat.service';
import { ChannelEntity, EChannelType } from '../entities/channel.entity';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { UserEntity } from 'src/user/user.entity';

@Injectable()
export class ChannelMemberService {
  constructor(
    private userService: UserService,

    private channelService: ChannelService,

    private chatService: ChatService,

    @InjectRepository(ChannelEntity)
    private readonly channelRepository: Repository<ChannelEntity>,

    @InjectRepository(ChannelMemberEntity)
    private readonly channelMemberRepository: Repository<ChannelMemberEntity>,
  ) {}

  async join(createChannelMemberDto: CreateChannelMemberDto) {
    const channel = await this.channelService.findOne(
      createChannelMemberDto.channelId,
      ['channelMembers', 'channelBannedMembers'],
    );

    if (
      channel.channelMembers.find(
        (member) => member.userId === createChannelMemberDto.userId,
      )
    ) {
      return channel;
    }

    if (channel.type === EChannelType.direct) {
      if (channel.channelMembers.length >= 2)
        throw new BadRequestException('채널 인원이 가득 찼습니다.');
    } else if (channel.type === EChannelType.protected) {
      const isMatch = await bcrypt.compare(
        createChannelMemberDto.password,
        channel.password,
      );
      if (!isMatch) throw new BadRequestException('비밀번호가 틀렸습니다.');
    } else if (channel.type === EChannelType.private) {
      throw new BadRequestException('비밀 채널입니다.');
    }

    const bannedMember = channel.channelBannedMembers.find(
      (member) => member.userId === createChannelMemberDto.userId,
    );
    if (bannedMember) throw new BadRequestException('차단된 사용자입니다.');

    const channelMember = this.channelMemberRepository.create(
      createChannelMemberDto,
    );
    await this.channelMemberRepository.save(channelMember);

    return channel;
  }

  // async exit(deleteChannelMemberDto: DeleteChannelMemberDto) {
  // await this.channelMemberRepository.delete({
  // channelId: deleteChannelMemberDto.channelId,
  // userId: deleteChannelMemberDto.userId,
  // });

  // const channelMembers = await this.channelMemberRepository.find({
  // where: { channelId: deleteChannelMemberDto.channelId },
  // order: { updatedAt: 'ASC' },
  // });

  // const channel = await this.channelRepository.findOne({
  // where: { id: deleteChannelMemberDto.channelId },
  // });

  // if (channelMembers.length === 0) {
  // await this.channelRepository.delete({
  // id: deleteChannelMemberDto.channelId,
  // });
  // return channel;
  // }

  // if (channel.ownerId === deleteChannelMemberDto.userId) {
  // // channelMembers에서 가장 오래된 admin 찾기
  // const oldAdmin = channelMembers.find((member) => member.isAdmin === true);
  // if (oldAdmin)
  // await this.channelRepository.update(channel.id, {
  // ownerId: oldAdmin.userId,
  // });
  // else {
  // const oldMemeber = channelMembers.find(
  // (member) => member.isAdmin === false,
  // );
  // await this.channelRepository.update(channel.id, {
  // ownerId: oldMemeber.userId,
  // });
  // }
  // }

  // return channel;
  // }

  async exit(deleteChannelMemberDto: DeleteChannelMemberDto) {
    return await this.channelRepository.manager.transaction(
      async (transactionalEntityManager: EntityManager) => {
        await transactionalEntityManager.delete(ChannelMemberEntity, {
          channelId: deleteChannelMemberDto.channelId,
          userId: deleteChannelMemberDto.userId,
        });

        const channelMembers = await transactionalEntityManager.find(
          ChannelMemberEntity,
          {
            where: { channelId: deleteChannelMemberDto.channelId },
            order: { updatedAt: 'ASC' },
          },
        );

        let channel = await transactionalEntityManager.findOne(ChannelEntity, {
          where: { id: deleteChannelMemberDto.channelId },
        });

        if (!channel) throw new Error('Channel not found');

        if (channelMembers.length === 0) {
          await transactionalEntityManager.delete(ChannelEntity, {
            id: deleteChannelMemberDto.channelId,
          });
          return channel;
        }

        if (channel.ownerId === deleteChannelMemberDto.userId) {
          const oldAdmin = channelMembers.find((member) => member.isAdmin);
          const newOwnerId = oldAdmin
            ? oldAdmin.userId
            : channelMembers[0].userId;

          await transactionalEntityManager.update(ChannelEntity, channel.id, {
            ownerId: newOwnerId,
          });
        }
        return await transactionalEntityManager.findOne(ChannelEntity, {
          where: { id: deleteChannelMemberDto.channelId },
        });
      },
    );
  }

  async invite(userId: number, createChannelMemberDto: CreateChannelMemberDto) {
    const member: UserEntity = await this.userService.findOne(
      createChannelMemberDto.userId,
    );
    if (!member) throw new NotFoundException('존재하지 않는 사용자입니다.');

    const channel: ChannelEntity = await this.channelService.findOne(
      createChannelMemberDto.channelId,
      ['channelMembers'],
    );

    if (
      channel.channelMembers.find(
        (member: ChannelMemberEntity) =>
          member.userId === createChannelMemberDto.userId,
      )
    ) {
      throw new ConflictException('이미 채널에 참여한 사용자입니다.');
    }

    this.channelService.checkIsChannelOwner(channel, userId);

    const channelMember: ChannelMemberEntity =
      this.channelMemberRepository.create(createChannelMemberDto);
    await this.channelMemberRepository.save(channelMember);

    return channelMember;
  }
}
