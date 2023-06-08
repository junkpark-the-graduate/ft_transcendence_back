import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import axios from 'axios';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signIn(authDto: AuthDto): Promise<any> {
    try {
      const accessToken = await this.getAccessToken(authDto);
      const { id, email, login, image } = await this.getUserInfo(accessToken);
      let user = await this.userService.findOne(id);

      if (!user) {
        user = await this.userService.create({
          ftId: id,
          email: email,
          name: login,
        });
      }
      const jwtToken = await this.createJwtToken(user.ftId);
      console.log(jwtToken);
      return { jwtToken };
    } catch (err) {
      console.log('* err: signIn: ', err.response.data);
    }
  }

  private createJwtToken = async (ftId: number): Promise<string> => {
    const payload = { sub: ftId };
    const jwtToken = await this.jwtService.signAsync(payload);
    return jwtToken;
  };

  private getAccessToken = async (authDto: AuthDto) => {
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

  private getUserInfo = async (accessToken) => {
    try {
      const res = await axios.get(
        `https://api.intra.42.fr/v2/me?access_token=${accessToken}`,
      );
      return res.data;
    } catch (err) {
      console.log('* err: getUserInfo: ', err.response.data);
    }
  };
}
