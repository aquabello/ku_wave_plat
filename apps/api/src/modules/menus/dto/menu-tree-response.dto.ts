import { ApiProperty } from '@nestjs/swagger';

export class LNBMenuItemDto {
  @ApiProperty({ description: '메뉴 시퀀스', example: 11 })
  menuSeq: number;

  @ApiProperty({ description: '메뉴명', example: '하드웨어 설정' })
  menuName: string;

  @ApiProperty({ description: '메뉴코드', example: 'controller-hardware' })
  menuCode: string;

  @ApiProperty({ description: '라우트 경로', example: '/controller/hardware' })
  menuPath: string | null;

  @ApiProperty({ description: '정렬순서', example: 1 })
  menuOrder: number | null;
}

export class GNBMenuItemDto {
  @ApiProperty({ description: '메뉴 시퀀스', example: 1 })
  menuSeq: number;

  @ApiProperty({ description: '메뉴명', example: '컨트롤러' })
  menuName: string;

  @ApiProperty({ description: '메뉴코드', example: 'controller' })
  menuCode: string;

  @ApiProperty({ description: '정렬순서', example: 1 })
  menuOrder: number | null;

  @ApiProperty({ type: [LNBMenuItemDto], description: '하위 LNB 메뉴' })
  children: LNBMenuItemDto[];
}
