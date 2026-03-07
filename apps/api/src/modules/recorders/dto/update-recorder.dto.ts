import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RecorderProtocol } from '../enums/recorder-protocol.enum';

export class UpdateRecorderDto {
  @ApiPropertyOptional({ description: '녹화기명' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  recorderName?: string;

  @ApiPropertyOptional({ description: '고정 IP' })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  recorderIp?: string;

  @ApiPropertyOptional({ description: '통신 포트' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  recorderPort?: number;

  @ApiPropertyOptional({ description: '통신 프로토콜' })
  @IsOptional()
  @IsEnum(RecorderProtocol)
  recorderProtocol?: RecorderProtocol;

  @ApiPropertyOptional({ description: '녹화기 로그인 ID' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  recorderUsername?: string;

  @ApiPropertyOptional({ description: '녹화기 로그인 PW (빈 값이면 기존 유지)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  recorderPassword?: string;

  @ApiPropertyOptional({ description: '모델명' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  recorderModel?: string;

  @ApiPropertyOptional({ description: '정렬 순서' })
  @IsOptional()
  @IsNumber()
  recorderOrder?: number;

}
