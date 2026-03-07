import { IsNotEmpty, IsOptional, IsNumber, IsString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSpeechLogDto {
  @ApiProperty({ description: '세션 시퀀스' })
  @IsNotEmpty()
  @IsNumber()
  sessionSeq: number;

  @ApiProperty({ description: '인식된 텍스트' })
  @IsNotEmpty()
  @IsString()
  segmentText: string;

  @ApiPropertyOptional({ description: '구간 시작 (초)' })
  @IsOptional()
  @IsNumber()
  segmentStartSec?: number;

  @ApiPropertyOptional({ description: '구간 종료 (초)' })
  @IsOptional()
  @IsNumber()
  segmentEndSec?: number;

  @ApiPropertyOptional({ description: 'STT 신뢰도 (0~1)' })
  @IsOptional()
  @IsNumber()
  confidence?: number;

  @ApiPropertyOptional({ description: '명령어 인식 여부', default: 'N' })
  @IsOptional()
  @IsIn(['Y', 'N'])
  isCommand?: 'Y' | 'N';
}
