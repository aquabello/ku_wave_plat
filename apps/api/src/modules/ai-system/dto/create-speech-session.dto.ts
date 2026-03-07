import { IsNotEmpty, IsOptional, IsNumber, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSpeechSessionDto {
  @ApiProperty({ description: '공간 시퀀스' })
  @IsNotEmpty()
  @IsNumber()
  spaceSeq: number;

  @ApiPropertyOptional({ description: '강의자 시퀀스' })
  @IsOptional()
  @IsNumber()
  tuSeq?: number;

  @ApiPropertyOptional({ description: 'STT 엔진명', default: 'faster-whisper' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sttEngine?: string;

  @ApiPropertyOptional({ description: 'STT 모델명', default: 'small' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sttModel?: string;

  @ApiPropertyOptional({ description: '녹음 파일명' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  recordingFilename?: string;
}
