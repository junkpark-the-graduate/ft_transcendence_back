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
    const { id, email, name, image } = createUserDto;

    try {
      const user = this.userRepository.create({
        id,
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

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: id,
      },
    });
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { name, twoFactorEnabled } = updateUserDto;

    let user = await this.userRepository.findOne({
      where: {
        id: id,
      },
    });

    user.name = name;
    user.twoFactorEnabled = twoFactorEnabled;

    user = await this.userRepository.save(user);

    return user;
  }

  async remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
