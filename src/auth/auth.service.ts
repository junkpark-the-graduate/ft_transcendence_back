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
import { InjectRepository } from '@nestjs/typeorm';
import { Auth } from './auth.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private ftAuthService: FtAuthService,
    private jwtService: JwtService,
    private emailService: EmailService,
    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
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
        user = await this.userService.create({
          ftId: ftId,
          email: email,
          name: `#${ftId}`,
          image: image.versions.medium,
        });
      }

      if (user.twoFactor) {
        const twoFactorToken = await this.createTwoFactorToken(user.ftId);

        const auth = this.authRepository.create({
          ftId: user.ftId,
        });
        await this.authRepository.save(auth);

        await this.emailService.sendMemberJoinVerification(
          user.email,
          twoFactorToken,
        );
        return { redirect: true };
      } else {
        const accessToken = await this.createAccessToken(user.ftId);
        return { accessToken };
      }
    } catch (err) {
      console.log(err);
    }
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
