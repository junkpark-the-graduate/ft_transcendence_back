import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateBlockingDto } from './dto/create-blocking.dto';
import { BlockEntity } from '../block/block.entity';
import { DeleteBlockingDto } from './dto/delete-blocking.dto';

@Injectable()
export class BlockService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(BlockEntity)
    private readonly blockRepository: Repository<BlockEntity>,
  ) {}

  async block(createBlockingDto: CreateBlockingDto) {
    const user = await this.userRepository.findOne({
      where: {
        id: createBlockingDto.blockingId,
      },
      relations: {
        blockings: true,
      },
    });

    if (!user) throw new NotFoundException('타겟이 존재하지 않는 유저입니다.');
    if (createBlockingDto.userId === createBlockingDto.blockingId)
      throw new BadRequestException('본인은 블락할 수 없습니다.');

    let blockingUser = user.blockings.find(
      (user) =>
        user.blockingId === createBlockingDto.blockingId &&
        user.userId === createBlockingDto.userId,
    );
    if (blockingUser) {
      console.log('이미 블락된 유저입니다.');
      return;
    }
    blockingUser = this.blockRepository.create(createBlockingDto);
    await this.blockRepository.save(blockingUser);

    return blockingUser;
  }

  async unBlock(deleteBlockingDto: DeleteBlockingDto) {
    const targetUser = await this.blockRepository.findOne({
      where: {
        userId: deleteBlockingDto.userId,
        blockingId: deleteBlockingDto.blockingId,
      },
    });

    if (!targetUser) throw new NotFoundException('블락한 적 없는 유저입니다.');

    await this.blockRepository.delete(deleteBlockingDto);
    return targetUser;
  }

  async findAllBlockedUser(): Promise<BlockEntity[]> {
    const blockingUsers: BlockEntity[] = await this.blockRepository.find();
    return blockingUsers;
  }

  async findAllBlockedUserByUserId(userId: number): Promise<BlockEntity[]> {
    const blockingUsers: BlockEntity[] = await this.blockRepository.find({
      where: {
        userId: userId,
      },
    });
    return blockingUsers;
  }

  async findAllBlockedUserByBlockingId(
    blockingId: number,
  ): Promise<BlockEntity[]> {
    const blockingUsers: BlockEntity[] = await this.blockRepository.find({
      where: {
        blockingId: blockingId,
      },
    });
    return blockingUsers;
  }
}
