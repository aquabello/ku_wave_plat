import { IsNotEmpty, IsOptional, IsString, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDeviceDto {
  @ApiProperty({ description: '플레이어 IP 주소', example: '192.168.1.100' })
  @IsNotEmpty()
  @IsString()
  player_ip: string;

  @ApiProperty({ description: '플레이어 버전', example: '1.0.0' })
  @IsNotEmpty()
  @IsString()
  player_ver: string;

  @ApiPropertyOptional({ description: '플레이어 닉네임', example: '본관 1층 디스플레이' })
  @IsOptional()
  @IsString()
  player_nick_name?: string;

  @ApiPropertyOptional({ description: '건물 시퀀스', example: 1 })
  @IsOptional()
  @IsInt()
  building_seq?: number;
}
