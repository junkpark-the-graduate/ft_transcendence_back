import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class BlockDto {
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
  readonly blocking: number;
}
