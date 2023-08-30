import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class FollowDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    type: Number,
  })
  readonly userId: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    type: Number,
  })
  readonly following: number;
}
