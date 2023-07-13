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
import { DeleteChannelMutedMemberDto } from 'src/channel/dto/delete-channel-muted-member.dto';
import { parse } from 'path';
// import { JwtPayload } from 'src/auth/jwt-payload.interface'; // any 타입 대신 사용할수도

interface Chat {
  username: string;
  message: string;
  socketId: string;
}

interface User {
  socket: Socket;
  id: number;
  name: string;
  image: string;
}

interface MutedMember {
  id: number;
  mutedTime: number;
  createdAt: Date;
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
      mutedMembers: MutedMember[];
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
        };
      }

      let channel;
      if (this.channels[channelId].connectedMembers.length === 0) {
        channel = await this.channelService.findOne(channelId);
        if (!channel)
          throw new UnauthorizedException('존재하지 않는 채널입니다.');

        this.channels[channelId].mutedMembers = [
          ...channel.channelMutedMembers.map((channelMutedMember) => {
            // muted 시간이 지난 멤버 는 추가 안하고, db에서도 삭제
            if (!this.isMutedMember(channelId, channelMutedMember.user.id)) {
              this.removeMutedMember(channelId, channelMutedMember.user.id);
              return;
            }

            return {
              id: channelMutedMember.user.id,
              mutedTime: channelMutedMember.mutedTime,
              createdAt: channelMutedMember.createdAt,
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
        socket: socket,
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

    if (this.isMutedMember(channelId, userId)) {
      socket.emit('muted');
      return;
    }

    socket.to(channelId).emit('new_chat', {
      username: user.name,
      message: chat.message,
      socketId: socket.id,
    });
  }

  public async kickMember(channelId: number, userId: number) {
    const user = this.channels[channelId].connectedMembers.find(
      (user) => user.id === userId,
    );

    if (user) {
      user.socket.emit('kicked');
      user.socket.disconnect();
      this.channels[channelId].connectedMembers = this.channels[
        channelId
      ].connectedMembers.filter((user) => user.id !== userId);
      this.logger.log(`kicked : ${user.socket.id} ${channelId}`);
    }
  }

  public addMutedMember(
    channelId: number,
    userId: number,
    mutedTime: number,
    createdAt: Date,
  ) {
    const channel = this.channels[channelId.toString()];
    let mutedMember = channel.mutedMembers.find(
      (member) => member.id === userId,
    );

    if (!mutedMember) {
      mutedMember = { id: userId, mutedTime, createdAt };
      channel.mutedMembers.push(mutedMember);
    } else {
      mutedMember.createdAt = createdAt;
    }
  }

  private isMutedMember(channelId: string, userId: number): boolean {
    const mutedMember = this.channels[channelId].mutedMembers.find(
      (member) => member.id === userId,
    );

    if (!mutedMember) return false;

    const mutedTime: number = mutedMember.mutedTime;
    const createdAt: Date = mutedMember.createdAt;
    const now: Date = new Date();
    const diff: number = now.getTime() - createdAt.getTime();

    if (diff >= mutedTime) {
      this.removeMutedMember(channelId, userId);
      return false;
    }
    return true;
  }

  private removeMutedMember(channelId: string, userId: number) {
    const deleteChannelMutedMemberDto: DeleteChannelMutedMemberDto = {
      channelId: parseInt(channelId),
      userId,
    };
    this.channelService.deleteChannelMutedMember(
      userId,
      deleteChannelMutedMemberDto,
    );

    this.channels[channelId].mutedMembers = this.channels[
      channelId
    ].mutedMembers.filter((member) => member.id !== userId);
  }
}
