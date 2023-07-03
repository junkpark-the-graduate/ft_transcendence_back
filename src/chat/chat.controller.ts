import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ValidationPipe,
  Response,
  Request,
} from '@nestjs/common';
// import { ChatService } from './chat.service';
// import { CreateChatDto } from './dto/create-chat.dto';
// import { UpdateChatDto } from './dto/update-chat.dto';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
// import { ChatEntity } from './chat.entity';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
@Controller('chat')
@ApiTags('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  //   @UseGuards(AuthGuard('jwt'))
  //   @Post()
  //   @ApiOperation({ summary: '채팅방 생성 API', description: '채팅방을 생성' })
  //   @ApiCreatedResponse({ description: '채팅방을 생성', type: ChatEntity })
  //   @ApiResponse({ status: 200, description: 'OK' })
  //   create(@Body() createChatDto: CreateChatDto) {
  //     return this.chatService.create(createChatDto);
  //   }
  //
  //   @UseGuards(AuthGuard('jwt'))
  //   @Get()
  //   @ApiOperation({
  //     summary: '특정 유저 조회 API',
  //     description: 'accessToken으로 유저 조회',
  //   })
  //   @ApiResponse({ status: 200, description: 'OK', type: ChatEntity })
  //   @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  //   findOne(@Request() req) {
  //     return this.chatService.findOne(req.chat.id);
  //   }
  //
  //   @UseGuards(AuthGuard('jwt'))
  //   @Patch()
  //   @ApiOperation({
  //     summary: '특정 유저 업데이트 API',
  //     description: '특정 유저의 정보 업데이트',
  //   })
  //   @ApiResponse({ status: 200, description: 'OK', type: ChatEntity })
  //   update(@Request() req, @Body() updateChatDto: UpdateChatDto) {
  //     return this.chatService.update(req.chat.id, updateChatDto);
  //   }
}
