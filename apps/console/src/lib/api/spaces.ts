import apiClient from './client';
import type {
  SpaceListResponse,
  SpaceDetail,
  CreateSpaceDto,
  UpdateSpaceDto,
} from '@ku/types';

/**
 * 공간 목록 조회 (페이징)
 */
export async function getSpaces(
  buildingSeq: number,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    floor?: string;
    type?: string;
  },
): Promise<SpaceListResponse> {
  return await apiClient<SpaceListResponse>(`/buildings/${buildingSeq}/spaces`, {
    params,
  });
}

/**
 * 공간 상세 조회
 */
export async function getSpace(
  buildingSeq: number,
  spaceSeq: number,
): Promise<SpaceDetail> {
  return await apiClient<SpaceDetail>(`/buildings/${buildingSeq}/spaces/${spaceSeq}`);
}

/**
 * 공간 등록
 */
export async function createSpace(
  buildingSeq: number,
  dto: CreateSpaceDto,
): Promise<SpaceDetail> {
  return await apiClient<SpaceDetail>(`/buildings/${buildingSeq}/spaces`, {
    method: 'POST',
    body: dto,
  });
}

/**
 * 공간 수정
 */
export async function updateSpace(
  buildingSeq: number,
  spaceSeq: number,
  dto: UpdateSpaceDto,
): Promise<SpaceDetail> {
  return await apiClient<SpaceDetail>(`/buildings/${buildingSeq}/spaces/${spaceSeq}`, {
    method: 'PUT',
    body: dto,
  });
}

/**
 * 공간 삭제 (소프트 삭제)
 */
export async function deleteSpace(
  buildingSeq: number,
  spaceSeq: number,
): Promise<void> {
  await apiClient(`/buildings/${buildingSeq}/spaces/${spaceSeq}`, {
    method: 'DELETE',
  });
}
