import { ApiProperty } from '@nestjs/swagger';

export class PermissionListItemDto {
  @ApiProperty({ description: '번호 (역순)', example: 5 })
  no: number;

  @ApiProperty({ description: '사용자 시퀀스', example: 1 })
  seq: number;

  @ApiProperty({ description: '아이디', example: 'admin' })
  id: string | null;

  @ApiProperty({ description: '이름', example: '관리자' })
  name: string | null;

  @ApiProperty({ description: '사용자 타입', example: 'SUPER' })
  userType: string | null;

  @ApiProperty({ description: '상태', example: 'OK' })
  step: string | null;

  @ApiProperty({ description: '할당된 건물 목록', example: ['공학관 A동'] })
  assignedBuildings: string[];

  @ApiProperty({ description: '할당된 메뉴 목록', example: ['컨트롤러', '회원관리'] })
  assignedMenus: string[];
}

export class PermissionListResponseDto {
  @ApiProperty({ type: [PermissionListItemDto] })
  items: PermissionListItemDto[];

  @ApiProperty({ description: '전체 수', example: 10 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 10 })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수', example: 1 })
  totalPages: number;
}
