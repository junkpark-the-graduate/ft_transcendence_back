import { Injectable, InternalServerErrorException } from '@nestjs/common';
// import { CreateChatDto } from './dto/create-chat.dto';
// import { UpdateChatDto } from './dto/update-chat.dto';
import { Repository } from 'typeorm';
// import { ChatEntity } from './chat.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ChatService {
  // constructor(
  //   @InjectRepository(ChatEntity)
  //   private readonly chatRepository: Repository<ChatEntity>,
  // ) {}
  //   async create(createChatDto: CreateChatDto) {
  //     const { id, email, name, image } = createChatDto;
  //
  //     try {
  //       const chat = this.chatRepository.create({
  //         id,
  //         email,
  //         name,
  //         image,
  //       });
  //
  //       await this.chatRepository.save(chat);
  //
  //       return chat;
  //     } catch (error) {
  //       throw new InternalServerErrorException(error.message);
  //     }
  //   }
  //
  //   async findAll() {
  //     return `This action returns all chat`;
  //   }
  //
  //   async findOne(id: number) {
  //     const chat = await this.chatRepository.findOne({
  //       where: {
  //         id: id,
  //       },
  //     });
  //     return chat;
  //   }
  //
  //   async update(id: number, updateChatDto: UpdateChatDto) {
  //     const { name, twoFactorEnabled } = updateChatDto;
  //
  //     let chat = await this.chatRepository.findOne({
  //       where: {
  //         id: id,
  //       },
  //     });
  //
  //     chat.name = name;
  //     chat.twoFactorEnabled = twoFactorEnabled;
  //
  //     chat = await this.chatRepository.save(chat);
  //
  //     return chat;
  //   }
  //
  //   async remove(id: number) {
  //     return `This action removes a #${id} chat`;
  //   }
}
