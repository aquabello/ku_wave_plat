import { IsString, IsNumber, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePresetDto {
  @ApiPropertyOptional({ description: '프리셋명' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  presetName?: string;

  @ApiPropertyOptional({ description: '녹화기 내부 프리셋 번호' })
  @IsOptional()
  @IsNumber()
  presetNumber?: number;

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

  @ApiPropertyOptional({ description: '정렬 순서' })
  @IsOptional()
  @IsNumber()
  presetOrder?: number;
}
