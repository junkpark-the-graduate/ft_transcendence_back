import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class DummyService {
  constructor(private jwtService: JwtService) {}

  getDummyAccessToken = async (id: number): Promise<string> => {
    const payload = { sub: id };
    const accessToken = await this.jwtService.signAsync(payload);
    return accessToken;
  };
}
