import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as path from 'path';
import * as fs from 'fs/promises';

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

  async findOneImg(id: number, imageName: string) {
    const user = await this.userRepository.findOne({
      where: {
        id: id,
      },
    });
    return user.image;
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

  async updateImage(id: number, filename: string, extension: string) {
    console.log('filename:', filename);

    const user = await this.userRepository.findOne({
      where: {
        id: id,
      },
    });

    const filePath = path.join(__dirname, '..', 'public');
    const newFileName = `${filename}.${extension.split('/')[1]}`;
    try {
      await fs.rename(`${filePath}/${filename}`, `${filePath}/${newFileName}`);
    } catch (err) {
      console.log(err);
    }

    user.image = `http://localhost:3001/${newFileName}`;
    const updatedUser = await this.userRepository.save(user);

    return updatedUser;
  }

  async updateMmr(id: number, mmr: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: id,
      },
    });

    user.mmr = mmr;

    const updatedUser = await this.userRepository.save(user);

    return updatedUser;
  }

  async getUserRanking(offset: number, limit: number) {
    return await this.userRepository.find({
      order: {
        mmr: 'DESC',
      },
      skip: limit * offset,
      take: limit,
    });
  }

  async remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
