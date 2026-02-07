import apiClient from './client';
import type { PermissionListResponse } from '@ku/types';

/**
 * 권한 목록 조회 (페이징)
 */
export async function getPermissions(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PermissionListResponse> {
  return await apiClient<PermissionListResponse>('/permissions', {
    params,
  });
}
