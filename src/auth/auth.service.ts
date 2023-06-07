import { Injectable } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import axios from 'axios';

@Injectable()
export class AuthService {
  async postAuthTo42(authDto: AuthDto) {
    console.log('authDto.code: ', authDto.code);
    console.log(process.env.FT_CLIENT_ID);
    try {
      const res = await axios.post('https://api.intra.42.fr/oauth/token', {
        grant_type: 'authorization_code',
        client_id: process.env.FT_CLIENT_ID,
        client_secret: process.env.FT_CLIENT_SECRET,
        code: authDto.code,
        redirect_uri: 'http://127.0.0.1:3000/auth',
      });
      console.log('res: ', res);
    } catch (err) {
      console.log('err: ', err);
    }
  }
}
