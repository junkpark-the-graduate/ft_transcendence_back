import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { TwoFactorDto } from './dto/twoFactor.dto';
import axios from 'axios';
import { FtAuthService } from 'src/ft-auth/ft-auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { EmailService } from 'src/email/email.service';
import { constrainedMemory } from 'process';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private ftAuthService: FtAuthService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private createAccessToken = async (ftId: number): Promise<string> => {
    const payload = { sub: ftId };
    const accessToken = await this.jwtService.signAsync(payload);
    return accessToken;
  };

  private createTwoFactorToken = async (ftId: number): Promise<string> => {
    const payload = { sub: ftId };
    const options = { secret: 'twoFactor Secret!', expiresIn: 60 * 5 };
    const twoFactorToken = await this.jwtService.signAsync(payload, options);
    return twoFactorToken;
  };

  // TODO any 타입 명확히 하기
  async signIn(authDto: AuthDto): Promise<any> {
    try {
      const ftAccessToken = await this.ftAuthService.getAccessToken(authDto);
      const { ftId, email, login, image } =
        await this.ftAuthService.getUserInfo(ftAccessToken);
      let user = await this.userService.findOne(ftId);

      if (!user) {
        // TODO: signup
        user = await this.userService.create({
          ftId: ftId,
          email: email,
          name: login,
          image: image.versions.medium,
        });
      }
      if (user.twoFactor) {
        const twoFactorToken = await this.createTwoFactorToken(user.ftId);
        await this.emailService.sendMemberJoinVerification(
          user.email,
          twoFactorToken,
        );
        return 'twoFactor';
      } else {
        const accessToken = await this.createAccessToken(user.ftId);
        return { accessToken };
      }
    } catch (err) {}
  }

  async twoFactorAuth(twoFactorDto: TwoFactorDto): Promise<any> {
    const { twoFactorToken } = twoFactorDto;

    try {
      const decoded = await this.jwtService.verifyAsync(twoFactorToken, {
        secret: 'twoFactor Secret!',
      });
      const ftId = decoded.sub;
      const accessToken = await this.createAccessToken(ftId);
      return { accessToken };
    } catch (err) {
      throw new UnauthorizedException('Invalid twoFactorToken');
    }
  }
}
