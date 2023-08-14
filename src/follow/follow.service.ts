import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/user/user.entity';
import { CreateFollowingDto } from './dto/create-following.dto';
import { FollowEntity } from './follow.entity';
import { DeleteFollowingDto } from './dto/delete-following.dto';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(FollowEntity)
    private readonly followRepository: Repository<FollowEntity>,
  ) {}

  async follow(createFollowingDto: CreateFollowingDto) {
    const user = await this.userRepository.findOne({
      where: {
        id: createFollowingDto.followingId,
      },
      relations: {
        followings: true,
      },
    });

    if (!user) throw new NotFoundException('타겟이 존재하지 않는 유저입니다.');
    if (createFollowingDto.userId === createFollowingDto.followingId)
      throw new BadRequestException('본인은 팔로우할 수 없습니다.');

    let followingUser = user.followings.find(
      (user) =>
        user.followingId === createFollowingDto.followingId &&
        user.userId === createFollowingDto.userId,
    );
    if (followingUser) {
      console.log('이미 팔로우된 유저입니다.');
      return;
    }
    followingUser = this.followRepository.create(createFollowingDto);
    await this.followRepository.save(followingUser);

    return followingUser;
  }

  async unfollow(deleteFollowingDto: DeleteFollowingDto) {
    const targetUser = await this.followRepository.findOne({
      where: {
        userId: deleteFollowingDto.userId,
        followingId: deleteFollowingDto.followingId,
      },
    });

    if (!targetUser)
      throw new NotFoundException('팔로우한 적 없는 유저입니다.');

    await this.followRepository.delete(deleteFollowingDto);
    return targetUser;
  }

  async findAllFollowingsByUserId(userId: number): Promise<FollowEntity[]> {
    const followingUsers: FollowEntity[] = await this.followRepository.find({
      where: {
        userId: userId,
      },
    });
    return followingUsers;
  }
}
