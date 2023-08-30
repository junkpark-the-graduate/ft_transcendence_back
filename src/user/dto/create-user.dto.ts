import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    type: Number,
  })
  readonly id: number;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  readonly name: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  readonly email: string;

  // @IsNotEmpty()
  @ApiProperty()
  readonly image: string;
}
