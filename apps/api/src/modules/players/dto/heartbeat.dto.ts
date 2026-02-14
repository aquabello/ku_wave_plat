import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class HeartbeatDto {
  @ApiProperty({ description: '플레이어 시퀀스', example: 1 })
  @IsInt()
  @IsNotEmpty()
  player_seq: number;

  @ApiPropertyOptional({ description: '플레이어 SW 버전', example: '1.0.0' })
  @IsOptional()
  @IsString()
  player_version?: string;

  @ApiPropertyOptional({ description: 'CPU 사용률 (%)', example: 45.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  cpu_usage?: number;

  @ApiPropertyOptional({ description: '메모리 사용률 (%)', example: 68.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  memory_usage?: number;

  @ApiPropertyOptional({ description: '디스크 사용률 (%)', example: 35.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  disk_usage?: number;

  @ApiPropertyOptional({ description: '현재 재생 중인 플레이리스트', example: 1 })
  @IsOptional()
  @IsInt()
  current_playlist?: number;

  @ApiPropertyOptional({ description: '현재 재생 중인 콘텐츠', example: 'CONTENT-001' })
  @IsOptional()
  @IsString()
  current_content?: string;

  @ApiPropertyOptional({ description: '에러 메시지' })
  @IsOptional()
  @IsString()
  error_message?: string;
}
