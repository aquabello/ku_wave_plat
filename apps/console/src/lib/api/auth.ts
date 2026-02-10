import apiClient from './client';
import type { LoginDto, LoginResponse, RefreshResponse } from '@ku/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function login(dto: LoginDto): Promise<LoginResponse> {
  return await apiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body: dto,
  });
}

/**
 * Refresh Token으로 새 토큰 쌍 발급 (Public API)
 * apiClient를 우회하여 raw fetch 사용 → 401 인터셉터 순환 방지
 */
export async function refreshTokens(refreshToken: string): Promise<RefreshResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    throw new Error('Token refresh failed');
  }

  return res.json();
}

export async function logout(): Promise<void> {
  await apiClient('/auth/logout', {
    method: 'POST',
  });
}
