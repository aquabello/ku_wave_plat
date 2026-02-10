import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsIn, MaxLength, Min } from 'class-validator';

export class UpdateDeviceDto {
  @ApiPropertyOptional({ description: '프리셋 시퀀스', example: 1 })
  @IsOptional()
  @IsInt()
  presetSeq?: number;

  @ApiPropertyOptional({ description: '장비명', example: '101호 프로젝터' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceName?: string;

  @ApiPropertyOptional({ description: '장비 IP', example: '192.168.1.100' })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  deviceIp?: string;

  @ApiPropertyOptional({ description: '장비 포트', example: 9999 })
  @IsOptional()
  @IsInt()
  @Min(1)
  devicePort?: number;

  @ApiPropertyOptional({ description: '장비 상태', enum: ['ACTIVE', 'INACTIVE'], example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE'])
  deviceStatus?: string;

  @ApiPropertyOptional({ description: '정렬 순서', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  deviceOrder?: number;
}
