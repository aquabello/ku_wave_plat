/**
 * 플레이어 상태
 */
export type PlayerStatus = 'ONLINE' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE';

/**
 * 플레이어 승인 상태
 */
export type PlayerApproval = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * 플레이어 화면 방향
 */
export type PlayerOrientation = 'LANDSCAPE' | 'PORTRAIT';

/**
 * 플레이어 목록 아이템 (목록 조회용)
 */
export interface PlayerListItem {
  player_seq: number;
  player_name: string;
  player_code: string;
  player_did: string | null;
  player_mac: string | null;
  player_ip: string;
  player_port: number;
  player_status: PlayerStatus;
  player_approval: PlayerApproval;
  last_heartbeat_at: string | null; // ISO 8601
  building: {
    building_seq: number;
    building_name: string;
    building_code: string;
  };
  space: {
    space_seq: number;
    space_name: string;
  } | null;
  player_orientation: PlayerOrientation;
  player_description: string | null;
  playlist: {
    playlist_seq: number;
    playlist_name: string;
  } | null;
  reg_date: string; // ISO 8601
  upd_date: string; // ISO 8601
}

/**
 * 플레이어 상세 정보
 */
export interface Player {
  player_seq: number;
  player_name: string;
  player_code: string;
  player_did: string | null;
  player_mac: string | null;
  building_seq: number;
  space_seq: number | null;
  playlist_seq: number | null;
  player_ip: string;
  player_port: number;
  player_api_key: string;
  player_approval: PlayerApproval;
  approved_by: number | null;
  approved_at: string | null; // ISO 8601
  reject_reason: string | null;
  player_status: PlayerStatus;
  last_heartbeat_at: string | null; // ISO 8601
  last_content_played: string | null;
  player_version: string | null;
  player_resolution: string | null;
  player_orientation: PlayerOrientation;
  player_description: string | null;
  player_order: number;
  player_isdel: 'Y' | 'N';
  reg_date: string; // ISO 8601
  upd_date: string; // ISO 8601
  building: {
    building_seq: number;
    building_name: string;
    building_code: string;
    building_location: string | null;
  };
  space: {
    space_seq: number;
    space_name: string;
  } | null;
  playlist: {
    playlist_seq: number;
    playlist_name: string;
    playlist_code: string;
  } | null;
  approver: {
    tu_seq: number;
    tu_name: string;
    tu_email: string;
  } | null;
}

/**
 * 플레이어 등록 DTO
 */
export interface CreatePlayerDto {
  player_name: string;
  player_code?: string; // 선택값 - 미입력 시 자동 생성 (PLAYER-{timestamp}-{random})
  player_did?: string;
  player_mac?: string;
  building_seq: number;
  space_seq?: number;
  player_ip: string;
  player_port?: number;
  player_resolution?: string;
  player_orientation?: PlayerOrientation;
  player_description?: string;
}

/**
 * 플레이어 수정 DTO
 */
export interface UpdatePlayerDto {
  player_name?: string;
  player_did?: string;
  player_mac?: string;
  building_seq?: number;
  space_seq?: number;
  playlist_seq?: number;
  player_ip?: string;
  player_port?: number;
  player_resolution?: string;
  player_orientation?: PlayerOrientation;
  player_description?: string;
  player_order?: number;
}

/**
 * Health Check 요청 DTO (플레이어 → 서버)
 */
export interface HeartbeatDto {
  player_seq: number;
  player_version?: string;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  current_playlist?: number;
  current_content?: string;
  error_message?: string;
}

/**
 * Health Check 응답
 */
export interface HeartbeatResponse {
  player_seq: number;
  player_status: PlayerStatus;
  last_heartbeat_at: string; // ISO 8601
  should_update_playlist: boolean;
  new_playlist_seq?: number;
}

/**
 * Health Check 로그 아이템
 */
export interface HeartbeatLog {
  heartbeat_seq: number;
  player_seq: number;
  heartbeat_at: string; // ISO 8601
  player_ip: string | null;
  player_version: string | null;
  cpu_usage: number | null;
  memory_usage: number | null;
  disk_usage: number | null;
  current_playlist: number | null;
  current_content: string | null;
  error_message: string | null;
}
