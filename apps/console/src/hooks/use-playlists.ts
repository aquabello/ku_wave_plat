import { useQuery } from '@tanstack/react-query';
import { getPlaylists } from '@/lib/api/playlists';

/**
 * Query Keys
 */
export const playlistKeys = {
  all: ['playlists'] as const,
  lists: () => [...playlistKeys.all, 'list'] as const,
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    [...playlistKeys.lists(), params] as const,
};

/**
 * 플레이리스트 목록 조회 (드롭다운용 - 전체 목록)
 */
export function usePlaylistsQuery() {
  return useQuery({
    queryKey: playlistKeys.list({ limit: 100 }), // API 최대값 100
    queryFn: () => getPlaylists({ limit: 100 }),
  });
}
