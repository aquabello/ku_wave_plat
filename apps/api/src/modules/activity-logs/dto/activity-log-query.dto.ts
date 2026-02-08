import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

export class ActivityLogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '통합 검색 (사용자ID, 이름)', example: 'admin' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'HTTP 메서드 필터', example: 'POST' })
  @IsOptional()
  @IsString()
  httpMethod?: string;

  @ApiPropertyOptional({ description: '행위명 필터', example: '건물' })
  @IsOptional()
  @IsString()
  actionName?: string;

  @ApiPropertyOptional({ description: '시작일 (YYYY-MM-DD)', example: '2026-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '종료일 (YYYY-MM-DD)', example: '2026-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
