import { ofetch, FetchError } from 'ofetch';
import { useNavigationStore } from '@/stores/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = ofetch.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {},
  onRequest({ options }) {
    const token = localStorage.getItem('access_token');
    if (token) {
      options.headers.set('Authorization', `Bearer ${token}`);
    }
  },
  onResponseError({ response }) {
    if (response.status === 401) {
      const message = response._data?.message || '';
      const isPermissionChanged =
        typeof message === 'string' && message.includes('권한이 변경되었습니다');

      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      useNavigationStore.getState().clearMenus();

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        if (isPermissionChanged) {
          sessionStorage.setItem('logout_reason', 'permission_changed');
        } else {
          sessionStorage.setItem('logout_reason', 'session_expired');
        }
        window.location.href = '/login';
      }
    }
  },
});

export { FetchError };
export default apiClient;
