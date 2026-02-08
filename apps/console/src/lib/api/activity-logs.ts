import apiClient from './client';
import type { ActivityLogListResponse, ActivityLogDetail, ActivityLogQueryParams } from '@ku/types';

/**
 * 활동 로그 목록 조회 (페이징)
 */
export async function getActivityLogs(params?: ActivityLogQueryParams): Promise<ActivityLogListResponse> {
  return await apiClient<ActivityLogListResponse>('/activity-logs', {
    params,
  });
}

/**
 * 활동 로그 상세 조회
 */
export async function getActivityLogDetail(logSeq: number): Promise<ActivityLogDetail> {
  return await apiClient<ActivityLogDetail>(`/activity-logs/${logSeq}`);
}
