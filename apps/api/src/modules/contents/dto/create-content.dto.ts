import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, MaxLength } from 'class-validator';

export class CreateContentDto {
  @ApiProperty({ description: '콘텐츠명', example: '환영 메시지', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  content_name: string;

  @ApiProperty({ description: '콘텐츠 코드', example: 'CONTENT-001', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  content_code: string;

  @ApiProperty({ description: '콘텐츠 타입', enum: ['VIDEO', 'IMAGE', 'HTML', 'STREAM'] })
  @IsEnum(['VIDEO', 'IMAGE', 'HTML', 'STREAM'])
  @IsNotEmpty()
  content_type: 'VIDEO' | 'IMAGE' | 'HTML' | 'STREAM';

  @ApiPropertyOptional({ description: '외부 URL (STREAM 타입)', example: 'https://stream.example.com/video.m3u8' })
  @IsOptional()
  @IsString()
  content_url?: string;

  @ApiPropertyOptional({ description: '재생 시간 (초)', example: 30 })
  @IsOptional()
  @IsInt()
  content_duration?: number;

  @ApiPropertyOptional({ description: '지원 화면 방향', enum: ['LANDSCAPE', 'PORTRAIT', 'BOTH'] })
  @IsOptional()
  @IsEnum(['LANDSCAPE', 'PORTRAIT', 'BOTH'])
  content_orientation?: 'LANDSCAPE' | 'PORTRAIT' | 'BOTH';

  @ApiPropertyOptional({ description: '카테고리', example: '공지사항', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  content_category?: string;

  @ApiPropertyOptional({ description: '태그 (쉼표 구분)', example: '중요,긴급', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  content_tags?: string;

  @ApiPropertyOptional({ description: '유효 시작일시 (ISO 8601)', example: '2026-02-01T00:00:00Z' })
  @IsOptional()
  @IsString()
  valid_from?: string;

  @ApiPropertyOptional({ description: '유효 종료일시 (ISO 8601)', example: '2026-02-28T23:59:59Z' })
  @IsOptional()
  @IsString()
  valid_to?: string;

  @ApiPropertyOptional({ description: '사용 상태', enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  content_status?: 'ACTIVE' | 'INACTIVE';

  @ApiPropertyOptional({ description: '콘텐츠 설명' })
  @IsOptional()
  @IsString()
  content_description?: string;
}
