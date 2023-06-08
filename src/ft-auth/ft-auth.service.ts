import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { AuthDto } from 'src/auth/dto/auth.dto';

@Injectable()
export class FtAuthService {
  async getAccessToken(authDto: AuthDto): Promise<string> {
    try {
      const res = await axios.post('https://api.intra.42.fr/oauth/token', {
        grant_type: 'authorization_code',
        client_id: process.env.FT_CLIENT_ID,
        client_secret: process.env.FT_CLIENT_SECRET,
        code: authDto.code,
        // TODO 아래 uri는 정확히 뭘까?
        redirect_uri: 'http://127.0.0.1:3000/auth',
      });
      return res.data.access_token;
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  // TODO any 타입 명확히 하기
  async getUserInfo(accessToken: string): Promise<any> {
    try {
      const res = await axios.get(
        `https://api.intra.42.fr/v2/me?access_token=${accessToken}`,
      );
      return res.data;
    } catch (err) {}
  }
}
