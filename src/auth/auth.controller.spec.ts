// import { Test, TestingModule } from '@nestjs/testing';
// import { AuthController } from './auth.controller';
// import { AuthService } from './auth.service';
//
// describe('AuthController', () => {
//   let controller: AuthController;
//
//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [AuthController],
//       providers: [AuthService],
//     }).compile();
//
//     controller = module.get<AuthController>(AuthController);
//   });
//
//   it('should be defined', () => {
//     expect(controller).toBeDefined();
//   });
//
//   it('should return User', () => {});
//
//   it('POST 201', () => {
//     return;
//   });
// });

// import { Test, TestingModule } from '@nestjs/testing';
// import { AuthController } from './auth.controller';
// import { AuthService } from './auth.service';
// import { TfaAuthService } from './services/tfa-auth.service';
// import { AuthDto } from './dto/auth.dto';
// import { TwoFactorTokenDto, TwoFactorCodeDto } from './dto/twoFactor.dto';
//
// describe('AuthController', () => {
//   let authController: AuthController;
//   let authService: AuthService;
//   let tfaAuthService: TfaAuthService;
//
//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [AuthController],
//       providers: [
//         { provide: AuthService, useValue: {} },
//         { provide: TfaAuthService, useValue: {} },
//       ],
//     }).compile();
//
//     authController = module.get<AuthController>(AuthController);
//     authService = module.get<AuthService>(AuthService);
//     tfaAuthService = module.get<TfaAuthService>(TfaAuthService);
//   });
//
//   it('should be defined', () => {
//     expect(authController).toBeDefined();
//   });
//
//   describe('signIn', () => {
//     it('should return the result of authService.signIn', async () => {
//       const dto: AuthDto = {
//         /* your data here */
//       };
//       const result = {}; // Expected result
//       jest.spyOn(authService, 'signIn').mockResolvedValue(result);
//
//       expect(await authController.signIn(dto)).toBe(result);
//     });
//   });
//
//   describe('signInWithTwoFactor', () => {
//     it('should return the result of tfaAuthService.authTwoFactorToken', async () => {
//       const dto: TwoFactorTokenDto = {
//         /* your data here */
//       };
//       const result = {}; // Expected result
//       jest
//         .spyOn(tfaAuthService, 'authTwoFactorToken')
//         .mockResolvedValue(result);
//
//       expect(await authController.signInWithTwoFactor(dto)).toBe(result);
//     });
//   });
//
//   describe('verifyTwoFactorCode', () => {
//     it('should return the result of tfaAuthService.verifyTwoFactorCode', async () => {
//       const dto: TwoFactorCodeDto = {
//         /* your data here */
//       };
//       const result = {}; // Expected result
//       jest
//         .spyOn(tfaAuthService, 'verifyTwoFactorCode')
//         .mockResolvedValue(result);
//
//       expect(await authController.verifyTwoFactorCode(dto)).toBe(result);
//     });
//   });
// });
//
//
//
//
// import { Test, TestingModule } from '@nestjs/testing';
// import { AuthController } from './auth.controller';
// import { AuthService } from './auth.service';
// import { TfaAuthService } from './services/tfa-auth.service';
// import { UserService } from '../user/user.service';
// import { FtAuthService } from './services/ft-auth.service';
// import { JwtService } from '@nestjs/jwt';
// import { AuthDto } from './dto';
//
// describe('AuthController', () => {
//   let authController: AuthController;
//   let authService: AuthService;
//
//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [AuthController],
//       providers: [
//         AuthService,
//         { provide: UserService, useValue: {} },
//         { provide: TfaAuthService, useValue: {} },
//         { provide: FtAuthService, useValue: {} },
//         { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('TOKEN') } },
//       ],
//     }).compile();
//
//     authController = module.get<AuthController>(AuthController);
//     authService = module.get<AuthService>(AuthService);
//   });
//
//   it('should be defined', () => {
//     expect(authController).toBeDefined();
//   });
//
//   describe('signIn', () => {
//     it('should return the result of authService.signIn', async () => {
//       const dto: AuthDto = { /* your data here */ };
//       const result = { accessToken: 'TOKEN' };
//       jest.spyOn(authService, 'signIn').mockResolvedValue(result);
//
//       expect(await authController.signIn(dto)).toBe(result);
//     });
//   });
//
//   // Add other test cases for signInWithTwoFactor and verifyTwoFactorCode here
// });
//
//
// // ft-auth
// import { Test, TestingModule } from '@nestjs/testing';
// import { AuthController } from './auth.controller';
// import { AuthService } from './auth.service';
// import { TfaAuthService } from './services/tfa-auth.service';
// import { UserService } from '../user/user.service';
// import { FtAuthService } from './services/ft-auth.service';
// import { JwtService } from '@nestjs/jwt';
// import { AuthDto } from './dto';
// import { InternalServerErrorException } from '@nestjs/common';
//
// jest.mock('axios');
// import axios from 'axios';
//
// describe('AuthController', () => {
//   let authController: AuthController;
//   let authService: AuthService;
//
//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [AuthController],
//       providers: [
//         AuthService,
//         { provide: UserService, useValue: {} },
//         { provide: TfaAuthService, useValue: {} },
//         FtAuthService,
//         { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('TOKEN') } },
//       ],
//     }).compile();
//
//     authController = module.get<AuthController>(AuthController);
//     authService = module.get<AuthService>(AuthService);
//   });
//
//   it('should be defined', () => {
//     expect(authController).toBeDefined();
//   });
//
//   describe('signIn', () => {
//     it('should return the result of authService.signIn', async () => {
//       const dto: AuthDto = { /* your data here */ };
//       const result = { accessToken: 'TOKEN' };
//
//       jest.spyOn(authService, 'signIn').mockResolvedValue(result);
//       expect(await authController.signIn(dto)).toBe(result);
//     });
//
//     it('should throw error when getAccessToken fails', async () => {
//       const dto: AuthDto = { /* your data here */ };
//
//       jest.spyOn(authService, 'signIn').mockImplementation(() => {
//         throw new InternalServerErrorException();
//       });
//       try {
//         await authController.signIn(dto);
//       } catch (error) {
//         expect(error).toBeInstanceOf(InternalServerErrorException);
//       }
//     });
//   });
//
//   // Add other test cases for signInWithTwoFactor and verifyTwoFactorCode here
// });

// tfa-auth
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TfaAuthService } from './services/tfa-auth.service';
import { UserService } from '../user/user.service';
import { FtAuthService } from './services/ft-auth.service';
import { JwtService } from '@nestjs/jwt';
// import { AuthDto, TwoFactorTokenDto, TwoFactorCodeDto } from './dto';
import { AuthDto } from './dto/auth.dto';
import { TwoFactorTokenDto, TwoFactorCodeDto } from './dto/twoFactor.dto';
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

  describe('signIn', () => {
    it('should return the result of authService.signIn', async () => {
      const dto: AuthDto = {
        code: '42OauthCode',
      };
      const result = {
        accessToken: 'jwt token!!!!!!!!!',
      }; // Expected result
      jest.spyOn(authService, 'signIn').mockResolvedValue(result);

      expect(await authController.signIn(dto)).toBe(result);
    });
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
