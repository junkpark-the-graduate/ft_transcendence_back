import { Logger, UseGuards } from '@nestjs/common';
import { Socket } from 'socket.io';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { WsJwtGuard } from 'src/auth/ws-jwt-guard.guard';
import { JwtService } from '@nestjs/jwt';
import { ChannelService } from 'src/channel/services/channel.service';
import { ChatService } from './chat.service';
import { DeleteChannelMutedMemberDto } from 'src/channel/dto/delete-channel-muted-member.dto';
import { ChatEntity } from './chat.entity';

interface IUser {
  id: number;
  image: string;
  name: string;
}

interface IChat {
  message: string;
  user: IUser;
}

interface ChatHistoryRequest {
  page: number;
}

interface inviteGame {
  memberId: number;
  roomId: string;
  user: IUser;
}

@WebSocketGateway(parseInt(process.env.CHAT_SOCKET_PORT), {
  namespace: 'chat',
  cors: {
    origin: [
      process.env.FRONT_END_POINT,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger('chat');

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService, // private channels: ChatService['channels'],
  ) {
    this.logger.log('constructor');
  }

  afterInit() {
    this.logger.log('init');
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    const token = socket.handshake.query.token as string;
    const channelId = socket.handshake.query.channelId as string; // get channelId from client during handshake
    const payload = await this.jwtService.verifyAsync(token);

    this.logger.log(
      `disconnected!!!!!!!!!!!!!!! : ${socket.id} ${socket.nsp.name}`,
    );
    this.chatService.removeConnectedMember(channelId, payload.sub);

    socket.to(channelId).emit('member_disconnected', { userId: payload.sub });
  }

  async handleConnection(@ConnectedSocket() socket: Socket) {
    try {
      const token = socket.handshake.query.token as string;
      const channelId = socket.handshake.query.channelId as string; // get channelId from client during handshake
      const payload: any = await this.jwtService.verifyAsync(token);

      await this.chatService.initChannels(channelId);

      const tmp = await this.chatService.addConnectedMember(
        channelId,
        payload.sub,
        socket,
      );

      const member = {
        id: tmp.user.id,
        name: tmp.user.name,
        image: tmp.user.image,
      };

      await socket.join(channelId); // join the room based on channelId

      this.logger.log(`connected : ${socket.id} ${socket.nsp.name} ${token}`);

      // channel 에 접속된 클라이언트 에게 접속된 유저 정보 전달
      socket.to(channelId).emit('member_connected', { member });
    } catch (err) {
      socket.emit('error');
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('submit_chat')
  async handleSubmitChat(
    @MessageBody() chat: IChat,
    @ConnectedSocket() socket: Socket,
  ) {
    const channelId = socket.handshake.query.channelId as string;
    const { userId } = socket.data;

    const member = await this.chatService.getMemberInChannel(channelId, userId);

    if (this.chatService.isMutedMember(channelId, userId)) {
      socket.emit('muted');
      return;
    } else {
      this.chatService.removeMutedMember(channelId, userId);
      this.chatService.saveMessage(userId, channelId, chat.message);
    }
    console.log(chat.message);

    socket.to(channelId).emit('new_chat', {
      message: chat.message,
      user: {
        id: member.id,
        name: member.name,
        image: member.image,
      },
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('get_chat_history')
  async handleLoadChat(
    @MessageBody() chatHistoryRequest: ChatHistoryRequest,
    @ConnectedSocket() socket: Socket,
  ) {
    const channelId = socket.handshake.query.channelId as string;
    const { userId } = socket.data;
    const { page } = chatHistoryRequest;

    const chatHistory: ChatEntity[] = await this.chatService.getChatHistory(
      parseInt(channelId),
      page,
    );

    console.log(chatHistory);
    return chatHistory;
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('invite_game')
  async handleInviteChat(
    @MessageBody() inviteGame: inviteGame,
    @ConnectedSocket() socket: Socket,
  ) {
    const channelId = socket.handshake.query.channelId as string;
    const { userId } = socket.data;
    const { memberId, roomId, user } = inviteGame;

    const member = await this.chatService.findConnectedMember(
      channelId,
      memberId,
    );

    member.socket.emit('open_invite_game_modal', { roomId, user });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('get_connected_members')
  async getConnectedMembers(@ConnectedSocket() socket: Socket) {
    const channelId = socket.handshake.query.channelId as string;
    const connectedMembers = this.chatService.getConnectedMembers(channelId);
    return connectedMembers;
  }

  public async kickMember(channelId: number, userId: number) {
    const member = this.chatService.getMemberInChannel(
      channelId.toString(),
      userId,
    );
    if (member) {
      member.socket.emit('kicked');
      member.socket.disconnect();
      this.chatService.removeConnectedMember(channelId.toString(), userId);
    }
  }
}
