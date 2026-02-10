import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsOptional,
  IsInt,
  MaxLength,
  Min,
} from 'class-validator';

export class BulkDeviceItemDto {
  @ApiProperty({ description: '공간 시퀀스', example: 1 })
  @IsNotEmpty()
  @IsInt()
  spaceSeq: number;

  @ApiProperty({ description: '장비명', example: '101호 프로젝터' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  deviceName: string;

  @ApiProperty({ description: '장비 IP', example: '192.168.1.101' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(45)
  deviceIp: string;

  @ApiProperty({ description: '장비 포트', example: 4001 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  devicePort: number;

  @ApiPropertyOptional({ description: '정렬 순서', example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  deviceOrder?: number;
}

export class CreateBulkDeviceDto {
  @ApiProperty({ description: '프리셋 시퀀스', example: 1 })
  @IsNotEmpty()
  @IsInt()
  presetSeq: number;

  @ApiProperty({ description: '등록할 장비 배열', type: [BulkDeviceItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'devices 배열이 비어있습니다' })
  @ValidateNested({ each: true })
  @Type(() => BulkDeviceItemDto)
  devices: BulkDeviceItemDto[];
}
