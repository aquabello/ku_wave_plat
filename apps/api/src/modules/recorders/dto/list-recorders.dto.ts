import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RecorderStatus } from '../enums/recorder-status.enum';

export class ListRecordersDto {
  @ApiPropertyOptional({ description: '페이지 번호', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '페이지당 항목 수', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: '건물 시퀀스 필터' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  buildingSeq?: number;

  @ApiPropertyOptional({ description: '통합 검색 (녹화기명, IP)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '상태 필터', enum: RecorderStatus })
  @IsOptional()
  @IsEnum(RecorderStatus)
  status?: RecorderStatus;
}
