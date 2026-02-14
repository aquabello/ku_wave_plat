import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsInt, MaxLength } from 'class-validator';

export class UpdateContentDto {
  @ApiPropertyOptional({ description: '콘텐츠명', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  content_name?: string;

  @ApiPropertyOptional({ description: '콘텐츠 타입', enum: ['VIDEO', 'IMAGE', 'HTML', 'STREAM'] })
  @IsOptional()
  @IsEnum(['VIDEO', 'IMAGE', 'HTML', 'STREAM'])
  content_type?: 'VIDEO' | 'IMAGE' | 'HTML' | 'STREAM';

  @ApiPropertyOptional({ description: '외부 URL' })
  @IsOptional()
  @IsString()
  content_url?: string;

  @ApiPropertyOptional({ description: '재생 시간 (초)' })
  @IsOptional()
  @IsInt()
  content_duration?: number;

  @ApiPropertyOptional({ description: '지원 화면 방향', enum: ['LANDSCAPE', 'PORTRAIT', 'BOTH'] })
  @IsOptional()
  @IsEnum(['LANDSCAPE', 'PORTRAIT', 'BOTH'])
  content_orientation?: 'LANDSCAPE' | 'PORTRAIT' | 'BOTH';

  @ApiPropertyOptional({ description: '카테고리', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  content_category?: string;

  @ApiPropertyOptional({ description: '태그 (쉼표 구분)', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  content_tags?: string;

  @ApiPropertyOptional({ description: '유효 시작일시 (ISO 8601)' })
  @IsOptional()
  @IsString()
  valid_from?: string;

  @ApiPropertyOptional({ description: '유효 종료일시 (ISO 8601)' })
  @IsOptional()
  @IsString()
  valid_to?: string;

  @ApiPropertyOptional({ description: '사용 상태', enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  content_status?: 'ACTIVE' | 'INACTIVE';

  @ApiPropertyOptional({ description: '콘텐츠 설명' })
  @IsOptional()
  @IsString()
  content_description?: string;

  @ApiPropertyOptional({ description: '정렬 순서' })
  @IsOptional()
  @IsInt()
  content_order?: number;
}
