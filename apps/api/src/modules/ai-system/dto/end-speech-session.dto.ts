import { IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EndSpeechSessionDto {
  @ApiPropertyOptional({ description: '총 세션 시간 (초)' })
  @IsOptional()
  @IsNumber()
  totalDurationSec?: number;

  @ApiPropertyOptional({ description: '총 인식 구간 수' })
  @IsOptional()
  @IsNumber()
  totalSegments?: number;

  @ApiPropertyOptional({ description: '총 명령 실행 수' })
  @IsOptional()
  @IsNumber()
  totalCommands?: number;

  @ApiPropertyOptional({ description: '연결된 강의요약 시퀀스' })
  @IsOptional()
  @IsNumber()
  summarySeq?: number;
}
