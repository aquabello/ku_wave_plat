import { IsNotEmpty, IsOptional, IsString, IsEnum, ValidateNested, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class SttSegmentDto {
  @IsNumber()
  start: number;

  @IsNumber()
  end: number;

  @IsString()
  text: string;
}

class CallbackResultDto {
  @ApiProperty({ description: 'STT 전체 텍스트' })
  @IsNotEmpty()
  @IsString()
  sttText: string;

  @ApiPropertyOptional({ description: '감지 언어' })
  @IsOptional()
  @IsString()
  sttLanguage?: string;

  @ApiPropertyOptional({ description: 'STT 신뢰도' })
  @IsOptional()
  @IsNumber()
  sttConfidence?: number;

  @ApiPropertyOptional({ description: '구간별 STT 결과' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SttSegmentDto)
  sttSegments?: SttSegmentDto[];

  @ApiPropertyOptional({ description: 'STT 처리 시간 (ms)' })
  @IsOptional()
  @IsNumber()
  sttProcessingTimeMs?: number;

  @ApiProperty({ description: '요약 텍스트' })
  @IsNotEmpty()
  @IsString()
  summaryText: string;

  @ApiPropertyOptional({ description: '키워드 배열' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  summaryKeywords?: string[];

  @ApiPropertyOptional({ description: '요약 처리 시간 (ms)' })
  @IsOptional()
  @IsNumber()
  summaryProcessingTimeMs?: number;
}

export class AiCallbackDto {
  @ApiProperty({ description: 'Job UUID' })
  @IsNotEmpty()
  @IsString()
  jobId: string;

  @ApiProperty({ description: '업로드 UUID' })
  @IsNotEmpty()
  @IsString()
  uploadId: string;

  @ApiProperty({ description: '처리 결과 상태', enum: ['COMPLETED', 'FAILED'] })
  @IsNotEmpty()
  @IsEnum(['COMPLETED', 'FAILED'])
  status: 'COMPLETED' | 'FAILED';

  @ApiPropertyOptional({ description: '처리 결과 (COMPLETED일 때)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CallbackResultDto)
  result?: CallbackResultDto;

  @ApiPropertyOptional({ description: '에러 코드 (FAILED일 때)' })
  @IsOptional()
  @IsString()
  errorCode?: string;

  @ApiPropertyOptional({ description: '에러 메시지 (FAILED일 때)' })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}
