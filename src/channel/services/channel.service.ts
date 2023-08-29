import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { CreateChannelDto } from '../dto/create-channel.dto';
import { CreateChannelMemberDto } from '../dto/create-channel-member.dto';
import { Brackets, EntityManager, In, Like, Not, Repository } from 'typeorm';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { ChannelEntity, EChannelType } from '../entities/channel.entity';
import { ChannelMemberEntity } from '../entities/channel-member.entity';
import { ChannelMutedMemberEntity } from '../entities/channel-muted-member.entity';
import { ChannelBannedMemberEntity } from '../entities/channel-banned-member.entity';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { UpdateChannelDto } from '../dto/update-channel.dto';
import { ChannelKickService } from './channel-kick.service';

@Injectable()
export class ChannelService {
  constructor(
    private readonly userService: UserService,

    private readonly channelKickService: ChannelKickService,

    @InjectRepository(ChannelEntity)
    private readonly channelRepository: Repository<ChannelEntity>,

    @InjectRepository(ChannelMemberEntity)
    private readonly channelMemberRepository: Repository<ChannelMemberEntity>,

    @InjectRepository(ChannelMutedMemberEntity)
    private readonly channelMutedMemberRepository: Repository<ChannelMutedMemberEntity>,

    @InjectRepository(ChannelBannedMemberEntity)
    private readonly channelBannedMemberRepository: Repository<ChannelBannedMemberEntity>, // @Inject(forwardRef(() => ChatGateway)) // private readonly chatGateway: ChatGateway, // @Inject(forwardRef(() => ChatService)) // private readonly chatService: ChatService,

    @InjectEntityManager()
    private entityManager: EntityManager,
  ) {}

