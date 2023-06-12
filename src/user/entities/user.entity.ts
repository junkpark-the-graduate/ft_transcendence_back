import { ApiProperty, IntersectionType } from '@nestjs/swagger';

export class User {
  @ApiProperty()
  id: number;

  ftId: number;
  email: string;
  name: string;
}
export class UserRel {}
export class UserFull extends IntersectionType(User, UserRel) {}
