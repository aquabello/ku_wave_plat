import apiClient from './client';
import type { LoginDto, LoginResponse } from '@ku/types';

export async function login(dto: LoginDto): Promise<LoginResponse> {
  return await apiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body: dto,
  });
}
