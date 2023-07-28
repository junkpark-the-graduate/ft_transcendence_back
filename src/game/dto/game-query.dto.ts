import { ApiProperty } from '@nestjs/swagger';
import { GameType } from '../game.constants';
import { FindOptionsOrderValue } from 'typeorm';

export class GameQueryDto {
  @ApiProperty({
    description: '기본적으로 시간 순서로 정렬합니다.',
    required: false,
  })
  sort: FindOptionsOrderValue = 'DESC';

  @ApiProperty({
    description: '게임 타입을 넣습니다. 기본적으로 모든 게임을 조회합니다.',
    required: false,
  })
  gameType: GameType;

  @ApiProperty({
    description:
      '한 페이지에 보여줄 게임 수를 넣습니다. 기본적으로 10개를 보여줍니다.',
  })
  limit: number = 10;

  @ApiProperty({
    description: '보고 싶은 페이지를 넣습니다. 0페이지 부터 시작합니다.',
    required: false,
  })
  offset: number = 0;
}
