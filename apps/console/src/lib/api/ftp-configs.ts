import { apiClient } from './client';
import type {
  FtpConfigListItem,
  CreateFtpConfigDto,
  UpdateFtpConfigDto,
  FtpTestResponse,
  ApiResponse,
} from '@ku/types';

export async function getFtpConfigs(): Promise<{ items: FtpConfigListItem[] }> {
  const response = await apiClient<ApiResponse<{ items: FtpConfigListItem[] }>>('/ftp-configs', {
    method: 'GET',
  });
  if (!response.success || !response.data) {
    throw new Error('FTP 설정 목록 조회 실패');
  }
  return response.data;
}

export async function createFtpConfig(data: CreateFtpConfigDto): Promise<FtpConfigListItem> {
  const response = await apiClient<ApiResponse<FtpConfigListItem>>('/ftp-configs', {
    method: 'POST',
    body: data,
  });
  if (!response.success || !response.data) {
    throw new Error('FTP 설정 등록 실패');
  }
  return response.data;
}

export async function updateFtpConfig(ftpConfigSeq: number, data: UpdateFtpConfigDto): Promise<void> {
  const response = await apiClient<ApiResponse>(`/ftp-configs/${ftpConfigSeq}`, {
    method: 'PUT',
    body: data,
  });
  if (!response.success) {
    throw new Error('FTP 설정 수정 실패');
  }
}

export async function deleteFtpConfig(ftpConfigSeq: number): Promise<void> {
  const response = await apiClient<ApiResponse>(`/ftp-configs/${ftpConfigSeq}`, {
    method: 'DELETE',
  });
  if (!response.success) {
    throw new Error('FTP 설정 삭제 실패');
  }
}

export async function testFtpConnection(ftpConfigSeq: number): Promise<FtpTestResponse> {
  const response = await apiClient<ApiResponse<FtpTestResponse>>(`/ftp-configs/${ftpConfigSeq}/test`, {
    method: 'POST',
  });
  if (!response.success || !response.data) {
    throw new Error('FTP 연결 테스트 실패');
  }
  return response.data;
}
