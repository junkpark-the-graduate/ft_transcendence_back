import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class TwoFactorDto {
  @IsNotEmpty()
  @ApiProperty({ description: 'TwoFactorToken' })
  readonly twoFactorToken: string;
}
