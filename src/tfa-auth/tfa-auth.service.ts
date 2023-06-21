import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthDto } from '../auth/dto/auth.dto';
import { TwoFactorTokenDto, TwoFactorCodeDto } from '../auth/dto/twoFactor.dto';
import { FtAuthService } from 'src/ft-auth/ft-auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { EmailService } from 'src/email/email.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Tfa } from '../tfa-auth/tfa.entity';
import { InsertResult, Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { uuid } from 'uuidv4';

// TODO any 타입 명확히 하기
@Injectable()
export class TfaAuthService {
  constructor(
    // private userService: UserService,
    // private ftAuthService: FtAuthService,
    private jwtService: JwtService,
    private emailService: EmailService,
    @InjectRepository(Tfa)
    private readonly tfaRepository: Repository<Tfa>,
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

  async signInTwoFactorToken(user: User): Promise<any> {
    const twoFactorToken = await this.createTwoFactorToken(user.ftId);
    InsertResult;
    const tfa = await this.tfaRepository.upsert(
      [
        {
          ftId: user.ftId,
          twoFactorCode: uuid(),
          updatedAt: new Date(),
        },
      ],
      ['ftId'],
    );
    await this.emailService.sendMemberJoinVerification(
      user.email,
      tfa.generatedMaps[0].twoFactorCode,
    );
    return { twoFactorToken };
  }

  async verifyTwoFactorCode(twoFactorCodeDto: TwoFactorCodeDto): Promise<any> {
    const { twoFactorCode } = twoFactorCodeDto;

    const tfa = await this.tfaRepository.findOne({
      where: { twoFactorCode: twoFactorCode },
    });
    console.log(tfa);

    if (!tfa) {
      console.log('here????????');
      throw new UnauthorizedException('invalid twoFactorCode');
    }

    const now = new Date();
    const updatedAt = tfa.updatedAt;
    const diff = Math.floor(now.getTime() - updatedAt.getTime());

    if (diff > 1000 * 60 * 5) {
      throw new UnauthorizedException('twoFactorCode has expired');
    }

    tfa.isValidated = true;
    await this.tfaRepository.save(tfa);
    return { message: 'twoFactorCode is validated' };
  }

  async authTwoFactorToken(twoFactorTokenDto: TwoFactorTokenDto): Promise<any> {
    const { twoFactorToken } = twoFactorTokenDto;
    console.log('check twoFactorToken', twoFactorToken);
    try {
      const decoded = await this.jwtService.verifyAsync(twoFactorToken, {
        secret: 'twoFactor Secret!',
      });

      const ftId = decoded.sub;
      const accessToken = await this.createAccessToken(ftId);

      const tfa = await this.tfaRepository.findOne({
        where: {
          ftId: ftId,
        },
      });
      console.log('HERE', tfa);

      if (!tfa.isValidated) {
        throw new UnauthorizedException('twoFactor is not validate');
      }

      await this.tfaRepository.delete({ ftId: ftId });

      return { accessToken };
    } catch (err) {
      throw new UnauthorizedException('Invalid twoFactorToken');
    }
  }
}
