/**
 * System Settings Types
 * Shared types for system settings functionality
 */

/** API 원본 응답 (tb_setting 테이블 구조) */
export interface SystemSettingsApiResponse {
  seq: number;
  apiTime: string;
  playerTime: string;
  screenStart: string;
  screenEnd: string;
  playerVer: string;
  playerLink: string;
  watcherVer: string;
  watcherLink: string;
  noticeLink: string;
  introLink: string;
  defaultImage: string | null;
  regDate: string;
}

/** FE 도메인 모델 */
export interface SystemSettings {
  seq: number;
  apiInterval: number;
  executionInterval: number;
  blackoutStartTime: string;
  blackoutEndTime: string;
  defaultImagePath: string | null;
  regDate: string;
}

export interface UpdateSystemSettingsRequest {
  apiInterval: number;
  executionInterval: number;
  blackoutStartTime: string;
  blackoutEndTime: string;
  defaultImagePath?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    timestamp: string;
    path: string;
  };
}
