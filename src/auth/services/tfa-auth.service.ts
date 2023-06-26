import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, Repository } from 'typeorm';
import { uuid } from 'uuidv4';
import { JwtService } from '@nestjs/jwt';
import { TwoFactorTokenDto, TwoFactorCodeDto } from '../dto/twoFactor.dto';
import { EmailService } from './email.service';
import { TfaEntity } from '../entity/tfa.entity';
import { UserEntity } from 'src/user/user.entity';

// TODO any 타입 명확히 하기
@Injectable()
export class TfaAuthService {
  constructor(
    private jwtService: JwtService,
    private emailService: EmailService,
    @InjectRepository(TfaEntity)
    private readonly tfaRepository: Repository<TfaEntity>,
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

  async signInTwoFactorToken(user: UserEntity): Promise<any> {
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
        secret: process.env.JWT_TWO_FACTOR_SECRET,
      });
      const ftId = decoded.sub;
      const accessToken = await this.createAccessToken(ftId);
      const tfa = await this.tfaRepository.findOne({
        where: {
          ftId: ftId,
        },
      });

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
