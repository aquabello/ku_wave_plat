import { ApiProperty } from '@nestjs/swagger';

export class ActivityLogListItemDto {
  @ApiProperty({ description: '번호 (역순)', example: 100 })
  no: number;

  @ApiProperty({ description: '로그 시퀀스', example: 1 })
  logSeq: number;

  @ApiProperty({ description: '사용자 아이디', example: 'admin' })
  tuId: string | null;

  @ApiProperty({ description: '사용자 이름', example: '관리자' })
  tuName: string | null;

  @ApiProperty({ description: '행위명', example: '건물 등록' })
  actionName: string | null;

  @ApiProperty({ description: 'HTTP 메서드', example: 'POST' })
  httpMethod: string;

  @ApiProperty({ description: '요청 URL', example: '/api/v1/buildings' })
  requestUrl: string;

  @ApiProperty({ description: 'HTTP 응답 코드', example: 201 })
  statusCode: number | null;

  @ApiProperty({ description: '처리시간(ms)', example: 45 })
  durationMs: number | null;

  @ApiProperty({ description: '발생일시' })
  regDate: Date | null;
}

export class ActivityLogDetailDto extends ActivityLogListItemDto {
  @ApiProperty({ description: '사용자 시퀀스', example: 1 })
  tuSeq: number | null;

  @ApiProperty({ description: '요청 데이터 (JSON)' })
  requestBody: Record<string, unknown> | null;

  @ApiProperty({ description: '응답 데이터 (JSON)' })
  responseBody: Record<string, unknown> | null;

  @ApiProperty({ description: 'IP 주소', example: '127.0.0.1' })
  ipAddress: string | null;

  @ApiProperty({ description: 'User-Agent' })
  userAgent: string | null;
}

export class ActivityLogListResponseDto {
  @ApiProperty({ type: [ActivityLogListItemDto] })
  items: ActivityLogListItemDto[];

  @ApiProperty({ description: '전체 수', example: 100 })
  total: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 20 })
  limit: number;

  @ApiProperty({ description: '전체 페이지 수', example: 5 })
  totalPages: number;
}
