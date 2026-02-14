import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPlayers,
  getPlayer,
  createPlayer,
  updatePlayer,
  deletePlayer,
  approvePlayer,
  rejectPlayer,
  getHeartbeatLogs,
  type GetPlayersParams,
  type GetHeartbeatLogsParams,
} from '@/lib/api/players';
import type { CreatePlayerDto, UpdatePlayerDto } from '@ku/types';
import { useToast } from '@/hooks/use-toast';

// Query Keys
export const playerKeys = {
  all: ['players'] as const,
  lists: () => [...playerKeys.all, 'list'] as const,
  list: (params?: GetPlayersParams) => [...playerKeys.lists(), params] as const,
  details: () => [...playerKeys.all, 'detail'] as const,
  detail: (id: number) => [...playerKeys.details(), id] as const,
  heartbeatLogs: (id: number, params?: GetHeartbeatLogsParams) =>
    [...playerKeys.detail(id), 'heartbeat-logs', params] as const,
};

/**
 * 플레이어 목록 조회
 */
export function usePlayersQuery(params?: GetPlayersParams) {
  return useQuery({
    queryKey: playerKeys.list(params),
    queryFn: () => getPlayers(params),
  });
}

/**
 * 플레이어 상세 조회
 */
export function usePlayerQuery(playerSeq: number, enabled = true) {
  return useQuery({
    queryKey: playerKeys.detail(playerSeq),
    queryFn: () => getPlayer(playerSeq),
    enabled,
  });
}

/**
 * 플레이어 등록
 */
export function useCreatePlayerMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreatePlayerDto) => createPlayer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playerKeys.lists() });
      toast({
        title: '플레이어 등록 완료',
        description: '플레이어가 성공적으로 등록되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: '플레이어 등록 실패',
        description: error.message,
      });
    },
  });
}

/**
 * 플레이어 수정
 */
export function useUpdatePlayerMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ playerSeq, data }: { playerSeq: number; data: UpdatePlayerDto }) =>
      updatePlayer(playerSeq, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: playerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: playerKeys.detail(variables.playerSeq) });
      toast({
        title: '플레이어 수정 완료',
        description: '플레이어 정보가 수정되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: '플레이어 수정 실패',
        description: error.message,
      });
    },
  });
}

/**
 * 플레이어 삭제
 */
export function useDeletePlayerMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (playerSeq: number) => deletePlayer(playerSeq),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: playerKeys.lists() });
      toast({
        title: '플레이어 삭제 완료',
        description: '플레이어가 삭제되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: '플레이어 삭제 실패',
        description: error.message,
      });
    },
  });
}

/**
 * 플레이어 승인
 */
export function useApprovePlayerMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (playerSeq: number) => approvePlayer(playerSeq),
    onSuccess: (_, playerSeq) => {
      queryClient.invalidateQueries({ queryKey: playerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: playerKeys.detail(playerSeq) });
      toast({
        title: '플레이어 승인 완료',
        description: '플레이어가 승인되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: '플레이어 승인 실패',
        description: error.message,
      });
    },
  });
}

/**
 * 플레이어 반려
 */
export function useRejectPlayerMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ playerSeq, rejectReason }: { playerSeq: number; rejectReason: string }) =>
      rejectPlayer(playerSeq, rejectReason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: playerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: playerKeys.detail(variables.playerSeq) });
      toast({
        title: '플레이어 반려 완료',
        description: '플레이어가 반려되었습니다.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: '플레이어 반려 실패',
        description: error.message,
      });
    },
  });
}

/**
 * Health Check 로그 조회
 */
export function useHeartbeatLogsQuery(
  playerSeq: number,
  params?: GetHeartbeatLogsParams,
  enabled = true
) {
  return useQuery({
    queryKey: playerKeys.heartbeatLogs(playerSeq, params),
    queryFn: () => getHeartbeatLogs(playerSeq, params),
    enabled,
  });
}
