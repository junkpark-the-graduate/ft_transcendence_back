import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateBlockingDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  readonly userId: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  readonly blockingId: number;
}
