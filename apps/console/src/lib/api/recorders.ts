import { apiClient } from './client';
import type {
  RecorderListItem,
  RecorderDetail,
  RecorderPresetsResponse,
  RecorderPreset,
  RecorderControlStatus,
  RecorderLogItem,
  CreateRecorderDto,
  UpdateRecorderDto,
  CreateRecorderPresetDto,
  UpdateRecorderPresetDto,
  PtzCommand,
  PtzResponse,
  RecordStartDto,
  RecordStartResponse,
  RecordStopResponse,
  PresetApplyResponse,
  ApiResponse,
} from '@ku/types';

export interface RecorderPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetRecordersParams {
  page?: number;
  limit?: number;
  buildingSeq?: number;
  search?: string;
  status?: 'ONLINE' | 'OFFLINE' | 'ERROR';
}

export interface GetRecorderLogsParams {
  page?: number;
  limit?: number;
  logType?: string;
  resultStatus?: string;
  startDate?: string;
  endDate?: string;
}

// --- Recorder CRUD ---

export async function getRecorders(params?: GetRecordersParams): Promise<RecorderPaginatedResponse<RecorderListItem>> {
  const response = await apiClient<ApiResponse<RecorderPaginatedResponse<RecorderListItem>>>('/recorders', {
    method: 'GET',
    params,
  });
  if (!response.success || !response.data) {
    throw new Error('녹화기 목록 조회 실패');
  }
  return response.data;
}

export async function getRecorder(recorderSeq: number): Promise<RecorderDetail> {
  const response = await apiClient<ApiResponse<RecorderDetail>>(`/recorders/${recorderSeq}`, {
    method: 'GET',
  });
  if (!response.success || !response.data) {
    throw new Error('녹화기 조회 실패');
  }
  return response.data;
}

export async function createRecorder(data: CreateRecorderDto): Promise<RecorderDetail> {
  const response = await apiClient<ApiResponse<RecorderDetail>>('/recorders', {
    method: 'POST',
    body: data,
  });
  if (!response.success || !response.data) {
    throw new Error('녹화기 등록 실패');
  }
  return response.data;
}

export async function updateRecorder(recorderSeq: number, data: UpdateRecorderDto): Promise<void> {
  const response = await apiClient<ApiResponse>(`/recorders/${recorderSeq}`, {
    method: 'PUT',
    body: data,
  });
  if (!response.success) {
    throw new Error('녹화기 수정 실패');
  }
}

export async function deleteRecorder(recorderSeq: number): Promise<void> {
  const response = await apiClient<ApiResponse>(`/recorders/${recorderSeq}`, {
    method: 'DELETE',
  });
  if (!response.success) {
    throw new Error('녹화기 삭제 실패');
  }
}

// --- Preset CRUD ---

export async function getPresets(recorderSeq: number): Promise<RecorderPresetsResponse> {
  const response = await apiClient<ApiResponse<RecorderPresetsResponse>>(`/recorders/${recorderSeq}/presets`, {
    method: 'GET',
  });
  if (!response.success || !response.data) {
    throw new Error('프리셋 목록 조회 실패');
  }
  return response.data;
}

export async function createPreset(recorderSeq: number, data: CreateRecorderPresetDto): Promise<RecorderPreset> {
  const response = await apiClient<ApiResponse<RecorderPreset>>(`/recorders/${recorderSeq}/presets`, {
    method: 'POST',
    body: data,
  });
  if (!response.success || !response.data) {
    throw new Error('프리셋 등록 실패');
  }
  return response.data;
}

export async function updatePreset(recorderSeq: number, recPresetSeq: number, data: UpdateRecorderPresetDto): Promise<void> {
  const response = await apiClient<ApiResponse>(`/recorders/${recorderSeq}/presets/${recPresetSeq}`, {
    method: 'PUT',
    body: data,
  });
  if (!response.success) {
    throw new Error('프리셋 수정 실패');
  }
}

export async function deletePreset(recorderSeq: number, recPresetSeq: number): Promise<void> {
  const response = await apiClient<ApiResponse>(`/recorders/${recorderSeq}/presets/${recPresetSeq}`, {
    method: 'DELETE',
  });
  if (!response.success) {
    throw new Error('프리셋 삭제 실패');
  }
}

// --- Control ---

export async function sendPtzCommand(recorderSeq: number, data: PtzCommand): Promise<PtzResponse> {
  const response = await apiClient<ApiResponse<PtzResponse>>(`/recorders/${recorderSeq}/control/ptz`, {
    method: 'POST',
    body: data,
  });
  if (!response.success || !response.data) {
    throw new Error('PTZ 명령 전송 실패');
  }
  return response.data;
}

export async function startRecording(recorderSeq: number, data: RecordStartDto): Promise<RecordStartResponse> {
  const response = await apiClient<ApiResponse<RecordStartResponse>>(`/recorders/${recorderSeq}/control/record/start`, {
    method: 'POST',
    body: data,
  });
  if (!response.success || !response.data) {
    throw new Error('녹화 시작 실패');
  }
  return response.data;
}

export async function stopRecording(recorderSeq: number): Promise<RecordStopResponse> {
  const response = await apiClient<ApiResponse<RecordStopResponse>>(`/recorders/${recorderSeq}/control/record/stop`, {
    method: 'POST',
  });
  if (!response.success || !response.data) {
    throw new Error('녹화 종료 실패');
  }
  return response.data;
}

export async function applyPreset(recorderSeq: number, recPresetSeq: number): Promise<PresetApplyResponse> {
  const response = await apiClient<ApiResponse<PresetApplyResponse>>(`/recorders/${recorderSeq}/control/preset/${recPresetSeq}`, {
    method: 'POST',
  });
  if (!response.success || !response.data) {
    throw new Error('프리셋 적용 실패');
  }
  return response.data;
}

export async function getRecorderStatus(recorderSeq: number): Promise<RecorderControlStatus> {
  const response = await apiClient<ApiResponse<RecorderControlStatus>>(`/recorders/${recorderSeq}/control/status`, {
    method: 'GET',
  });
  if (!response.success || !response.data) {
    throw new Error('녹화기 상태 조회 실패');
  }
  return response.data;
}

// --- Logs ---

export async function getRecorderLogs(
  recorderSeq: number,
  params?: GetRecorderLogsParams
): Promise<RecorderPaginatedResponse<RecorderLogItem>> {
  const response = await apiClient<ApiResponse<RecorderPaginatedResponse<RecorderLogItem>>>(
    `/recorders/${recorderSeq}/logs`,
    { method: 'GET', params }
  );
  if (!response.success || !response.data) {
    throw new Error('녹화기 로그 조회 실패');
  }
  return response.data;
}
