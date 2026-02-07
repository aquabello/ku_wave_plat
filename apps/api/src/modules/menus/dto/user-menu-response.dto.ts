import { ApiProperty } from '@nestjs/swagger';
import { GNBMenuItemDto } from './menu-tree-response.dto';

export class UserMenuResponseDto {
  @ApiProperty({ description: '사용자 시퀀스', example: 1 })
  userSeq: number;

  @ApiProperty({ description: '할당된 메뉴 시퀀스 목록', example: [1, 11, 12, 6, 61, 62] })
  menuSeqs: number[];

  @ApiProperty({ type: [GNBMenuItemDto], description: '할당된 메뉴 트리 (GNB → LNB)' })
  menuTree: GNBMenuItemDto[];
}
