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
import { UserService } from 'src/user/user.service';
import { ChannelService } from 'src/channel/channel.service';
import { In } from 'typeorm';
// import { JwtPayload } from 'src/auth/jwt-payload.interface'; // any 타입 대신 사용할수도

interface Chat {
  username: string;
  message: string;
  socketId: string;
}

interface User {
  id: number;
  name: string;
  image: string;
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

  private channels: {
    [channelId: string]: {
      connectedMembers: User[];
      mutedMembers: { id: number }[];
      bannedMembers: { id: number }[];
    };
  } = {};

  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private channelService: ChannelService,
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

      this.channels[channelId].connectedMembers = this.channels[
        channelId
      ].connectedMembers.filter((user) => user.id !== payload.sub);
      console.log(
        'this.connectedUser',
        this.channels[channelId].connectedMembers,
      );
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

      if (!this.channels[channelId]) {
        this.channels[channelId] = {
          connectedMembers: [],
          mutedMembers: [],
          bannedMembers: [],
        };
      }

      let channel;
      if (this.channels[channelId].connectedMembers.length === 0) {
        channel = await this.channelService.findOne(channelId);
        if (!channel)
          throw new UnauthorizedException('존재하지 않는 채널입니다.');

        this.channels[channelId].mutedMembers = [
          ...channel.channelMutedMembers.map((channelMutedMember) => {
            return {
              id: channelMutedMember.user.id,
            };
          }),
        ];
      }

      const channelMember = await this.channelService.findOneChannelMember(
        channelId,
        payload.sub,
      );
      if (!channelMember) throw new NotFoundException('채널 멤버가 아닙니다');

      this.channels[channelId].connectedMembers.push({
        id: channelMember.user.id,
        name: channelMember.user.name,
        image: channelMember.user.image,
      });

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
    const user = this.channels[channelId].connectedMembers.find(
      (user) => user.id === userId,
    );
    socket.broadcast.emit('new_chat', {
      username: user.name,
      message: chat.message,
      socketId: socket.id,
    });
  }
}
