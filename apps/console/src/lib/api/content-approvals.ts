import { apiClient } from './client';
import type {
  ApiResponse,
  ContentApprovalListResponse,
  ContentApprovalFilter,
  ContentApprovalHistoryItem,
} from '@ku/types';

const BASE = '/content-approvals';

/** 콘텐츠 승인 목록 + 통계 조회 */
export async function getContentApprovals(
  filter?: ContentApprovalFilter,
): Promise<ContentApprovalListResponse> {
  const response = await apiClient<ApiResponse<ContentApprovalListResponse>>(BASE, {
    params: filter as Record<string, string | number | undefined>,
  });

  if (!response.success || !response.data) {
    throw new Error('콘텐츠 승인 목록 조회 실패');
  }

  return response.data;
}

/** 콘텐츠 승인 */
export async function approveContent(plcSeq: number): Promise<void> {
  const response = await apiClient<ApiResponse>(`${BASE}/${plcSeq}/approve`, {
    method: 'PATCH',
  });

  if (!response.success) {
    throw new Error('승인 처리 실패');
  }
}

/** 콘텐츠 반려 */
export async function rejectContent(plcSeq: number, reason: string): Promise<void> {
  const response = await apiClient<ApiResponse>(`${BASE}/${plcSeq}/reject`, {
    method: 'PATCH',
    body: { reason },
  });

  if (!response.success) {
    throw new Error('반려 처리 실패');
  }
}

/** 승인/반려 취소 */
export async function cancelApproval(plcSeq: number): Promise<void> {
  const response = await apiClient<ApiResponse>(`${BASE}/${plcSeq}/cancel`, {
    method: 'PATCH',
  });

  if (!response.success) {
    throw new Error('취소 처리 실패');
  }
}

/** 승인 이력 조회 */
export async function getApprovalHistory(
  plcSeq: number,
): Promise<ContentApprovalHistoryItem[]> {
  const response = await apiClient<ApiResponse<ContentApprovalHistoryItem[]>>(
    `${BASE}/${plcSeq}/history`,
  );

  if (!response.success || !response.data) {
    throw new Error('승인 이력 조회 실패');
  }

  return response.data;
}
