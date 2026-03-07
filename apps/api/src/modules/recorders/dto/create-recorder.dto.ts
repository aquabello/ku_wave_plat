import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecorderProtocol } from '../enums/recorder-protocol.enum';

export class CreateRecorderDto {
  @ApiProperty({ description: '공간 시퀀스 (호실)' })
  @IsNotEmpty()
  @IsNumber()
  spaceSeq: number;

  @ApiProperty({ description: '녹화기명' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  recorderName: string;

  @ApiProperty({ description: '고정 IP' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(45)
  recorderIp: string;

  @ApiPropertyOptional({ description: '통신 포트', default: 80 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  recorderPort?: number;

  @ApiPropertyOptional({ description: '통신 프로토콜', default: 'HTTP' })
  @IsOptional()
  @IsEnum(RecorderProtocol)
  recorderProtocol?: RecorderProtocol;

  @ApiPropertyOptional({ description: '녹화기 로그인 ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  recorderUsername?: string;

  @ApiPropertyOptional({ description: '녹화기 로그인 PW' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  recorderPassword?: string;

  @ApiPropertyOptional({ description: '모델명' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  recorderModel?: string;

  @ApiPropertyOptional({ description: '정렬 순서', default: 0 })
  @IsOptional()
  @IsNumber()
  recorderOrder?: number;

}
