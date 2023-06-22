import { Test, TestingModule } from '@nestjs/testing';
import { FtAuthService } from './ft-auth.service';

describe('FtAuthService', () => {
  let service: FtAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FtAuthService],
    }).compile();

    service = module.get<FtAuthService>(FtAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
