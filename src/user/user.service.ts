import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { ftId, email, name, image } = createUserDto;

    try {
      const user = this.userRepository.create({
        ftId,
        email,
        name,
        image,
      });

      await this.userRepository.save(user);

      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll() {
    return `This action returns all user`;
  }

  async findOne(ftId: number) {
    const user = await this.userRepository.findOne({
      where: {
        ftId: ftId,
      },
    });
    return user;
  }

  async update(ftId: number, updateData: any) {
    const { name, twoFactor, mmr } = updateData;

    let user = await this.userRepository.findOne({
      where: {
        ftId: ftId,
      },
    });

    if (name) user.name = name;
    if (twoFactor) user.twoFactor = twoFactor;
    if (mmr) user.mmr = mmr;

    user = await this.userRepository.save(user);

    return user;
  }

  async remove(ftId: number) {
    return `This action removes a #${ftId} user`;
  }
}
