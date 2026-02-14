import { apiClient } from './client';
import type {
  Player,
  PlayerListItem,
  CreatePlayerDto,
  UpdatePlayerDto,
  ApiResponse,
  HeartbeatLog,
} from '@ku/types';

/**
 * 플레이어 목록 조회 Query Parameters
 */
export interface GetPlayersParams {
  page?: number;
  limit?: number;
  building_seq?: number;
  status?: 'ONLINE' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE';
  approval?: 'PENDING' | 'APPROVED' | 'REJECTED';
  search?: string;
  sort?: string;
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * 플레이어 목록 조회
 */
export async function getPlayers(params?: GetPlayersParams): Promise<PaginatedResponse<PlayerListItem>> {
  const response = await apiClient<ApiResponse<PaginatedResponse<PlayerListItem>>>('/players', {
    method: 'GET',
    params,
  });

  if (!response.success || !response.data) {
    throw new Error('플레이어 목록 조회 실패');
  }

  return response.data;
}

/**
 * 플레이어 상세 조회
 */
export async function getPlayer(playerSeq: number): Promise<Player> {
  const response = await apiClient<ApiResponse<Player>>(`/players/${playerSeq}`, {
    method: 'GET',
  });

  if (!response.success || !response.data) {
    throw new Error('플레이어 조회 실패');
  }

  return response.data;
}

/**
 * 플레이어 등록 응답
 */
export interface CreatePlayerResponse {
  player_seq: number;
  player_code: string;
  player_api_key: string;
  player_approval: 'PENDING';
  reg_date: string;
}

/**
 * 플레이어 등록
 */
export async function createPlayer(data: CreatePlayerDto): Promise<CreatePlayerResponse> {
  const response = await apiClient<ApiResponse<CreatePlayerResponse>>('/players', {
    method: 'POST',
    body: data,
  });

  if (!response.success || !response.data) {
    throw new Error('플레이어 등록 실패');
  }

  return response.data;
}

/**
 * 플레이어 수정
 */
export async function updatePlayer(playerSeq: number, data: UpdatePlayerDto): Promise<void> {
  const response = await apiClient<ApiResponse>(`/players/${playerSeq}`, {
    method: 'PUT',
    body: data,
  });

  if (!response.success) {
    throw new Error('플레이어 수정 실패');
  }
}

/**
 * 플레이어 삭제 (소프트 삭제)
 */
export async function deletePlayer(playerSeq: number): Promise<void> {
  const response = await apiClient<ApiResponse>(`/players/${playerSeq}`, {
    method: 'DELETE',
  });

  if (!response.success) {
    throw new Error('플레이어 삭제 실패');
  }
}

/**
 * 플레이어 승인
 */
export async function approvePlayer(playerSeq: number): Promise<void> {
  const response = await apiClient<ApiResponse>(`/players/${playerSeq}/approve`, {
    method: 'POST',
  });

  if (!response.success) {
    throw new Error('플레이어 승인 실패');
  }
}

/**
 * 플레이어 반려
 */
export async function rejectPlayer(playerSeq: number, rejectReason: string): Promise<void> {
  const response = await apiClient<ApiResponse>(`/players/${playerSeq}/reject`, {
    method: 'POST',
    body: { reject_reason: rejectReason },
  });

  if (!response.success) {
    throw new Error('플레이어 반려 실패');
  }
}

/**
 * Health Check 로그 조회 Query Parameters
 */
export interface GetHeartbeatLogsParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

/**
 * Health Check 로그 조회
 */
export async function getHeartbeatLogs(
  playerSeq: number,
  params?: GetHeartbeatLogsParams
): Promise<PaginatedResponse<HeartbeatLog>> {
  const response = await apiClient<ApiResponse<PaginatedResponse<HeartbeatLog>>>(
    `/players/${playerSeq}/heartbeat-logs`,
    {
      method: 'GET',
      params,
    }
  );

  if (!response.success || !response.data) {
    throw new Error('Health Check 로그 조회 실패');
  }

  return response.data;
}
