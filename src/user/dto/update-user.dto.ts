import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class UpdateUserDto extends OmitType(CreateUserDto, [
  'ftId',
  'image',
  'email',
] as const) {
  @IsNotEmpty()
  @ApiProperty()
  readonly twoFactor: boolean;

  @IsNotEmpty()
  readonly mmr: number;
}
