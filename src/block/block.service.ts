import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Block } from './block.entity';

@Injectable()
export class BlockService {
  constructor(
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
  ) {}

  async block(userId: number, blocking: number) {
    const block = new Block();
    block.userId = userId;
    block.blocking = blocking;
    await this.blockRepository.save(block);
  }

  async unblock(userId: number, blockingId: number) {
    await this.blockRepository.delete({ userId, blocking: blockingId });
  }

  async getFollowingsByUser(userId: number): Promise<Block[]> {
    return this.blockRepository.find({
      where: { userId },
    });
  }
}
