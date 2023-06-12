import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import axios from 'axios';
import { FtAuthService } from 'src/ft-auth/ft-auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private ftAuthService: FtAuthService,
    private jwtService: JwtService,
  ) {}

  // TODO any 타입 명확히 하기
  async signIn(authDto: AuthDto): Promise<any> {
    try {
      const accessToken = await this.ftAuthService.getAccessToken(authDto);
      const { id, email, login, image } = await this.ftAuthService.getUserInfo(
        accessToken,
      );
      let user = await this.userService.findOne(id);

      if (!user) {
        user = await this.userService.create({
          ftId: id,
          email: email,
          name: login,
        });
      }
      const jwtToken = await this.createJwtToken(user.ftId);
      return { jwtToken };
    } catch (err) {}
  }

  private createJwtToken = async (ftId: number): Promise<string> => {
    const payload = { sub: ftId };
    const jwtToken = await this.jwtService.signAsync(payload);
    return jwtToken;
  };
}
