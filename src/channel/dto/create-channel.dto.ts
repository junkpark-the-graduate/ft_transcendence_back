import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { EChannelType } from '../entities/channel.entity';

export class CreateChannelDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  readonly ownerId: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly name: string;

  // 해시로 암호화 해야함
  @ApiProperty()
  readonly password: string;

  @IsNotEmpty()
  @ApiProperty()
  readonly type: EChannelType;
}
