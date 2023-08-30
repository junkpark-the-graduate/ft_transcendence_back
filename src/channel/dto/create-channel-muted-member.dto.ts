import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateChannelMutedMemberDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  readonly channelId: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  readonly userId: number;
}
