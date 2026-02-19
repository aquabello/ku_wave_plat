import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getContentApprovals,
  approveContent,
  rejectContent,
  cancelApproval,
  getApprovalHistory,
} from '@/lib/api/content-approvals';
import type { ContentApprovalFilter } from '@ku/types';

/**
 * Query Keys
 */
export const contentApprovalKeys = {
  all: ['content-approvals'] as const,
  lists: () => [...contentApprovalKeys.all, 'list'] as const,
  list: (filter?: ContentApprovalFilter) =>
    [...contentApprovalKeys.lists(), filter] as const,
  history: (plcSeq: number) =>
    [...contentApprovalKeys.all, 'history', plcSeq] as const,
};

/**
 * 콘텐츠 승인 목록 + 통계 조회
 */
export function useContentApprovalsQuery(filter?: ContentApprovalFilter) {
  return useQuery({
    queryKey: contentApprovalKeys.list(filter),
    queryFn: () => getContentApprovals(filter),
  });
}

/**
 * 콘텐츠 승인
 */
export function useApproveContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plcSeq: number) => approveContent(plcSeq),
    onSuccess: () => {
      toast.success('콘텐츠가 승인되었습니다.');
      queryClient.invalidateQueries({ queryKey: contentApprovalKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || '승인 처리에 실패했습니다.');
    },
  });
}

/**
 * 콘텐츠 반려
 */
export function useRejectContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ plcSeq, reason }: { plcSeq: number; reason: string }) =>
      rejectContent(plcSeq, reason),
    onSuccess: () => {
      toast.success('콘텐츠가 반려되었습니다.');
      queryClient.invalidateQueries({ queryKey: contentApprovalKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || '반려 처리에 실패했습니다.');
    },
  });
}

/**
 * 승인/반려 취소
 */
export function useCancelApprovalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plcSeq: number) => cancelApproval(plcSeq),
    onSuccess: () => {
      toast.success('승인이 취소되었습니다.');
      queryClient.invalidateQueries({ queryKey: contentApprovalKeys.all });
    },
    onError: (error: Error) => {
      toast.error(error.message || '취소 처리에 실패했습니다.');
    },
  });
}

/**
 * 승인 이력 조회
 */
export function useApprovalHistoryQuery(plcSeq: number | null) {
  return useQuery({
    queryKey: plcSeq !== null ? contentApprovalKeys.history(plcSeq) : ['content-approvals', 'history', null],
    queryFn: () => getApprovalHistory(plcSeq!),
    enabled: plcSeq !== null,
  });
}
