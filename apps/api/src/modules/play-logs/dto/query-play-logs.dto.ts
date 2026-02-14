import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum, IsISO8601 } from 'class-validator';

export class QueryPlayLogsDto {
  @ApiProperty({ example: 1, description: '페이지 번호', required: false })
  @IsOptional()
  @IsInt()
  page?: number;

  @ApiProperty({ example: 20, description: '페이지 크기', required: false })
  @IsOptional()
  @IsInt()
  limit?: number;

  @ApiProperty({ example: '2026-02-01T00:00:00Z', description: '시작 일시 (ISO 8601)', required: false })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiProperty({ example: '2026-02-28T23:59:59Z', description: '종료 일시 (ISO 8601)', required: false })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiProperty({ example: 'COMPLETED', enum: ['COMPLETED', 'SKIPPED', 'ERROR'], required: false })
  @IsOptional()
  @IsEnum(['COMPLETED', 'SKIPPED', 'ERROR'])
  status?: 'COMPLETED' | 'SKIPPED' | 'ERROR';

  @ApiProperty({ example: 1, description: '플레이리스트 필터', required: false })
  @IsOptional()
  @IsInt()
  playlist_seq?: number;

  @ApiProperty({ example: 1, description: '콘텐츠 필터', required: false })
  @IsOptional()
  @IsInt()
  content_seq?: number;
}
