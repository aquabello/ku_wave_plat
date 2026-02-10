import { ofetch, FetchError } from 'ofetch';
import type { FetchOptions, ResponseType } from 'ofetch';
import { useNavigationStore } from '@/stores/navigation';
import { refreshTokens } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Refresh Token으로 새 토큰 쌍 발급 시도
 * 동시 요청 시 하나의 refresh만 실행 (중복 방지)
 */
async function tryRefreshToken(): Promise<boolean> {
  const storedRefreshToken = localStorage.getItem('refresh_token');
  if (!storedRefreshToken) return false;

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const result = await refreshTokens(storedRefreshToken);
      localStorage.setItem('access_token', result.accessToken);
      localStorage.setItem('refresh_token', result.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * 강제 로그아웃 처리
 */
function forceLogout(reason: string) {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  useNavigationStore.getState().clearMenus();

  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    sessionStorage.setItem('logout_reason', reason);
    window.location.href = '/login';
  }
}

/**
 * 내부 ofetch 인스턴스 (retry 없음)
 */
const rawClient = ofetch.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {},
  onRequest({ options }) {
    const token = localStorage.getItem('access_token');
    if (token) {
      options.headers.set('Authorization', `Bearer ${token}`);
    }
  },
});

/**
 * API Client 래퍼 - 401 시 refresh 후 재시도
 */
async function apiClient<T>(url: string, options?: FetchOptions<ResponseType>): Promise<T> {
  try {
    return await rawClient<T>(url, options as FetchOptions<'json'>);
  } catch (error) {
    if (error instanceof FetchError && error.statusCode === 401) {
      const message = error.data?.message || '';
      const isPermissionChanged =
        typeof message === 'string' && message.includes('권한이 변경되었습니다');

      // 권한 변경 → refresh 불가, 즉시 로그아웃
      if (isPermissionChanged) {
        forceLogout('permission_changed');
        throw error;
      }

      // Refresh Token으로 갱신 시도
      const refreshed = await tryRefreshToken();

      if (refreshed) {
        // 새 토큰으로 재시도 (rawClient가 onRequest에서 새 토큰 자동 주입)
        return await rawClient<T>(url, options as FetchOptions<'json'>);
      }

      // Refresh 실패 → 로그아웃
      forceLogout('session_expired');
    }

    throw error;
  }
}

export { apiClient, FetchError };
export default apiClient;
