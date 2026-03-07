import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePresetDto {
  @ApiProperty({ description: '프리셋명' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  presetName: string;

  @ApiProperty({ description: '녹화기 내부 프리셋 번호' })
  @IsNotEmpty()
  @IsNumber()
  presetNumber: number;

  @ApiPropertyOptional({ description: 'Pan 값' })
  @IsOptional()
  @IsNumber()
  panValue?: number;

  @ApiPropertyOptional({ description: 'Tilt 값' })
  @IsOptional()
  @IsNumber()
  tiltValue?: number;

  @ApiPropertyOptional({ description: 'Zoom 값' })
  @IsOptional()
  @IsNumber()
  zoomValue?: number;

  @ApiPropertyOptional({ description: '설명' })
  @IsOptional()
  @IsString()
  presetDescription?: string;

  @ApiPropertyOptional({ description: '정렬 순서', default: 0 })
  @IsOptional()
  @IsNumber()
  presetOrder?: number;
}
