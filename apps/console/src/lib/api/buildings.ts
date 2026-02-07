import apiClient from './client';
import type {
  BuildingListResponse,
  CreateBuildingDto,
  UpdateBuildingDto,
} from '@ku/types';

/**
 * 건물 리스트 조회 (페이징)
 */
export async function getBuildings(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<BuildingListResponse> {
  return await apiClient<BuildingListResponse>('/buildings', {
    params,
  });
}

/**
 * 건물 등록
 */
export async function createBuilding(
  dto: CreateBuildingDto,
): Promise<void> {
  await apiClient('/buildings', {
    method: 'POST',
    body: dto,
  });
}

/**
 * 건물 수정
 */
export async function updateBuilding(
  seq: number,
  dto: UpdateBuildingDto,
): Promise<void> {
  await apiClient(`/buildings/${seq}`, {
    method: 'PUT',
    body: dto,
  });
}

/**
 * 건물 삭제 (소프트 삭제)
 */
export async function deleteBuilding(seq: number): Promise<void> {
  await apiClient(`/buildings/${seq}`, {
    method: 'DELETE',
  });
}
