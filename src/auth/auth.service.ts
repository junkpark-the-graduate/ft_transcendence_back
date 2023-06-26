import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { AuthDto } from './dto/auth.dto';
import { TfaAuthService } from './services/tfa-auth.service';
import { FtAuthService } from './services/ft-auth.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private ftAuthService: FtAuthService,
    private jwtService: JwtService,
    private tfaAuthService: TfaAuthService,
  ) {}

  private createAccessToken = async (ftId: number): Promise<string> => {
    const payload = { sub: ftId };
    const accessToken = await this.jwtService.signAsync(payload);
    return accessToken;
  };

  private createTwoFactorToken = async (ftId: number): Promise<string> => {
    const payload = { sub: ftId };
    const options = {
      secret: process.env.JWT_TWO_FACTOR_SECRET,
      expiresIn: '5m',
    };
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
        user = await this.userService.create({
          ftId: ftId,
          email: email,
          name: `#${ftId}`,
          image: image.versions.medium,
        });
      }
      if (user.twoFactor) {
        return this.tfaAuthService.signInTwoFactorToken(user);
      } else {
        const accessToken = await this.createAccessToken(user.ftId);
        return { accessToken };
      }
    } catch (err) {
      console.log(err);
    }
  }
}
