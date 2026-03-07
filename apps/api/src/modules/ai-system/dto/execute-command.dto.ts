import { IsNotEmpty, IsOptional, IsNumber, IsString, IsEnum, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerifySource } from '../enums/verify-source.enum';

export class ExecuteCommandDto {
  @ApiProperty({ description: '현재 음성인식 세션 시퀀스' })
  @IsNotEmpty()
  @IsNumber()
  sessionSeq: number;

  @ApiProperty({ description: '매칭된 음성 명령어 시퀀스' })
  @IsNotEmpty()
  @IsNumber()
  voiceCommandSeq: number;

  @ApiProperty({ description: 'STT 인식 원문 텍스트' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  recognizedText: string;

  @ApiProperty({ description: '매칭된 키워드' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  matchedKeyword: string;

  @ApiProperty({ description: '매칭 신뢰도 (0~1)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(1)
  matchScore: number;

  @ApiPropertyOptional({ description: '검증 소스', enum: VerifySource })
  @IsOptional()
  @IsEnum(VerifySource)
  verifySource?: VerifySource;
}