  async create(createChannelDto: CreateChannelDto, ownerId: number) {
    const { name, password, type } = createChannelDto;
    const tmp = await this.channelRepository.findOne({
      where: {
        name: name,
      },
    });

    if (tmp) throw new BadRequestException('이미 존재하는 채널 이름입니다.');

    if (type === EChannelType.protected && !password) {
      throw new InternalServerErrorException(
        '비밀번호가 필요한 채널을 생성하려면 비밀번호를 입력해야 합니다.',
      );
    }

    let hashedPassword = null;

    if (password) {
      const salt = await bcrypt.genSalt(); // 기본값으로 10을 사용
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const channel = await this.entityManager.transaction(async (manager) => {
      const channelRepository = manager.getRepository(ChannelEntity);
      const channelMemberRepository =
        manager.getRepository(ChannelMemberEntity);

      const channel = channelRepository.create({
        ownerId,
        name,
        password: hashedPassword,
        type,
      });
      await channelRepository.save(channel);

      const createChannelMemberDto: CreateChannelMemberDto = {
        channelId: channel.id,
        userId: ownerId,
        isAdmin: true,
        password: password,
      };
      const channelMember = channelMemberRepository.create(
        createChannelMemberDto,
      );
      await channelMemberRepository.save(channelMember);

      return channel;
    });
    return channel;
  }

  async createDirectChannel(userId: number, memberId: number) {
    if (userId === memberId) {
      throw new BadRequestException(
        '자신에게는 direct 채널을 생성할 수 없습니다.',
      );
    }

    const member = await this.userService.findOne(memberId);
    if (!member) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1');
    //tmp1, tmp2한번에 처리하기 QueryBuilder 안쓰고
    const alreadyExistChannel = await this.channelRepository.findOne({
      where: [
        {
          name: `${userId}-${memberId}`,
        },
        {
          name: `${memberId}-${userId}`,
        },
      ],
      relations: ['channelMembers'],
    });
    console.log('alreadyExistChannel', alreadyExistChannel);

    if (alreadyExistChannel?.channelMembers.length === 2) {
      console.log(
        'alreadyExistChannel.channelMembers.length',
        alreadyExistChannel.channelMembers.length,
      );
      return alreadyExistChannel;
    }
    if (alreadyExistChannel?.channelMembers.length === 1) {
      console.log(
        'alreadyExistChannel.channelMembers.length',
        alreadyExistChannel.channelMembers.length,
      );

      const isUserExist: ChannelMemberEntity =
        alreadyExistChannel.channelMembers.find(
          (channelMember) => channelMember.userId === userId,
        );
      console.log('isUserExist', isUserExist);
      const createChannelMemberDto: CreateChannelMemberDto = {
        channelId: alreadyExistChannel.id,
        userId: isUserExist ? memberId : userId,
        isAdmin: true,
        password: null,
      };
      console.log('createMemberDto ', createChannelMemberDto);
      const channelMember = this.channelMemberRepository.create(
        createChannelMemberDto,
      );
      await this.channelMemberRepository.save(channelMember);
      return alreadyExistChannel;
    }

    const channel = await this.entityManager.transaction(async (manager) => {
      const createChannelDto: CreateChannelDto = {
        name: `${userId}-${memberId}`,
        type: EChannelType.direct,
        password: null,
      };
      const channel = this.channelRepository.create({
        ownerId: userId,
        ...createChannelDto,
      });
      await manager.save(channel);
      console.log('channel save ', channel);
      const createChannelMemberDto1: CreateChannelMemberDto = {
        channelId: channel.id,
        userId: userId,
        isAdmin: true,
        password: null,
      };
      const channelMember1 = this.channelMemberRepository.create(
        createChannelMemberDto1,
      );

      const createChannelMemberDto2: CreateChannelMemberDto = {
        channelId: channel.id,
        userId: memberId,
        isAdmin: true,
        password: null,
      };
      const channelMember2 = this.channelMemberRepository.create(
        createChannelMemberDto2,
      );

      await manager.save(channelMember1);
      await manager.save(channelMember2);

      return channel;
    });

    return channel;
  }

  async update(
    userId: number,
    channelId: number,
    updateChannelDto: UpdateChannelDto,
  ): Promise<ChannelEntity> {
    const channel: ChannelEntity = await this.findOne(channelId);

    if (channel.type === EChannelType.direct) {
      throw new InternalServerErrorException('DM은 수정할 수 없습니다.');
    }

    this.checkIsChannelOwner(channel, userId);

    if (updateChannelDto.name) {
      channel.name = updateChannelDto.name;
    }

    if (updateChannelDto.type === EChannelType.direct) {
      throw new InternalServerErrorException('DM으로 변경할 수 없습니다.');
    }

    if (updateChannelDto.name) {
      const tmp = await this.channelRepository.findOne({
        where: {
          name: updateChannelDto.name,
        },
      });
      if (tmp && tmp.id !== channelId)
        throw new BadRequestException('이미 존재하는 채널 이름입니다.');
    }

    if (updateChannelDto.type) {
      if (updateChannelDto.type === EChannelType.protected) {
        if (!updateChannelDto.password)
          throw new InternalServerErrorException(
            '비밀번호가 필요한 채널을 생성하려면 비밀번호를 입력해야 합니다.',
          );
        const salt = await bcrypt.genSalt();
        channel.password = await bcrypt.hash(updateChannelDto.password, salt);
      }
      channel.type = updateChannelDto.type;
    }

    await this.channelRepository.save(channel);

    return channel;
  }

  async delete(userId: number, channelId: number) {
    const channel = await this.channelRepository.findOne({
      where: {
        id: channelId,
      },
      relations: ['channelMembers'],
    });
    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

    this.checkIsChannelOwner(channel, userId);

    for (const member of channel.channelMembers) {
      if (member.userId === userId) continue;
      await this.channelKickService.kick(userId, channelId, member.userId);
    }

    await this.channelRepository.delete({ id: channelId });
  }

  async findAll(): Promise<ChannelEntity[]> {
    try {
      const channels = await this.channelRepository.find({
        where: {
          type: In([EChannelType.public, EChannelType.protected]),
        },
      });
      return channels;
    } catch (err) {
      console.log(err);
    }
  }

  async findOne(channelId: number | string, relations?: string[]) {
    if (typeof channelId === 'string') channelId = parseInt(channelId);
    if (!relations)
      relations = [
        'channelMembers',
        'channelMembers.user',
        'channelMutedMembers',
        'channelMutedMembers.user',
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

  async findJoinedChannel(userId: number): Promise<ChannelEntity[]> {
    const channels = await this.channelRepository.find({
      where: {
        type: Not(EChannelType.direct),
      },
      relations: ['channelMembers', 'channelMembers.user'],
    });

    return channels.filter((channel) =>
      channel.channelMembers.some((member) => member.userId === userId),
    );
  }

  async findJoinedDirectChannel(userId: number): Promise<ChannelEntity[]> {
    let directChannels = await this.channelRepository.find({
      where: {
        type: EChannelType.direct,
      },
      relations: ['channelMembers', 'channelMembers.user', 'chats'],
    });

    directChannels = directChannels.map((channel) => {
      const lastChat = channel.chats[channel.chats.length - 1];
      channel.chats = [lastChat];
      return channel;
    });

    directChannels = directChannels.filter((channel) =>
      channel.channelMembers.some((member) => member.userId === userId),
    );

    const updatedDirectChannels = await Promise.all(
      directChannels.map(async (channel) => {
        const channelMemberIds = channel.name
          .split('-')
          .map((id: string) => parseInt(id));
        const memberId = channelMemberIds.find((id: number) => id !== userId);

        const member = await this.userService.findOne(memberId);
        channel.name = member.name;
        return channel;
      }),
    );

    return updatedDirectChannels;
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
    const channelMembers = await this.channelMemberRepository.find({
      where: {
        channelId: channelId,
      },
      relations: ['user'],
    });
    console.log(channelMembers);
    return channelMembers;
  }

  async findAllNonChannelMember(
    channelId: number,
  ): Promise<ChannelMemberEntity[]> {
    const channelMembers = await this.channelMemberRepository.find({
      where: {
        channelId: channelId,
      },
      relations: ['user'],
    });
    console.log(channelMembers);
    return channelMembers;
  }

  async findAllChannelMutedMember(
    channelId: number,
  ): Promise<ChannelMutedMemberEntity[]> {
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
    const channelBannedMembers = await this.channelBannedMemberRepository.find({
      where: {
        channelId: channelId,
      },
      relations: ['user'],
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
      throw new BadRequestException('채널 관리자가 아닙니다.');

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
      throw new BadRequestException('채널 소유자가 아닙니다.');

    if (memberId === userId)
      throw new BadRequestException('채널 소유자입니다.');

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
      throw new BadRequestException('채널 관리자가 아닙니다.');
    return admin;
  }

  checkIsChannelOwner(channel: ChannelEntity, userId: number) {
    if (channel.ownerId !== userId)
      throw new BadRequestException('채널 소유자가 아닙니다.');
  }

  checkIsNotChannelOwner(channel: ChannelEntity, userId: number) {
    if (channel.ownerId === userId)
      throw new BadRequestException(
        '채널 소유자에게는 해당 작업을 수행할 수 없습니다.',
      );
  }

  checkIsMe(userId: number, memberId: number) {
    if (userId === memberId)
      throw new BadRequestException(
        '자신에게는 해당 작업을 수행할 수 없습니다.',
      );
  }

  async findAllBySearchKeyword(options: {
    page: number;
    limit: number;
    searchKeyword: string;
  }): Promise<ChannelEntity[]> {
    const { limit, page, searchKeyword } = options;
    const skippedItems = (page - 1) * limit;

    if (!searchKeyword) {
      const channels = await this.channelRepository.find({
        where: {
          type: Not(EChannelType.direct),
        },
        order: {
          id: 'ASC',
        },
        skip: skippedItems,
        take: limit,
      });
      return channels;
    } else {
      const channels = await this.channelRepository.find({
        where: {
          name: Like(`%${searchKeyword}%`),
          type: Not(EChannelType.direct),
        },
        order: {
          id: 'ASC',
        },
        skip: skippedItems,
        take: limit,
      });
      return channels;
    }
  }
}
