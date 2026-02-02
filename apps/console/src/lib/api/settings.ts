import apiClient from './client';
import type {
  SystemSettings,
  SystemSettingsApiResponse,
  UpdateSystemSettingsRequest,
} from '@/types/settings';

/**
 * Settings API Client
 * API 필드명(tb_setting)과 FE 도메인 모델 간 변환 처리
 */

/** API 응답 → FE 도메인 모델 변환 */
function toSystemSettings(raw: SystemSettingsApiResponse): SystemSettings {
  return {
    seq: raw.seq,
    apiInterval: parseInt(raw.apiTime, 10),
    executionInterval: parseInt(raw.playerTime, 10),
    blackoutStartTime: raw.screenStart,
    blackoutEndTime: raw.screenEnd,
    defaultImagePath: raw.defaultImage,
    regDate: raw.regDate,
  };
}

/**
 * Get current system settings
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  const data = await apiClient<SystemSettingsApiResponse>('/settings/system');
  return toSystemSettings(data);
}

/**
 * Update system settings (atomic: settings + image in one request)
 * FE 도메인 모델 → API 필드명으로 변환하여 전송
 */
export async function updateSystemSettings(
  data: UpdateSystemSettingsRequest,
  file?: File | null
): Promise<SystemSettings> {
  if (file) {
    const formData = new FormData();
    formData.append('apiTime', String(data.apiInterval).padStart(2, '0'));
    formData.append('playerTime', String(data.executionInterval).padStart(2, '0'));
    formData.append('screenStart', data.blackoutStartTime);
    formData.append('screenEnd', data.blackoutEndTime);
    formData.append('file', file);

    const result = await apiClient<SystemSettingsApiResponse>('/settings/system', {
      method: 'PUT',
      body: formData,
    });
    return toSystemSettings(result);
  }

  const payload = {
    apiTime: String(data.apiInterval).padStart(2, '0'),
    playerTime: String(data.executionInterval).padStart(2, '0'),
    screenStart: data.blackoutStartTime,
    screenEnd: data.blackoutEndTime,
  };

  const result = await apiClient<SystemSettingsApiResponse>('/settings/system', {
    method: 'PUT',
    body: payload,
  });
  return toSystemSettings(result);
}

/**
 * Get full image URL from path
 */
export function getImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  // 정적 파일은 API prefix 없이 서빙되므로 origin만 사용
  const origin = new URL(apiUrl).origin;
  return `${origin}/${imagePath}`;
}
