import { ofetch, FetchError } from 'ofetch';

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
      localStorage.removeItem('access_token');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  },
});

export { FetchError };
export default apiClient;
