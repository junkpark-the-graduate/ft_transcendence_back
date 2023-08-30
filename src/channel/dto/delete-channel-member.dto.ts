import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsBoolean } from 'class-validator';
import { EChannelType } from '../entities/channel.entity';
import { CreateChannelMemberDto } from './create-channel-member.dto';

export class DeleteChannelMemberDto extends OmitType(CreateChannelMemberDto, [
  'isAdmin',
  'password',
] as const) {}
