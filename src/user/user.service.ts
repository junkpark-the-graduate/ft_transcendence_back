import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { ftId, email, name } = createUserDto;

    try {
      const user = await this.prismaService.user.create({
        data: {
          ftId,
          email,
          name,
        },
      });
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async findAll() {
    return `This action returns all user`;
  }

  async findOne(id: number) {
    const user = await this.prismaService.user.findFirst({
      where: {
        ftId: id,
      },
    });
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
