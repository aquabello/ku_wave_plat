import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePresetCommandDto {
  @ApiProperty({ description: '명령어명 (예: 전원 ON)', example: '전원 ON' })
  @IsNotEmpty({ message: '명령어명은 필수입니다' })
  @IsString()
  @MaxLength(100)
  commandName: string;

  @ApiProperty({
    description: '명령어 코드 (HEX 또는 텍스트)',
    example: 'A5 5A 01 00 00 00',
  })
  @IsNotEmpty({ message: '명령어 코드는 필수입니다' })
  @IsString()
  @MaxLength(500)
  commandCode: string;

  @ApiPropertyOptional({
    description: '명령어 유형 (POWER_ON, POWER_OFF, INPUT_CHANGE, CUSTOM)',
    example: 'CUSTOM',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  commandType?: string;

  @ApiPropertyOptional({ description: '정렬 순서', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  commandOrder?: number;
}

export class CreatePresetDto {
  @ApiProperty({ description: '프리셋명 (예: 강의실 프로젝터)', example: '강의실 프로젝터' })
  @IsNotEmpty({ message: '프리셋명은 필수입니다' })
  @IsString()
  @MaxLength(100)
  presetName: string;

  @ApiProperty({
    description: '통신 프로토콜',
    enum: ['TCP', 'UDP', 'WOL', 'HTTP', 'RS232'],
    example: 'TCP',
  })
  @IsNotEmpty({ message: '통신 프로토콜은 필수입니다' })
  @IsEnum(['TCP', 'UDP', 'WOL', 'HTTP', 'RS232'], {
    message: '통신 프로토콜은 TCP, UDP, WOL, HTTP, RS232 중 하나여야 합니다',
  })
  protocolType: string;

  @ApiPropertyOptional({ description: '기본 통신 IP', example: '192.168.0.100' })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  commIp?: string;

  @ApiPropertyOptional({ description: '기본 통신 포트', example: 9000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  commPort?: number;

  @ApiPropertyOptional({
    description: '프리셋 설명',
    example: 'Sony 프로젝터 제어용 프리셋',
  })
  @IsOptional()
  @IsString()
  presetDescription?: string;

  @ApiPropertyOptional({ description: '정렬 순서', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  presetOrder?: number;

  @ApiPropertyOptional({
    description: '명령어 목록',
    type: [CreatePresetCommandDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePresetCommandDto)
  commands?: CreatePresetCommandDto[];
}
