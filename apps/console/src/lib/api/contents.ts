import { apiClient } from './client';
import type {
  Content,
  ContentListItem,
  CreateContentDto,
  UpdateContentDto,
  ApiResponse,
} from '@ku/types';

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * 콘텐츠 목록 조회 Query Parameters
 */
export interface GetContentsParams {
  page?: number;
  limit?: number;
  type?: 'VIDEO' | 'IMAGE' | 'HTML' | 'STREAM';
  search?: string;
}

/**
 * 콘텐츠 목록 조회
 */
export async function getContents(params?: GetContentsParams): Promise<PaginatedResponse<ContentListItem>> {
  const response = await apiClient<ApiResponse<PaginatedResponse<ContentListItem>>>('/contents', {
    method: 'GET',
    params,
  });

  if (!response.success || !response.data) {
    throw new Error('콘텐츠 목록 조회 실패');
  }

  return response.data;
}

/**
 * 콘텐츠 상세 조회
 */
export async function getContent(contentSeq: number): Promise<Content> {
  const response = await apiClient<ApiResponse<Content>>(`/contents/${contentSeq}`, {
    method: 'GET',
  });

  if (!response.success || !response.data) {
    throw new Error('콘텐츠 조회 실패');
  }

  return response.data;
}

/**
 * 콘텐츠 등록 응답
 */
export interface CreateContentResponse {
  content_seq: number;
  content_code: string;
  content_file_path: string | null;
  content_thumbnail: string | null;
  reg_date: string;
}

/**
 * 콘텐츠 등록 (파일 업로드)
 * FormData 형식으로 전송
 */
export async function createContent(data: CreateContentDto, file?: File): Promise<CreateContentResponse> {
  const formData = new FormData();

  formData.append('content_name', data.content_name);
  if (data.content_code) {
    formData.append('content_code', data.content_code);
  }
  formData.append('content_type', data.content_type);

  if (file) {
    formData.append('file', file);
  }

  if (data.content_url) {
    formData.append('content_url', data.content_url);
  }

  if (data.content_duration !== undefined) {
    formData.append('content_duration', String(data.content_duration));
  }

  if (data.content_description) {
    formData.append('content_description', data.content_description);
  }

  const response = await apiClient<ApiResponse<CreateContentResponse>>('/contents', {
    method: 'POST',
    body: formData,
    // ofetch가 FormData를 감지하여 자동으로 Content-Type을 multipart/form-data로 설정
  });

  if (!response.success || !response.data) {
    throw new Error('콘텐츠 등록 실패');
  }

  return response.data;
}

/**
 * 콘텐츠 수정 (파일 업로드 포함)
 * FormData 형식으로 전송
 */
export async function updateContent(contentSeq: number, data: UpdateContentDto, file?: File): Promise<void> {
  const formData = new FormData();

  if (data.content_name) {
    formData.append('content_name', data.content_name);
  }

  if (data.content_type) {
    formData.append('content_type', data.content_type);
  }

  if (file) {
    formData.append('file', file);
  }

  if (data.content_url) {
    formData.append('content_url', data.content_url);
  }

  if (data.content_duration !== undefined) {
    formData.append('content_duration', String(data.content_duration));
  }

  if (data.content_description) {
    formData.append('content_description', data.content_description);
  }

  if (data.content_order !== undefined) {
    formData.append('content_order', String(data.content_order));
  }

  const response = await apiClient<ApiResponse>(`/contents/${contentSeq}`, {
    method: 'PUT',
    body: formData,
    // ofetch가 FormData를 감지하여 자동으로 Content-Type을 multipart/form-data로 설정
  });

  if (!response.success) {
    throw new Error('콘텐츠 수정 실패');
  }
}

/**
 * 콘텐츠 삭제 (소프트 삭제)
 */
export async function deleteContent(contentSeq: number): Promise<void> {
  const response = await apiClient<ApiResponse>(`/contents/${contentSeq}`, {
    method: 'DELETE',
  });

  if (!response.success) {
    throw new Error('콘텐츠 삭제 실패');
  }
}
