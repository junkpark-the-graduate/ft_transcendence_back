import { IsNotEmpty } from 'class-validator';

export class AuthDto {
  @IsNotEmpty()
  readonly code: string;
}
