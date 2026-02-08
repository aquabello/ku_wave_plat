import apiClient from './client';
import type { GNBMenuItem, UserMenuResponse, UpdateUserMenusRequest } from '@ku/types';

/**
 * 전체 메뉴 트리 조회 (GNB → LNB)
 */
export async function getMenuTree(): Promise<GNBMenuItem[]> {
  return await apiClient<GNBMenuItem[]>('/menus');
}

/**
 * 사용자별 메뉴 권한 조회
 */
export async function getUserMenus(userSeq: number): Promise<UserMenuResponse> {
  return await apiClient<UserMenuResponse>(`/menus/users/${userSeq}`);
}

/**
 * 사용자별 메뉴 권한 일괄 저장
 */
export async function updateUserMenus(
  userSeq: number,
  data: UpdateUserMenusRequest,
): Promise<UserMenuResponse> {
  return await apiClient<UserMenuResponse>(`/menus/users/${userSeq}`, {
    method: 'PUT',
    body: data,
  });
}
