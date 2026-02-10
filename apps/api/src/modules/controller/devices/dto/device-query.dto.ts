import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsInt, IsString, Min } from 'class-validator';

export class DeviceQueryDto {
  @ApiProperty({ description: '건물 시퀀스 (필수)', example: 1 })
  @IsNotEmpty({ message: '건물 시퀀스는 필수입니다' })
  @Type(() => Number)
  @IsInt()
  buildingSeq: number;

  @ApiPropertyOptional({ description: '공간 시퀀스 (필터)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  spaceSeq?: number;

  @ApiPropertyOptional({ description: '페이지 번호', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '페이지당 항목 수', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: '검색어 (장비명, 프리셋명)', example: '프로젝터' })
  @IsOptional()
  @IsString()
  search?: string;
}
