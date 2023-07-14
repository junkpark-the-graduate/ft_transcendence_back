import {
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
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
import { ChannelService } from 'src/channel/channel.service';
import { ChatService } from './chat.service';
import { DeleteChannelMutedMemberDto } from 'src/channel/dto/delete-channel-muted-member.dto';
// import { JwtPayload } from 'src/auth/jwt-payload.interface'; // any 타입 대신 사용할수도

interface Chat {
  userId: number;
  username: string;
  message: string;
  socketId: string;
}

@WebSocketGateway(4242, {
  namespace: 'chattings',
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger('chat');

  constructor(
    private jwtService: JwtService,
    // private userService: UserService,
    private channelService: ChannelService,
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

    if (!token) {
      throw new UnauthorizedException('Token not found.');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token);

      this.chatService.removeConnectedMember(channelId, payload.sub);
      this.logger.log(`disconnected : ${socket.id} ${socket.nsp.name}`);
    } catch (err) {
      throw new UnauthorizedException('Invalid token.');
    }
  }

  async handleConnection(@ConnectedSocket() socket: Socket) {
    const token = socket.handshake.query.token as string;
    const channelId = socket.handshake.query.channelId as string; // get channelId from client during handshake

    if (!token) {
      throw new UnauthorizedException('Token not found.');
    }
    try {
      // Todo: verifyAsync의 반환값 타입을 any가 아닌 JwtPayload로 바꾸기
      const payload: any = await this.jwtService.verifyAsync(token);

      this.chatService.initChannels(channelId);

      this.chatService.addConnectedMember(channelId, payload.sub, socket);

      socket.join(channelId); // join the room based on channelId

      this.logger.log(`connected : ${socket.id} ${socket.nsp.name} ${token}`);
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException(err.message);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('submit_chat')
  handleSubmitChat(
    @MessageBody() chat: Chat,
    @ConnectedSocket() socket: Socket,
  ) {
    const channelId = socket.handshake.query.channelId as string;
    const { userId } = socket.data;

    const member = this.chatService.getMemberInChannel(channelId, userId);

    if (this.chatService.isMutedMember(channelId, userId)) {
      socket.emit('muted');
      return;
    }

    socket.to(channelId).emit('new_chat', {
      userId: member.id,
      username: member.name,
      message: chat.message,
      socketId: socket.id,
    });
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
