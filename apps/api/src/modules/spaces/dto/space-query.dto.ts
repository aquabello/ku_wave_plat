import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

export class SpaceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '통합 검색 (공간명, 공간코드)', example: '101' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '층 필터', example: '1' })
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiPropertyOptional({ description: '공간 유형 필터', example: '강의실' })
  @IsOptional()
  @IsString()
  spaceType?: string;
}
