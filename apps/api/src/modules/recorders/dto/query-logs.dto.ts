import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RecorderLogType, ResultStatus } from '../enums/log-type.enum';

export class QueryLogsDto {
  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '페이지당 항목 수', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: '유형 필터', enum: RecorderLogType })
  @IsOptional()
  @IsEnum(RecorderLogType)
  logType?: RecorderLogType;

  @ApiPropertyOptional({ description: '결과 필터', enum: ResultStatus })
  @IsOptional()
  @IsEnum(ResultStatus)
  resultStatus?: ResultStatus;

  @ApiPropertyOptional({ description: '시작일 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '종료일 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
