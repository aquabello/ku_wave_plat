import { IsNotEmpty, IsOptional, IsNumber, IsString, IsArray, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVoiceCommandDto {
  @ApiProperty({ description: '공간 시퀀스' })
  @IsNotEmpty()
  @IsNumber()
  spaceSeq: number;

  @ApiProperty({ description: '음성 키워드' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  keyword: string;

  @ApiPropertyOptional({ description: '키워드 별칭 배열' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywordAliases?: string[];

  @ApiProperty({ description: '제어 대상 장비 시퀀스' })
  @IsNotEmpty()
  @IsNumber()
  spaceDeviceSeq: number;

  @ApiProperty({ description: '실행할 명령어 시퀀스' })
  @IsNotEmpty()
  @IsNumber()
  commandSeq: number;

  @ApiPropertyOptional({ description: '즉시실행 임계값', default: 0.85 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minConfidence?: number;

  @ApiPropertyOptional({ description: '우선순위', default: 0 })
  @IsOptional()
  @IsNumber()
  commandPriority?: number;
}
