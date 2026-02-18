import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

export class ListPlaylistsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '플레이리스트 유형 필터', enum: ['NORMAL', 'EMERGENCY', 'ANNOUNCEMENT'] })
  @IsOptional()
  @IsEnum(['NORMAL', 'EMERGENCY', 'ANNOUNCEMENT'])
  type?: 'NORMAL' | 'EMERGENCY' | 'ANNOUNCEMENT';

  @ApiPropertyOptional({ description: '검색어 (플레이리스트명, 코드)', example: 'PLAYLIST-001' })
  @IsOptional()
  @IsString()
  search?: string;
}
