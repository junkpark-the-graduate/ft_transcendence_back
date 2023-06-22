import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, Repository } from 'typeorm';
import { uuid } from 'uuidv4';
import { JwtService } from '@nestjs/jwt';
import { TwoFactorTokenDto, TwoFactorCodeDto } from '../dto/twoFactor.dto';
import { EmailService } from './email.service';
import { Tfa } from '../entity/tfa.entity';
import { User } from 'src/user/user.entity';

// TODO any 타입 명확히 하기
@Injectable()
export class TfaAuthService {
  constructor(
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

// tfa-auth
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TfaAuthService } from './services/tfa-auth.service';
import { UserService } from '../user/user.service';
import { FtAuthService } from './services/ft-auth.service';
import { JwtService } from '@nestjs/jwt';
import { AuthDto, TwoFactorTokenDto, TwoFactorCodeDto } from './dto';
import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tfa } from './entity/tfa.entity';
import { User } from '../user/user.entity';
import { EmailService } from './services/email.service';

jest.mock('axios');
import axios from 'axios';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let tfaAuthService: TfaAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        TfaAuthService,
        { provide: UserService, useValue: {} },
        FtAuthService,
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('TOKEN') },
        },
        {
          provide: EmailService,
          useValue: { sendMemberJoinVerification: jest.fn() },
        },
        {
          provide: getRepositoryToken(Tfa),
          useValue: {
            upsert: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    tfaAuthService = module.get<TfaAuthService>(TfaAuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  // Test signIn with two factor authentication
  describe('signInWithTwoFactor', () => {
    it('should return twoFactorToken', async () => {
      const dto: TwoFactorTokenDto = {
        /* your data here */
      };
      const result = { twoFactorToken: 'TOKEN' };

      jest
        .spyOn(tfaAuthService, 'authTwoFactorToken')
        .mockResolvedValue(result);
      expect(await authController.signInWithTwoFactor(dto)).toBe(result);
    });

    it('should throw error when authTwoFactorToken fails', async () => {
      const dto: TwoFactorTokenDto = {
        /* your data here */
      };

      jest
        .spyOn(tfaAuthService, 'authTwoFactorToken')
        .mockImplementation(() => {
          throw new UnauthorizedException('Invalid twoFactorToken');
        });
      try {
        await authController.signInWithTwoFactor(dto);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
      }
    });
  });

  // Test verify two factor code
  describe('verifyTwoFactorCode', () => {
    it('should return a message indicating validation of the twoFactorCode', async () => {
      const dto: TwoFactorCodeDto = {
        /* your data here */
      };
      const result = { message: 'twoFactorCode is validated' };

      jest
        .spyOn(tfaAuthService, 'verifyTwoFactorCode')
        .mockResolvedValue(result);
      expect(await authController.verifyTwoFactorCode(dto)).toBe(result);
    });

    it('should throw error when twoFactorCode is invalid or expired', async () => {
      const dto: TwoFactorCodeDto = {
        /* your data here */
      };

      jest
        .spyOn(tfaAuthService, 'verifyTwoFactorCode')
        .mockImplementation(() => {
          throw new UnauthorizedException('twoFactorCode has expired');
        });
      try {
        await authController.verifyTwoFactorCode(dto);
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
      }
    });
  });

  // Add other test cases here
});
