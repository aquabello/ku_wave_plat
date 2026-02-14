import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

export class ListContentsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '콘텐츠 타입 필터', enum: ['VIDEO', 'IMAGE', 'HTML', 'STREAM'] })
  @IsOptional()
  @IsEnum(['VIDEO', 'IMAGE', 'HTML', 'STREAM'])
  type?: 'VIDEO' | 'IMAGE' | 'HTML' | 'STREAM';

  @ApiPropertyOptional({ description: '검색어 (콘텐츠명, 코드)', example: 'CONTENT-001' })
  @IsOptional()
  @IsString()
  search?: string;
}
