import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '@modules/recorders/enums/session-status.enum';
import { FtpStatus } from '@modules/recorders/enums/ftp-status.enum';

export class QuerySessionsDto {
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

  @ApiPropertyOptional({ description: '건물 시퀀스 필터' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  buildingSeq?: number;

  @ApiPropertyOptional({ description: '녹화기 시퀀스 필터' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  recorderSeq?: number;

  @ApiPropertyOptional({ description: '사용자 시퀀스 필터' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tuSeq?: number;

  @ApiPropertyOptional({ description: '상태 필터', enum: SessionStatus })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiPropertyOptional({ description: '시작일 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '종료일 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class QueryFilesDto {
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

  @ApiPropertyOptional({ description: '건물 시퀀스 필터' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  buildingSeq?: number;

  @ApiPropertyOptional({ description: 'FTP 상태 필터', enum: FtpStatus })
  @IsOptional()
  @IsEnum(FtpStatus)
  ftpStatus?: FtpStatus;

  @ApiPropertyOptional({ description: '시작일 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '종료일 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
