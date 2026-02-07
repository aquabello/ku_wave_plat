import apiClient from './client';
import type {
  UserListResponse,
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordDto,
} from '@ku/types';

/**
 * 사용자 리스트 조회 (페이징)
 */
export async function getUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<UserListResponse> {
  return await apiClient<UserListResponse>('/users', {
    params,
  });
}

/**
 * 회원 등록
 */
export async function createUser(
  dto: CreateUserDto,
): Promise<{ seq: number }> {
  return await apiClient('/users', {
    method: 'POST',
    body: dto,
  });
}

/**
 * 회원 수정
 */
export async function updateUser(
  seq: number,
  dto: UpdateUserDto,
): Promise<void> {
  await apiClient(`/users/${seq}`, {
    method: 'PUT',
    body: dto,
  });
}

/**
 * 비밀번호 초기화
 */
export async function resetPassword(
  seq: number,
  dto: ResetPasswordDto,
): Promise<void> {
  await apiClient(`/users/${seq}/reset-password`, {
    method: 'PATCH',
    body: dto,
  });
}

/**
 * 회원 삭제 (소프트 삭제)
 */
export async function deleteUser(seq: number): Promise<void> {
  await apiClient(`/users/${seq}`, {
    method: 'DELETE',
  });
}
