import { ApiProperty } from '@nestjs/swagger';

export class BuildingListItemDto {
  @ApiProperty({ description: '번호 (역순)', example: 4 })
  no: number;

  @ApiProperty({ description: '건물 시퀀스', example: 1 })
  buildingSeq: number;

  @ApiProperty({ description: '건물명', example: '공학관 A동' })
  buildingName: string;

  @ApiProperty({ description: '건물 코드', example: 'BLD-001' })
  buildingCode: string | null;

  @ApiProperty({ description: '위치', example: '서울시 광진구 능동로 120' })
  buildingLocation: string | null;

  @ApiProperty({ description: '층수', example: 5 })
  buildingFloorCount: number | null;

  @ApiProperty({ description: '플레이어 수', example: 0 })
  playerCount: number;

  @ApiProperty({ description: '할당 사용자 수', example: 0 })
  assignedUserCount: number;

  @ApiProperty({ description: '공간 수', example: 3 })
  spaceCount: number;
}

export class BuildingListResponseDto {
  @ApiProperty({ type: [BuildingListItemDto] })
  items: BuildingListItemDto[];

  @ApiProperty({ description: '전체 건물 수', example: 10 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 10 })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수', example: 1 })
  totalPages: number;
}
