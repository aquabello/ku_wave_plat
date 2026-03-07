import { IsNotEmpty, IsOptional, IsNumber, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLectureSummaryDto {
  @ApiProperty({ description: '공간 시퀀스' })
  @IsNotEmpty()
  @IsNumber()
  spaceSeq: number;

  @ApiPropertyOptional({ description: '강의자 시퀀스' })
  @IsOptional()
  @IsNumber()
  tuSeq?: number;

  @ApiProperty({ description: '미니PC 식별자' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  deviceCode: string;

  @ApiProperty({ description: 'ku_ai_worker Job UUID' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(36)
  jobId: string;

  @ApiPropertyOptional({ description: '강의 제목' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  recordingTitle?: string;

  @ApiProperty({ description: '원본 파일명' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  recordingFilename: string;

  @ApiPropertyOptional({ description: '녹음 길이 (초)' })
  @IsOptional()
  @IsNumber()
  durationSeconds?: number;

  @ApiPropertyOptional({ description: '녹음 시각 (ISO 8601)' })
  @IsOptional()
  @IsString()
  recordedAt?: string;
}
