import { ApiProperty } from '@nestjs/swagger';
import { GameType } from '../game.constants';

export class GameQueryDto {
  @ApiProperty({
    description: '시간 순서로 정렬',
    required: false,
  })
  sort?: 'asc' | 'desc';

  @ApiProperty({
    description: '보고 싶은 페이지를 넣습니다.',
    required: false,
  })
  offset?: number;

  @ApiProperty({
    description: '게임 타입을 넣습니다. 기본적으로 모든 게임을 조회합니다.',
    required: false,
  })
  type?: GameType;
}
