import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

export class BuildingQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '통합 검색 (건물명, 건물코드)', example: '공학관' })
  @IsOptional()
  @IsString()
  search?: string;
}
