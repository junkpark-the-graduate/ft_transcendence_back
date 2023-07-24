import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';

import { CreateChannelDto } from '../dto/create-channel.dto';
import { CreateChannelMemberDto } from '../dto/create-channel-member.dto';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { ChannelEntity, EChannelType } from '../entities/channel.entity';
import { ChannelMemberEntity } from '../entities/channel-member.entity';
import { ChannelMutedMemberEntity } from '../entities/channel-muted-member.entity';
import { ChannelBannedMemberEntity } from '../entities/channel-banned-member.entity';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';
import { UpdateChannelDto } from '../dto/update-channel.dto';

@Injectable()
export class ChannelService {
  constructor(
    private readonly userService: UserService,

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

    if (tmp) throw new ConflictException('이미 존재하는 채널 이름입니다.');

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
      throw new ConflictException(
        '자신에게는 direct 채널을 생성할 수 없습니다.',
      );
    }

    const member = await this.userService.findOne(memberId);
    if (!member) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    const tmp = await this.channelRepository
      .createQueryBuilder('channel')
      .innerJoinAndSelect('channel.channelMembers', 'channelMember')
      .where('channel.type = :type', { type: EChannelType.direct })
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            '(channel.ownerId = :ownerId AND channelMember.userId = :memberId)',
          ).orWhere(
            '(channel.ownerId = :memberId AND channelMember.userId = :ownerId)',
          );
        }),
        { ownerId: userId, memberId: memberId },
      )
      .getOne();

    if (tmp) {
      throw new ConflictException('이미 존재하는 direct 채널입니다.');
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

      const createChannelMemberDto: CreateChannelMemberDto = {
        channelId: channel.id,
        userId: memberId,
        isAdmin: true,
        password: null,
      };
      const channelMember = this.channelMemberRepository.create(
        createChannelMemberDto,
      );
      await manager.save(channelMember);
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

    this.checkIsChannelOwner(channel, userId);

    if (updateChannelDto.name) {
      channel.name = updateChannelDto.name;
    }
    if (updateChannelDto.type) {
      channel.type = updateChannelDto.type;
    }

    if (updateChannelDto.type === EChannelType.protected) {
      if (!updateChannelDto.password)
        throw new InternalServerErrorException(
          '비밀번호가 필요한 채널을 생성하려면 비밀번호를 입력해야 합니다.',
        );
      const salt = await bcrypt.genSalt();
      channel.password = await bcrypt.hash(updateChannelDto.password, salt);
    }

    await this.channelRepository.save(channel);

    return channel;
  }

  async delete(userId: number, channelId: number) {
    const channel = await this.channelRepository.findOne({
      where: {
        id: channelId,
      },
    });
    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

    this.checkIsChannelOwner(channel, userId);

    await this.channelRepository.delete({ id: channelId });
  }

  async findAll(): Promise<ChannelEntity[]> {
    try {
      const channels = await this.channelRepository.find();
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

  async findJoinedChannel(userId: number) {
    const channels = await this.channelRepository
      .createQueryBuilder('channel')
      .innerJoin('channel.channelMembers', 'channelMember')
      .where('channelMember.userId = :userId', { userId })
      .getMany();
    return channels;
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

  checkIsChannelOwner(channel: ChannelEntity, userId: number) {
    if (channel.ownerId !== userId)
      throw new UnauthorizedException('채널 소유자가 아닙니다.');
  }

  checkIsNotChannelOwner(channel: ChannelEntity, userId: number) {
    if (channel.ownerId === userId)
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
