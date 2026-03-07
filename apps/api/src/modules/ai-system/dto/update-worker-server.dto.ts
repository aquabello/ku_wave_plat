import { IsOptional, IsNumber, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateWorkerServerDto {
  @ApiPropertyOptional({ description: '서버명' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serverName?: string;

  @ApiPropertyOptional({ description: '서버 URL' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  serverUrl?: string;

  @ApiPropertyOptional({ description: 'API 인증키' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Callback 검증용 Secret' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  callbackSecret?: string;

  @ApiPropertyOptional({ description: 'GPU 정보' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  gpuInfo?: string;

  @ApiPropertyOptional({ description: '동시 처리 가능 Job 수' })
  @IsOptional()
  @IsNumber()
  maxConcurrentJobs?: number;

  @ApiPropertyOptional({ description: '기본 STT 모델' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  defaultSttModel?: string;

  @ApiPropertyOptional({ description: '기본 요약 LLM 모델' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  defaultLlmModel?: string;
}
