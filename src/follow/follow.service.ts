import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './follow.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
  ) {}

  async follow(userId: number, following: number) {
    const follow = new Follow();
    follow.userId = userId;
    follow.following = following;
    await this.followRepository.save(follow);
  }

  async unfollow(userId: number, followingId: number) {
    await this.followRepository.delete({ userId, following: followingId });
  }

  async getFollowingsByUser(userId: number): Promise<Follow[]> {
    return this.followRepository.find({
      where: { userId },
    });
  }
}
