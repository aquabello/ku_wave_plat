import { ApiProperty } from '@nestjs/swagger';

export class UserListItemDto {
  @ApiProperty({ description: '번호 (역순)', example: 10 })
  no: number;

  @ApiProperty({ description: '사용자 시퀀스', example: 1 })
  seq: number;

  @ApiProperty({ description: '아이디', example: 'user01' })
  id: string | null;

  @ApiProperty({ description: '이름', example: '홍길동' })
  name: string | null;

  @ApiProperty({ description: '마지막 접속일시', example: '2025-01-01T00:00:00.000Z', nullable: true })
  lastAccessDate: Date | null;

  @ApiProperty({ description: '승인여부 (상태)', example: '01', nullable: true })
  step: string | null;

  @ApiProperty({ description: '승인일시', example: '2025-01-01T00:00:00.000Z', nullable: true })
  approvedDate: Date | null;
}

export class UserListResponseDto {
  @ApiProperty({ type: [UserListItemDto] })
  items: UserListItemDto[];

  @ApiProperty({ description: '전체 사용자 수', example: 10 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 10 })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수', example: 1 })
  totalPages: number;
}
