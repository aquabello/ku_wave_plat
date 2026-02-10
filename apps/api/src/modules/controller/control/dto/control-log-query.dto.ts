import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ControlLogQueryDto {
  @ApiPropertyOptional({ description: '건물 시퀀스 필터', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  buildingSeq?: number;

  @ApiPropertyOptional({ description: '공간 시퀀스 필터', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  spaceSeq?: number;

  @ApiPropertyOptional({ description: '장비 시퀀스 필터', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  spaceDeviceSeq?: number;

  @ApiPropertyOptional({
    description: '결과 필터 (SUCCESS/FAIL/TIMEOUT)',
    example: 'SUCCESS',
    enum: ['SUCCESS', 'FAIL', 'TIMEOUT'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['SUCCESS', 'FAIL', 'TIMEOUT'])
  resultStatus?: string;

  @ApiPropertyOptional({ description: '시작일 (YYYY-MM-DD)', example: '2026-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '종료일 (YYYY-MM-DD)', example: '2026-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: '페이지 번호', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '페이지당 항목 수', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
