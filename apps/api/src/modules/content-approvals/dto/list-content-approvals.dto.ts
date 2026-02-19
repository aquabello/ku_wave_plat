import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class ListContentApprovalsDto {
  @ApiPropertyOptional({ description: '건물 시퀀스 필터' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  building_seq?: number;

  @ApiPropertyOptional({ description: '승인 상태 필터', enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED'])
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ description: '검색어 (콘텐츠명, 플레이리스트명)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '시작일 (ISO 8601)', example: '2026-02-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: '종료일 (ISO 8601)', example: '2026-02-28' })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
