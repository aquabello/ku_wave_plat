import { IsNotEmpty, IsOptional, IsNumber, IsString, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommandExecutionStatus } from '../enums/command-execution-status.enum';
import { VerifySource } from '../enums/verify-source.enum';

export class CreateCommandLogDto {
  @ApiProperty({ description: '세션 시퀀스' })
  @IsNotEmpty()
  @IsNumber()
  sessionSeq: number;

  @ApiProperty({ description: '인식된 원문' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  recognizedText: string;

  @ApiPropertyOptional({ description: '매칭된 키워드' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  matchedKeyword?: string;

  @ApiPropertyOptional({ description: '매칭 점수' })
  @IsOptional()
  @IsNumber()
  matchScore?: number;

  @ApiPropertyOptional({ description: '음성명령 시퀀스' })
  @IsOptional()
  @IsNumber()
  voiceCommandSeq?: number;

  @ApiPropertyOptional({ description: '검증 소스', enum: VerifySource })
  @IsOptional()
  @IsEnum(VerifySource)
  verifySource?: VerifySource;

  @ApiProperty({ description: '실행 상태', enum: CommandExecutionStatus })
  @IsNotEmpty()
  @IsEnum(CommandExecutionStatus)
  executionStatus: CommandExecutionStatus;

  @ApiPropertyOptional({ description: '실행 결과 JSON' })
  @IsOptional()
  @IsString()
  executionResult?: string;
}
