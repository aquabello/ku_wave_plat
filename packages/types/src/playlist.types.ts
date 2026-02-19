/**
 * 플레이리스트 타입
 */
export type PlaylistType = 'NORMAL' | 'EMERGENCY' | 'ANNOUNCEMENT';

/**
 * 화면 분할 레이아웃
 */
export type PlaylistScreenLayout = '1x1' | '1x2' | '1x4' | '1x8';

/**
 * 플레이리스트 사용 상태
 */
export type PlaylistStatus = 'ACTIVE' | 'INACTIVE';

/**
 * 플레이리스트 목록 아이템 (목록 조회용)
 */
export interface PlaylistListItem {
  playlist_seq: number;
  playlist_name: string;
  playlist_code: string;
  playlist_type: PlaylistType;
  playlist_priority: number;
  playlist_duration: number | null;
  playlist_loop: 'Y' | 'N';
  playlist_random: 'Y' | 'N';
  playlist_screen_layout: PlaylistScreenLayout;
  playlist_status: PlaylistStatus;
  playlist_description: string | null;
  content_count: number;
  player_count: number;
  reg_date: string; // ISO 8601
  upd_date: string; // ISO 8601
}

/**
 * 플레이리스트-콘텐츠 매핑
 */
export interface PlaylistContent {
  plc_seq: number;
  content_seq: number;
  content_name: string;
  content_code: string;
  content_type: 'VIDEO' | 'IMAGE' | 'HTML' | 'STREAM';
  content_file_path: string | null;
  content_url: string | null;
  content_duration: number | null;
  play_order: number;
  play_duration: number | null;
  transition_effect: string | null;
  transition_duration: number | null;
  zone_number: number;
  zone_width: number;
  zone_height: number;
  zone_x_position: number;
  zone_y_position: number;
}

/**
 * 플레이리스트 상세 정보
 */
export interface Playlist {
  playlist_seq: number;
  playlist_name: string;
  playlist_code: string;
  playlist_type: PlaylistType;
  playlist_priority: number;
  playlist_duration: number | null;
  playlist_loop: 'Y' | 'N';
  playlist_random: 'Y' | 'N';
  playlist_screen_layout: PlaylistScreenLayout;
  playlist_status: PlaylistStatus;
  playlist_description: string | null;
  playlist_order: number;
  playlist_isdel: 'Y' | 'N';
  reg_date: string; // ISO 8601
  upd_date: string; // ISO 8601
  contents: PlaylistContent[];
}

/**
 * 플레이리스트 등록 DTO
 */
export interface CreatePlaylistDto {
  playlist_name: string;
  playlist_code?: string;
  playlist_type?: PlaylistType;
  playlist_priority?: number;
  playlist_loop?: 'Y' | 'N';
  playlist_random?: 'Y' | 'N';
  playlist_screen_layout?: PlaylistScreenLayout;
  playlist_status?: PlaylistStatus;
  playlist_description?: string;
  contents?: Array<{
    content_seq: number;
    play_order: number;
    play_duration?: number;
    transition_effect?: string;
    transition_duration?: number;
    zone_number?: number;
    zone_width?: number;
    zone_height?: number;
    zone_x_position?: number;
    zone_y_position?: number;
  }>;
}

/**
 * 플레이리스트 수정 DTO
 */
export interface UpdatePlaylistDto {
  playlist_name?: string;
  playlist_type?: PlaylistType;
  playlist_priority?: number;
  playlist_loop?: 'Y' | 'N';
  playlist_random?: 'Y' | 'N';
  playlist_screen_layout?: PlaylistScreenLayout;
  playlist_status?: PlaylistStatus;
  playlist_description?: string;
  playlist_order?: number;
  contents?: Array<{
    content_seq: number;
    play_order: number;
    play_duration?: number;
    transition_effect?: string;
    transition_duration?: number;
    zone_number?: number;
    zone_width?: number;
    zone_height?: number;
    zone_x_position?: number;
    zone_y_position?: number;
  }>;
}
