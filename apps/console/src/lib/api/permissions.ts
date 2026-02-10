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

/**
 * 사용자 건물 할당 (전체 교체)
 */
export async function assignBuildings(
  userSeq: number,
  buildingSeqs: number[],
): Promise<{ message: string; assignedBuildings: string[] }> {
  return await apiClient(`/permissions/${userSeq}/buildings`, {
    method: 'PUT',
    body: { buildingSeqs },
  });
}
