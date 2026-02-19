import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsArray, ValidateNested, IsInt, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

class PlaylistContentDto {
  @ApiPropertyOptional({ description: '콘텐츠 시퀀스' })
  @IsInt()
  content_seq: number;

  @ApiPropertyOptional({ description: '재생 순서' })
  @IsInt()
  play_order: number;

  @ApiPropertyOptional({ description: '재생 시간 오버라이드 (초)' })
  @IsOptional()
  @IsInt()
  play_duration?: number;

  @ApiPropertyOptional({ description: '전환 효과' })
  @IsOptional()
  @IsString()
  transition_effect?: string;

  @ApiPropertyOptional({ description: '전환 시간 (밀리초)' })
  @IsOptional()
  @IsInt()
  transition_duration?: number;

  @ApiPropertyOptional({ description: '영역 번호 (1~8)' })
  @IsOptional()
  @IsInt()
  zone_number?: number;

  @ApiPropertyOptional({ description: '영역 너비 (%)' })
  @IsOptional()
  zone_width?: number;

  @ApiPropertyOptional({ description: '영역 높이 (%)' })
  @IsOptional()
  zone_height?: number;

  @ApiPropertyOptional({ description: 'X 좌표 (%)' })
  @IsOptional()
  zone_x_position?: number;

  @ApiPropertyOptional({ description: 'Y 좌표 (%)' })
  @IsOptional()
  zone_y_position?: number;
}

export class UpdatePlaylistDto {
  @ApiPropertyOptional({ description: '플레이리스트명', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  playlist_name?: string;

  @ApiPropertyOptional({ description: '플레이리스트 유형', enum: ['NORMAL', 'EMERGENCY', 'ANNOUNCEMENT'] })
  @IsOptional()
  @IsEnum(['NORMAL', 'EMERGENCY', 'ANNOUNCEMENT'])
  playlist_type?: 'NORMAL' | 'EMERGENCY' | 'ANNOUNCEMENT';

  @ApiPropertyOptional({ description: '우선순위 (0-99)' })
  @IsOptional()
  @IsInt()
  playlist_priority?: number;

  @ApiPropertyOptional({ description: '반복 재생 여부', enum: ['Y', 'N'] })
  @IsOptional()
  @IsEnum(['Y', 'N'])
  playlist_loop?: 'Y' | 'N';

  @ApiPropertyOptional({ description: '랜덤 재생 여부', enum: ['Y', 'N'] })
  @IsOptional()
  @IsEnum(['Y', 'N'])
  playlist_random?: 'Y' | 'N';

  @ApiPropertyOptional({ description: '화면 분할 레이아웃', enum: ['1x1', '1x2', '1x4', '1x8'] })
  @IsOptional()
  @IsEnum(['1x1', '1x2', '1x4', '1x8'])
  playlist_screen_layout?: '1x1' | '1x2' | '1x4' | '1x8';

  @ApiPropertyOptional({ description: '사용 상태', enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  playlist_status?: 'ACTIVE' | 'INACTIVE';

  @ApiPropertyOptional({ description: '플레이리스트 설명' })
  @IsOptional()
  @IsString()
  playlist_description?: string;

  @ApiPropertyOptional({ description: '정렬 순서' })
  @IsOptional()
  @IsInt()
  playlist_order?: number;

  @ApiPropertyOptional({ description: '콘텐츠 매핑 목록 (전체 교체)', type: [PlaylistContentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlaylistContentDto)
  contents?: PlaylistContentDto[];
}
