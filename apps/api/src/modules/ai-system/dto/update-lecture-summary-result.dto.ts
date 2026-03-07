import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLectureSummaryResultDto {
  @ApiProperty({ description: 'STT 전체 텍스트' })
  @IsNotEmpty()
  @IsString()
  sttText: string;

  @ApiPropertyOptional({ description: '감지 언어' })
  @IsOptional()
  @IsString()
  sttLanguage?: string;

  @ApiPropertyOptional({ description: 'STT 신뢰도 (0~1)' })
  @IsOptional()
  @IsNumber()
  sttConfidence?: number;

  @ApiProperty({ description: '요약 텍스트' })
  @IsNotEmpty()
  @IsString()
  summaryText: string;

  @ApiPropertyOptional({ description: '키워드 배열' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  summaryKeywords?: string[];

  @ApiProperty({ description: '처리 완료 시각' })
  @IsNotEmpty()
  @IsString()
  completedAt: string;

  @ApiPropertyOptional({ description: '연결된 음성인식 세션 시퀀스' })
  @IsOptional()
  @IsNumber()
  sessionSeq?: number;
}
