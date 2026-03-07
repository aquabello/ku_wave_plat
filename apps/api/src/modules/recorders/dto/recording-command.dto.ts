import { IsString, IsNumber, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RecordingStartDto {
  @ApiPropertyOptional({ description: '강의명 / 메모' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sessionTitle?: string;

  @ApiPropertyOptional({ description: '사용할 프리셋 시퀀스' })
  @IsOptional()
  @IsNumber()
  recPresetSeq?: number;
}
