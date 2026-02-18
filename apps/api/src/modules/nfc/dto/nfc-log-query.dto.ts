import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  IsString,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NfcLogQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호 (1부터 시작)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '페이지당 항목 수', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '건물 일련번호 필터', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  buildingSeq?: number;

  @ApiPropertyOptional({ description: '공간 일련번호 필터', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  spaceSeq?: number;

  @ApiPropertyOptional({ description: '리더기 일련번호 필터', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readerSeq?: number;

  @ApiPropertyOptional({
    description: '로그 유형 필터',
    enum: ['ENTER', 'EXIT', 'DENIED', 'UNKNOWN'],
    example: 'ENTER',
  })
  @IsOptional()
  @IsIn(['ENTER', 'EXIT', 'DENIED', 'UNKNOWN'])
  logType?: 'ENTER' | 'EXIT' | 'DENIED' | 'UNKNOWN';

  @ApiPropertyOptional({
    description: '제어 결과 필터',
    enum: ['SUCCESS', 'FAIL', 'PARTIAL', 'SKIPPED'],
    example: 'SUCCESS',
  })
  @IsOptional()
  @IsIn(['SUCCESS', 'FAIL', 'PARTIAL', 'SKIPPED'])
  controlResult?: 'SUCCESS' | 'FAIL' | 'PARTIAL' | 'SKIPPED';

  @ApiPropertyOptional({
    description: '시작 날짜 (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '종료 날짜 (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: '검색어 (카드 식별값, 사용자명)',
    example: '04A1',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'AID 필터 (Application Identifier)',
    example: 'D4100000030001',
  })
  @IsOptional()
  @IsString()
  aid?: string;
}
