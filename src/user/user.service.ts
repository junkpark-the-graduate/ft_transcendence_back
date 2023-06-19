import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  async update(ftId: number, updateUserDto: UpdateUserDto) {
    const { name, twoFactor } = updateUserDto;

    const user = await this.userRepository.update(ftId, {
      name: name,
      twoFactor: twoFactor,
    });
    console.log('updateUserDto: ', updateUserDto);
    return user;
  }

  async remove(ftId: number) {
    return `This action removes a #${ftId} user`;
  }
}
