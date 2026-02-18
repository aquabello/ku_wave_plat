import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsISO8601 } from 'class-validator';

export class QueryStatsDto {
  @ApiProperty({ example: '2026-02-01T00:00:00Z', description: '시작 일시 (ISO 8601)', required: false })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiProperty({ example: '2026-02-28T23:59:59Z', description: '종료 일시 (ISO 8601)', required: false })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
