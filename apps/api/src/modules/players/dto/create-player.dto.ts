import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsOptional, IsIP, IsEnum, MaxLength, Matches } from 'class-validator';

export class CreatePlayerDto {
  @ApiProperty({ description: '플레이어명', example: '본관 1층 로비 디스플레이', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  player_name: string;

  @ApiPropertyOptional({ description: '플레이어 코드 (미입력 시 자동 생성)', example: 'PLAYER-001', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  player_code?: string;

  @ApiPropertyOptional({ description: 'Device ID', example: 'DID-12345', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  player_did?: string;

  @ApiPropertyOptional({ description: 'MAC 주소', example: 'AA:BB:CC:DD:EE:FF' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, {
    message: 'MAC 주소 형식이 올바르지 않습니다 (예: AA:BB:CC:DD:EE:FF)',
  })
  player_mac?: string;

  @ApiProperty({ description: '건물 시퀀스', example: 1 })
  @IsInt()
  @IsNotEmpty()
  building_seq: number;

  @ApiPropertyOptional({ description: '공간 시퀀스', example: 1 })
  @IsOptional()
  @IsInt()
  space_seq?: number;

  @ApiPropertyOptional({ description: '플레이리스트 시퀀스', example: 1 })
  @IsOptional()
  @IsInt()
  playlist_seq?: number;

  @ApiProperty({ description: 'IP 주소', example: '192.168.1.100' })
  @IsIP()
  @IsNotEmpty()
  player_ip: string;

  @ApiPropertyOptional({ description: '통신 포트', example: 9090, default: 9090 })
  @IsOptional()
  @IsInt()
  player_port?: number;

  @ApiPropertyOptional({ description: '화면 해상도', example: '1920x1080' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  player_resolution?: string;

  @ApiPropertyOptional({ description: '화면 방향', enum: ['LANDSCAPE', 'PORTRAIT'], default: 'LANDSCAPE' })
  @IsOptional()
  @IsEnum(['LANDSCAPE', 'PORTRAIT'])
  player_orientation?: 'LANDSCAPE' | 'PORTRAIT';

  @ApiPropertyOptional({ description: '플레이어 설명' })
  @IsOptional()
  @IsString()
  player_description?: string;
}
