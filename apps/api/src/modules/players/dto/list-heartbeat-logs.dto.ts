import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

export class ListHeartbeatLogsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '시작 일시 (ISO 8601)', example: '2026-02-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: '종료 일시 (ISO 8601)', example: '2026-02-14T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
