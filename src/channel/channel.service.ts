import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { CreateChannelMemberDto } from './dto/create-channel-member.dto';
import { CreateChannelMutedMemberDto } from './dto/create-channel-muted-member.dto';
import { CreateChannelBannedMemberDto } from './dto/create-channel-banned-member.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelEntity } from './entities/channel.entity';
import { ChannelMemberEntity } from './entities/channel-member.entity';
import { ChannelMutedMemberEntity } from './entities/channel-muted-member.entity';
import { ChannelBannedMemberEntity } from './entities/channel-banned-member.entity';
import { ChatGateway } from 'src/chat/chat.gateway';
import { DeleteChannelBannedMemberDto } from './dto/delete-channel-banned-member.dto';
import { DeleteChannelMutedMemberDto } from './dto/delete-channel-muted-member.dto';
import { ChatService } from 'src/chat/chat.service';

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
    private readonly channelBannedMemberRepository: Repository<ChannelBannedMemberEntity>,

    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,

    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  async create(createChannelDto: CreateChannelDto, ownerId: number) {
    try {
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
    } catch (error) {
      if (error.status) throw error;
      throw new InternalServerErrorException(error.message);
    }
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
    try {
      const channels = await this.channelRepository.find();
      return channels;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOne(channelId: number | string) {
    if (typeof channelId === 'string') channelId = parseInt(channelId);
    try {
      const channel = await this.channelRepository.findOne({
        where: {
          id: channelId,
        },
        relations: [
          'channelMembers',
          'channelMembers.user',
          'channelMutedMembers',
          'channelMutedMembers.user', //Todo: 필요 없으면 지워야함
          'channelBannedMembers',
          'channelBannedMembers.user',
        ],
      });
      if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

      return channel;
    } catch (error) {
      if (error.status) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async findOneChannelMember(channelId: number | string, userId: number) {
    if (typeof channelId === 'string') channelId = parseInt(channelId);
    try {
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
    } catch (error) {
      if (error.status) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async join(createChannelMemberDto: CreateChannelMemberDto) {
    try {
      const channel = await this.channelRepository.findOne({
        where: {
          id: createChannelMemberDto.channelId,
        },
        relations: {
          channelMembers: true,
          channelBannedMembers: true,
        },
      });

      if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');
      // Todo: 비밀번호 체크
      // if (channel.password !== createChannelMemberDto.password)
      //   throw new ConflictException('비밀번호가 틀렸습니다.');

      if (
        channel.channelMembers.find(
          (member) => member.userId === createChannelMemberDto.userId,
        )
      ) {
        // TODO : 이미 참여한 채널일때의 상황 구별해야함
        return channel;
        // throw new ConflictException("이미 참여한 채녈입니다");
      }

      const bannedMember = channel.channelBannedMembers.find(
        (member) => member.userId === createChannelMemberDto.userId,
      );
      if (bannedMember) throw new UnauthorizedException('차단된 사용자입니다.');

      const channelMember = this.channelMemberRepository.create(
        createChannelMemberDto,
      );
      await this.channelMemberRepository.save(channelMember);

      return channel;
    } catch (error) {
      if (error.status) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async mute(
    createChannelMutedMemberDto: CreateChannelMutedMemberDto,
    userId: number,
  ) {
    try {
      const channel = await this.channelRepository.findOne({
        where: {
          id: createChannelMutedMemberDto.channelId,
        },
        relations: {
          channelMembers: true,
          channelMutedMembers: true,
        },
      });
      if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

      const admin = channel.channelMembers.find(
        (member) => member.userId === userId,
      );
      if (!admin) throw new NotFoundException('채널 멤버가 아닙니다.');
      if (!admin.isAdmin)
        throw new UnauthorizedException('채널 관리자가 아닙니다');

      const channelMember = channel.channelMembers.find(
        (member) => member.userId === createChannelMutedMemberDto.userId,
      );
      if (!channelMember) throw new NotFoundException('채널 멤버가 아닙니다.');
      if (channelMember.userId === channel.ownerId)
        throw new UnauthorizedException('소유자는 뮤트할 수 없습니다.');

      let mutedMember = channel.channelMutedMembers.find(
        (member) => member.userId === createChannelMutedMemberDto.userId,
      );

      if (mutedMember) return mutedMember;

      mutedMember = this.channelMutedMemberRepository.create(
        createChannelMutedMemberDto,
      );
      await this.channelMutedMemberRepository.save(mutedMember);

      this.chatService.addMutedMember(
        channel.id,
        mutedMember.userId,
        mutedMember.mutedTime,
        mutedMember.createdAt,
      );

      return mutedMember;
    } catch (error) {
      console.log(error);
      if (error.status) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async unmute(channelId: number, userId: number) {
    try {
      const channel = await this.channelRepository.findOne({
        where: {
          id: channelId,
        },
        relations: {
          channelMembers: true,
          channelMutedMembers: true,
        },
      });
      if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

      const mutedMember = channel.channelMutedMembers.find(
        (member) => member.userId === userId,
      );
      if (!mutedMember)
        throw new NotFoundException('채널 뮤트 멤버가 아닙니다.');

      await this.channelMutedMemberRepository.delete({
        channelId: channelId,
        userId: userId,
      });

      return mutedMember;
    } catch (error) {
      console.log(error);
      if (error.status) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async ban(
    createChannelBannedMemberDto: CreateChannelBannedMemberDto,
    userId: number,
  ) {
    try {
      const channel = await this.channelRepository.findOne({
        where: {
          id: createChannelBannedMemberDto.channelId,
        },
        relations: {
          channelMembers: true,
          channelBannedMembers: true,
        },
      });
      if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');
      const admin = channel.channelMembers.find(
        (member) => member.userId === userId,
      );
      if (!admin) throw new NotFoundException('채널 멤버가 아닙니다.');
      if (!admin.isAdmin)
        throw new UnauthorizedException('채널 관리자가 아닙니다');

      const channelMember = channel.channelMembers.find(
        (member) => member.userId === createChannelBannedMemberDto.userId,
      );
      if (!channelMember) throw new NotFoundException('채널 멤버가 아닙니다.');
      if (channelMember.userId === channel.ownerId)
        throw new UnauthorizedException('소유자는 밴할 수 없습니다.');

      let banMember = channel.channelBannedMembers.find(
        (member) => member.userId === createChannelBannedMemberDto.userId,
      );
      if (banMember) return banMember;
      banMember = this.channelBannedMemberRepository.create(
        createChannelBannedMemberDto,
      );
      await this.channelBannedMemberRepository.save(banMember);

      this.chatGateway.kickMember(
        createChannelBannedMemberDto.channelId,
        createChannelBannedMemberDto.userId,
      );

      await this.channelMemberRepository.delete(createChannelBannedMemberDto);
      return banMember;
    } catch (error) {
      console.log(error);
      if (error.status) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async kick(userId: number, channelId: number, memberId: number) {
    const channel = await this.channelRepository.findOne({
      where: {
        id: channelId,
      },
      relations: {
        channelMembers: true,
      },
    });
    if (!channel) throw new NotFoundException('존재하지 않는 채널입니다.');

    const admin = channel.channelMembers.find(
      (member) => member.userId === userId,
    );
    if (!admin) throw new NotFoundException('채널 멤버가 아닙니다.');
    if (!admin.isAdmin) throw new UnauthorizedException('채널 관리자가 아닙니다.');

    const channelMember = channel.channelMembers.find(
      (member) => member.userId === memberId,
    );
    if (!channelMember) throw new NotFoundException('채널 멤버가 아닙니다.');
    if (channelMember.userId === channel.ownerId) throw new UnauthorizedException('소유자는 쫓아낼 수 없습니다.');

    this.chatGateway.kickMember(channelId, memberId);

    await this.channelMemberRepository.delete({ userId: memberId });
    
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

  async deleteChannelMutedMember(
    userId: number,
    deleteChannelMutedMemberDto: DeleteChannelMutedMemberDto,
  ): Promise<ChannelMutedMemberEntity> {
    try {
      const user = await this.channelMemberRepository.findOne({
        where: {
          userId,
          channelId: deleteChannelMutedMemberDto.channelId,
        },
      });
      if (!user) throw new NotFoundException('존재하지 않는 채널 멤버입니다.');
      if (!user.isAdmin)
        throw new UnauthorizedException('채널 관리자가 아닙니다.');

      const channelMutedMember =
        await this.channelMutedMemberRepository.findOne({
          where: {
            channelId: deleteChannelMutedMemberDto.channelId,
            userId: deleteChannelMutedMemberDto.userId,
          },
        });
      if (!channelMutedMember)
        throw new NotFoundException('존재하지 않는 채널 뮤트 멤버입니다.');

      await this.channelMutedMemberRepository.delete(
        deleteChannelMutedMemberDto,
      );
      return channelMutedMember;
    } catch (error) {
      console.log(error);
      if (error.status) throw error;
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteChannelBannedMember(
    userId: number,
    deleteChannelBannedMemberDto: DeleteChannelBannedMemberDto,
  ): Promise<ChannelBannedMemberEntity> {
    try {
      const user = await this.channelMemberRepository.findOne({
        where: {
          userId,
          channelId: deleteChannelBannedMemberDto.channelId,
        },
      });
      if (!user) throw new NotFoundException('존재하지 않는 채널 멤버입니다.');
      if (!user.isAdmin)
        throw new UnauthorizedException('채널 관리자가 아닙니다.');

      const channelBannedMember =
        await this.channelBannedMemberRepository.findOne({
          where: {
            channelId: deleteChannelBannedMemberDto.channelId,
            userId: deleteChannelBannedMemberDto.userId,
          },
        });
      if (!channelBannedMember)
        throw new NotFoundException('존재하지 않는 채널 차단 멤버입니다.');

      await this.channelBannedMemberRepository.delete(
        deleteChannelBannedMemberDto,
      );
      return channelBannedMember;
    } catch (error) {
      console.log(error);
      if (error.status) throw error;
      throw new InternalServerErrorException(error.message);
    }
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
}
