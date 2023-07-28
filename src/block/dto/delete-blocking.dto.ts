import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { CreateBlockingDto } from './create-blocking.dto';

export class DeleteBlockingDto extends CreateBlockingDto {}
