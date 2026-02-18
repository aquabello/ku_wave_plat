import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '@common/dto/pagination-query.dto';

export class ListPlayersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: '건물 필터', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  building_seq?: number;

  @ApiPropertyOptional({ description: '상태 필터', enum: ['ONLINE', 'OFFLINE', 'ERROR', 'MAINTENANCE'] })
  @IsOptional()
  @IsEnum(['ONLINE', 'OFFLINE', 'ERROR', 'MAINTENANCE'])
  status?: 'ONLINE' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE';

  @ApiPropertyOptional({ description: '승인 상태 필터', enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED'])
  approval?: 'PENDING' | 'APPROVED' | 'REJECTED';

  @ApiPropertyOptional({ description: '검색어 (플레이어명, 코드)', example: 'PLAYER-001' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '정렬', example: 'player_order' })
  @IsOptional()
  @IsString()
  sort?: string;
}
