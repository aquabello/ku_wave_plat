import { IsOptional, IsNumber, IsString, IsArray, MaxLength, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVoiceCommandDto {
  @ApiPropertyOptional({ description: '음성 키워드' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @ApiPropertyOptional({ description: '키워드 별칭 배열' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywordAliases?: string[];

  @ApiPropertyOptional({ description: '제어 대상 장비 시퀀스' })
  @IsOptional()
  @IsNumber()
  spaceDeviceSeq?: number;

  @ApiPropertyOptional({ description: '실행할 명령어 시퀀스' })
  @IsOptional()
  @IsNumber()
  commandSeq?: number;

  @ApiPropertyOptional({ description: '즉시실행 임계값' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minConfidence?: number;

  @ApiPropertyOptional({ description: '우선순위' })
  @IsOptional()
  @IsNumber()
  commandPriority?: number;
}
