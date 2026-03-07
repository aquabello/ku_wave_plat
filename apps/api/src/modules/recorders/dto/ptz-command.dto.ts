import { IsNotEmpty, IsString, IsNumber, IsOptional, IsIn, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PtzCommandDto {
  @ApiProperty({ description: 'PTZ 액션', enum: ['move', 'stop', 'home'] })
  @IsNotEmpty()
  @IsString()
  @IsIn(['move', 'stop', 'home'])
  action: 'move' | 'stop' | 'home';

  @ApiPropertyOptional({ description: 'Pan 이동값 (-100 ~ 100)' })
  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(100)
  pan?: number;

  @ApiPropertyOptional({ description: 'Tilt 이동값 (-100 ~ 100)' })
  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(100)
  tilt?: number;

  @ApiPropertyOptional({ description: 'Zoom 이동값 (-100 ~ 100)' })
  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(100)
  zoom?: number;
}
