import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export class TwoFactorTokenDto {
  @IsNotEmpty()
  @ApiProperty({ description: 'TwoFactorToken' })
  readonly twoFactorToken: string;
}

export class TwoFactorCodeDto {
  @IsNotEmpty()
  @IsUUID('4')
  @ApiProperty({ description: 'TwoFactorCode' })
  readonly twoFactorCode: string;
}
