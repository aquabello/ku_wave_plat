import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ProcessStatus } from '../enums/process-status.enum';

export class ListLectureSummariesDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: '공간 시퀀스 필터' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  spaceSeq?: number;

  @ApiPropertyOptional({ description: '건물 시퀀스 필터' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  buildingSeq?: number;

  @ApiPropertyOptional({ description: '상태 필터' })
  @IsOptional()
  @IsEnum(ProcessStatus)
  processStatus?: ProcessStatus;

  @ApiPropertyOptional({ description: '통합 검색 (강의제목, 파일명, 키워드)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '녹음일 시작 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '녹음일 종료 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
