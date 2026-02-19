import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  type GetPlaylistsParams,
} from '@/lib/api/playlists';
import type { CreatePlaylistDto, UpdatePlaylistDto } from '@ku/types';
import { toast } from 'sonner';

/**
 * Query Keys
 */
export const playlistKeys = {
  all: ['playlists'] as const,
  lists: () => [...playlistKeys.all, 'list'] as const,
  list: (params?: GetPlaylistsParams) =>
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

/**
 * 플레이리스트 목록 조회 (페이지네이션 + 필터)
 */
export function usePlaylistsListQuery(params?: GetPlaylistsParams) {
  return useQuery({
    queryKey: playlistKeys.list(params),
    queryFn: () => getPlaylists(params),
  });
}

/**
 * 플레이리스트 등록
 */
export function useCreatePlaylistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlaylistDto) => createPlaylist(data),
    onSuccess: () => {
      toast.success('플레이리스트가 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || '플레이리스트 등록에 실패했습니다.');
    },
  });
}

/**
 * 플레이리스트 수정
 */
export function useUpdatePlaylistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistSeq, data }: { playlistSeq: number; data: UpdatePlaylistDto }) =>
      updatePlaylist(playlistSeq, data),
    onSuccess: () => {
      toast.success('플레이리스트가 수정되었습니다.');
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || '플레이리스트 수정에 실패했습니다.');
    },
  });
}

/**
 * 플레이리스트 삭제
 */
export function useDeletePlaylistMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playlistSeq: number) => deletePlaylist(playlistSeq),
    onSuccess: () => {
      toast.success('플레이리스트가 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: playlistKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || '플레이리스트 삭제에 실패했습니다.');
    },
  });
}
