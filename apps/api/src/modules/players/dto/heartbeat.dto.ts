import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsInt, Min, Max, IsIn } from 'class-validator';

export class HeartbeatDto {
  @ApiPropertyOptional({ description: '플레이어 SW 버전', example: '1.0.0' })
  @IsOptional()
  @IsString()
  player_version?: string;

  // 시스템 리소스
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

  // 디스플레이 정보
  @ApiPropertyOptional({ description: '화면 상태', example: 'ON', enum: ['ON', 'OFF', 'STANDBY'] })
  @IsOptional()
  @IsString()
  @IsIn(['ON', 'OFF', 'STANDBY'])
  display_status?: string;

  @ApiPropertyOptional({ description: '현재 해상도', example: '1920x1080' })
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiPropertyOptional({ description: '화면 방향', example: 'LANDSCAPE', enum: ['LANDSCAPE', 'PORTRAIT'] })
  @IsOptional()
  @IsString()
  @IsIn(['LANDSCAPE', 'PORTRAIT'])
  orientation?: string;

  @ApiPropertyOptional({ description: '볼륨 레벨 (0-100)', example: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  volume?: number;

  // 네트워크 정보
  @ApiPropertyOptional({ description: '네트워크 종류', example: 'ETHERNET', enum: ['ETHERNET', 'WIFI'] })
  @IsOptional()
  @IsString()
  @IsIn(['ETHERNET', 'WIFI'])
  network_type?: string;

  @ApiPropertyOptional({ description: '네트워크 속도 (Mbps)', example: 100 })
  @IsOptional()
  @IsInt()
  network_speed?: number;

  // 기기 정보
  @ApiPropertyOptional({ description: '가동 시간 (초)', example: 86400 })
  @IsOptional()
  @IsInt()
  uptime?: number;

  @ApiPropertyOptional({ description: '남은 저장공간 (MB)', example: 2048 })
  @IsOptional()
  @IsInt()
  storage_free?: number;

  @ApiPropertyOptional({ description: 'OS 버전', example: 'Windows 11 23H2' })
  @IsOptional()
  @IsString()
  os_version?: string;

  @ApiPropertyOptional({ description: '마지막 콘텐츠 다운로드 시각', example: '2026-02-22T10:30:00' })
  @IsOptional()
  @IsString()
  last_download_at?: string;

  // 에러
  @ApiPropertyOptional({ description: '에러 메시지' })
  @IsOptional()
  @IsString()
  error_message?: string;
}
