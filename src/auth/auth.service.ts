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
      const ftAccessToken = await this.ftAuthService.getAccessToken(authDto);
      const { ftId, email, login, image } =
        await this.ftAuthService.getUserInfo(ftAccessToken);
      let user = await this.userService.findOne(ftId);

      if (!user) {
        user = await this.userService.create({
          ftId: ftId,
          email: email,
          name: login,
          image: image.versions.medium,
        });
      }
      const accessToken = await this.createAccessToken(user.ftId);
      return { accessToken };
    } catch (err) {}
  }

  private createAccessToken = async (ftId: number): Promise<string> => {
    const payload = { sub: ftId };
    const accessToken = await this.jwtService.signAsync(payload);
    return accessToken;
  };
}
