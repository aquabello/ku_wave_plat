import { apiClient } from './client';
import type {
  Playlist,
  PlaylistListItem,
  CreatePlaylistDto,
  UpdatePlaylistDto,
  ApiResponse,
} from '@ku/types';

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
 * 플레이리스트 목록 조회 Query Parameters
 */
export interface GetPlaylistsParams {
  page?: number;
  limit?: number;
  type?: 'NORMAL' | 'EMERGENCY' | 'ANNOUNCEMENT';
  search?: string;
}

/**
 * 플레이리스트 목록 조회
 */
export async function getPlaylists(params?: GetPlaylistsParams): Promise<PaginatedResponse<PlaylistListItem>> {
  const response = await apiClient<ApiResponse<PaginatedResponse<PlaylistListItem>>>('/playlists', {
    method: 'GET',
    params,
  });

  if (!response.success || !response.data) {
    throw new Error('플레이리스트 목록 조회 실패');
  }

  return response.data;
}

/**
 * 플레이리스트 상세 조회
 */
export async function getPlaylist(playlistSeq: number): Promise<Playlist> {
  const response = await apiClient<ApiResponse<Playlist>>(`/playlists/${playlistSeq}`, {
    method: 'GET',
  });

  if (!response.success || !response.data) {
    throw new Error('플레이리스트 조회 실패');
  }

  return response.data;
}

/**
 * 플레이리스트 등록 응답
 */
export interface CreatePlaylistResponse {
  playlist_seq: number;
  playlist_code: string;
  reg_date: string;
}

/**
 * 플레이리스트 등록
 */
export async function createPlaylist(data: CreatePlaylistDto): Promise<CreatePlaylistResponse> {
  const response = await apiClient<ApiResponse<CreatePlaylistResponse>>('/playlists', {
    method: 'POST',
    body: data,
  });

  if (!response.success || !response.data) {
    throw new Error('플레이리스트 등록 실패');
  }

  return response.data;
}

/**
 * 플레이리스트 수정
 */
export async function updatePlaylist(playlistSeq: number, data: UpdatePlaylistDto): Promise<void> {
  const response = await apiClient<ApiResponse>(`/playlists/${playlistSeq}`, {
    method: 'PUT',
    body: data,
  });

  if (!response.success) {
    throw new Error('플레이리스트 수정 실패');
  }
}

/**
 * 플레이리스트 삭제 (소프트 삭제)
 */
export async function deletePlaylist(playlistSeq: number): Promise<void> {
  const response = await apiClient<ApiResponse>(`/playlists/${playlistSeq}`, {
    method: 'DELETE',
  });

  if (!response.success) {
    throw new Error('플레이리스트 삭제 실패');
  }
}
