import apiClient from './client';
import type {
  PresetListResponse,
  PresetDetail,
  CreatePresetDto,
  UpdatePresetDto,
  PresetListQuery,
  CreateDeviceDto,
  UpdateDeviceDto,
  ControlSpacesListResponse,
  SpaceDevicesResponse,
  BulkCreateDeviceDto,
  BulkCreateDeviceResponse,
  ExecuteCommandDto,
  ExecuteCommandResult,
  ExecuteBatchDto,
  ExecuteBatchResult,
  ControlLogResponse,
  ControlLogQuery,
} from '@ku/types';

// ==================== 프리셋 ====================

/** 프리셋 목록 조회 */
export async function getPresets(params?: PresetListQuery): Promise<PresetListResponse> {
  return await apiClient<PresetListResponse>('/controller/presets', { params });
}

/** 프리셋 상세 조회 (명령어 포함) */
export async function getPreset(presetSeq: number): Promise<PresetDetail> {
  return await apiClient<PresetDetail>(`/controller/presets/${presetSeq}`);
}

/** 프리셋 등록 (명령어 포함) */
export async function createPreset(dto: CreatePresetDto): Promise<PresetDetail> {
  return await apiClient<PresetDetail>('/controller/presets', {
    method: 'POST',
    body: dto,
  });
}

/** 프리셋 수정 (명령어 동기화 포함) */
export async function updatePreset(presetSeq: number, dto: UpdatePresetDto): Promise<PresetDetail> {
  return await apiClient<PresetDetail>(`/controller/presets/${presetSeq}`, {
    method: 'PUT',
    body: dto,
  });
}

/** 프리셋 삭제 */
export async function deletePreset(presetSeq: number): Promise<void> {
  await apiClient(`/controller/presets/${presetSeq}`, { method: 'DELETE' });
}

// ==================== 장비 ====================

/** 장비 등록 */
export async function createDevice(dto: CreateDeviceDto): Promise<void> {
  await apiClient('/controller/control/devices', {
    method: 'POST',
    body: dto,
  });
}

/** 장비 수정 */
export async function updateDevice(spaceDeviceSeq: number, dto: UpdateDeviceDto): Promise<void> {
  await apiClient(`/controller/control/devices/${spaceDeviceSeq}`, {
    method: 'PUT',
    body: dto,
  });
}

/** 장비 삭제 */
export async function deleteDevice(spaceDeviceSeq: number): Promise<void> {
  await apiClient(`/controller/control/devices/${spaceDeviceSeq}`, { method: 'DELETE' });
}

/** 장비 일괄 등록 */
export async function createDevicesBulk(dto: BulkCreateDeviceDto): Promise<BulkCreateDeviceResponse> {
  return await apiClient<BulkCreateDeviceResponse>('/controller/control/devices/bulk', {
    method: 'POST',
    body: dto,
  });
}

// ==================== 제어 ====================

/** 제어 화면용 공간-장비 목록 조회 */
export async function getControlSpaces(buildingSeq: number): Promise<ControlSpacesListResponse> {
  return await apiClient<ControlSpacesListResponse>('/controller/control/spaces', {
    params: { buildingSeq },
  });
}

/** 공간별 장비 목록 조회 */
export async function getSpaceDevices(spaceSeq: number): Promise<SpaceDevicesResponse> {
  return await apiClient<SpaceDevicesResponse>(`/controller/control/spaces/${spaceSeq}/devices`);
}

/** 단일 장비 명령어 실행 */
export async function executeCommand(dto: ExecuteCommandDto): Promise<ExecuteCommandResult> {
  return await apiClient<ExecuteCommandResult>('/controller/control/execute', {
    method: 'POST',
    body: dto,
  });
}

/** 공간 일괄 제어 */
export async function executeBatch(dto: ExecuteBatchDto): Promise<ExecuteBatchResult> {
  return await apiClient<ExecuteBatchResult>('/controller/control/execute-batch', {
    method: 'POST',
    body: dto,
  });
}

/** 제어 로그 조회 */
export async function getControlLogs(params?: ControlLogQuery): Promise<ControlLogResponse> {
  return await apiClient<ControlLogResponse>('/controller/control/logs', { params });
}

/** 제어 로그 전체 삭제 */
export async function deleteControlLogs(): Promise<{ message: string; deletedCount: number }> {
  return await apiClient<{ message: string; deletedCount: number }>('/controller/control/logs', {
    method: 'DELETE',
  });
}
