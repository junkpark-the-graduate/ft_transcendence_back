import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateFollowingDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  readonly userId: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  readonly followingId: number;
}
