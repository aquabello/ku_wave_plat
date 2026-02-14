import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsIP, IsEnum, MaxLength, Matches } from 'class-validator';

export class UpdatePlayerDto {
  @ApiPropertyOptional({ description: '플레이어명', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  player_name?: string;

  @ApiPropertyOptional({ description: 'Device ID', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  player_did?: string;

  @ApiPropertyOptional({ description: 'MAC 주소', example: 'AA:BB:CC:DD:EE:FF' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/, {
    message: 'MAC 주소 형식이 올바르지 않습니다',
  })
  player_mac?: string;

  @ApiPropertyOptional({ description: '건물 시퀀스' })
  @IsOptional()
  @IsInt()
  building_seq?: number;

  @ApiPropertyOptional({ description: '공간 시퀀스' })
  @IsOptional()
  @IsInt()
  space_seq?: number;

  @ApiPropertyOptional({ description: '플레이리스트 시퀀스' })
  @IsOptional()
  @IsInt()
  playlist_seq?: number;

  @ApiPropertyOptional({ description: 'IP 주소' })
  @IsOptional()
  @IsIP()
  player_ip?: string;

  @ApiPropertyOptional({ description: '통신 포트' })
  @IsOptional()
  @IsInt()
  player_port?: number;

  @ApiPropertyOptional({ description: '화면 해상도' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  player_resolution?: string;

  @ApiPropertyOptional({ description: '화면 방향', enum: ['LANDSCAPE', 'PORTRAIT'] })
  @IsOptional()
  @IsEnum(['LANDSCAPE', 'PORTRAIT'])
  player_orientation?: 'LANDSCAPE' | 'PORTRAIT';

  @ApiPropertyOptional({ description: '플레이어 설명' })
  @IsOptional()
  @IsString()
  player_description?: string;

  @ApiPropertyOptional({ description: '정렬 순서' })
  @IsOptional()
  @IsInt()
  player_order?: number;
}
