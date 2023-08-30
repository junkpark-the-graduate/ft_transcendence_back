import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const socket: Socket = context.switchToWs().getClient();
    const token = socket.handshake.query.token as string;
    try {
      const payload = await this.jwtService.verifyAsync(token);
      socket.data = { userId: payload.sub }; // Save user data in socket object for future use

      return true;
    } catch (err) {
      socket.emit('error');
    }
  }
}
