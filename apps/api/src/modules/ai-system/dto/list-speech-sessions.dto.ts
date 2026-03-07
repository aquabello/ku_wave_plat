import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SpeechSessionStatus } from '../enums/speech-session-status.enum';

export class ListSpeechSessionsDto {
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

  @ApiPropertyOptional({ description: '세션 상태 필터' })
  @IsOptional()
  @IsEnum(SpeechSessionStatus)
  sessionStatus?: SpeechSessionStatus;

  @ApiPropertyOptional({ description: '시작일 필터 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '종료일 필터 (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
