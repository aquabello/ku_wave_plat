import { ApiProperty } from '@nestjs/swagger';

export class SpaceListItemDto {
  @ApiProperty({ description: '번호 (역순)', example: 5 })
  no: number;

  @ApiProperty({ description: '공간 시퀀스', example: 1 })
  spaceSeq: number;

  @ApiProperty({ description: '건물 시퀀스', example: 1 })
  buildingSeq: number;

  @ApiProperty({ description: '공간명', example: '101호' })
  spaceName: string;

  @ApiProperty({ description: '공간 코드', example: 'SPC-001' })
  spaceCode: string;

  @ApiProperty({ description: '층', example: '1' })
  spaceFloor: string | null;

  @ApiProperty({ description: '공간 유형', example: '강의실' })
  spaceType: string | null;

  @ApiProperty({ description: '수용 인원', example: 40 })
  spaceCapacity: number | null;
}

export class SpaceListResponseDto {
  @ApiProperty({ type: [SpaceListItemDto] })
  items: SpaceListItemDto[];

  @ApiProperty({ description: '전체 수', example: 10 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 10 })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수', example: 1 })
  totalPages: number;
}
