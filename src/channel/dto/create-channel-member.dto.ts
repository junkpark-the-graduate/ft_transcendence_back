import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsBoolean } from 'class-validator';
import { EChannelType } from '../entities/channel.entity';

export class CreateChannelMemberDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  readonly channelId: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  readonly userId: number;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  readonly isAdmin: boolean;

  @IsString()
  @ApiProperty()
  readonly password: string;
}
