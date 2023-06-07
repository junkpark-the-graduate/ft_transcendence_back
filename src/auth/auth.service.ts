import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import axios from 'axios';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async postAuthTo42(authDto: AuthDto) {
    const getAccessToken = async () => {
      try {
        const res = await axios.post('https://api.intra.42.fr/oauth/token', {
          grant_type: 'authorization_code',
          client_id: process.env.FT_CLIENT_ID,
          client_secret: process.env.FT_CLIENT_SECRET,
          code: authDto.code,
          redirect_uri: 'http://127.0.0.1:3000/auth',
        });
        return res.data.access_token;
      } catch (err) {
        console.log('* err: getAccessToken: ', err.response.data);
        throw new InternalServerErrorException();
      }
    };

    const getUserInfo = async () => {
      try {
        const res = await axios.get(
          `https://api.intra.42.fr/v2/me?access_token=${accessToken}`,
        );
        return res.data;
      } catch (err) {
        console.log('* err: getUserInfo: ', err.response.data);
      }
    };

    const accessToken = await getAccessToken();
    // console.log(accessToken);

    const userInfo = await getUserInfo();
    const { id, email, login, displayname, image } = userInfo;
    // console.log(id, email, login, displayname, image);
    console.log(`successfully get user info of ${login}`);

    try {
      const existingUser = await this.prismaService.user.findFirst({
        where: {
          ftId: id,
        },
      });

      if (!existingUser) {
        const newUser = await this.prismaService.user.create({
          data: {
            ftId: id,
            email,
            name: displayname,
          },
        });
        console.log('New user added:', newUser);
      } else {
        console.log('User already exists.');
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
    return `hello ${displayname}!`;
  }
}
