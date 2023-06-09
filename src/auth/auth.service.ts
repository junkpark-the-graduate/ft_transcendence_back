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

  private createAccessToken = async (id: number): Promise<string> => {
    const payload = { sub: id };
    const accessToken = await this.jwtService.signAsync(payload);
    return accessToken;
  };

  private createTwoFactorToken = async (id: number): Promise<string> => {
    const payload = { sub: id };
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
      const { id, email, login, image } = await this.ftAuthService.getUserInfo(
        ftAccessToken,
      );
      let user = await this.userService.findOne(id);

      if (!user) {
        user = await this.userService.create({
          id: id,
          email: email,
          name: `#${id}`,
          image: image.versions.medium,
        });
      }
      if (user.twoFactorEnabled) {
        return this.tfaAuthService.signInTwoFactorToken(user);
      } else {
        const accessToken = await this.createAccessToken(user.id);
        return { accessToken };
      }
    } catch (err) {
      console.log(err);
    }
  }
}
