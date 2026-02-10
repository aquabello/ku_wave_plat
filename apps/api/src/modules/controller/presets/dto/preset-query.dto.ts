import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PresetQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '페이지당 항목 수', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: '검색어 (프리셋명 검색)',
    example: '프로젝터',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: '통신 프로토콜 필터',
    enum: ['TCP', 'UDP', 'WOL', 'HTTP', 'RS232'],
    example: 'TCP',
  })
  @IsOptional()
  @IsEnum(['TCP', 'UDP', 'WOL', 'HTTP', 'RS232'])
  protocol?: string;
}
