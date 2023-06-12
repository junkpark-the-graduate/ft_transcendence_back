import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthDto {
  @IsNotEmpty()
  @ApiProperty({ description: 'OAuth 인증 코드' })
  readonly code: string;
}
