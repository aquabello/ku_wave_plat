// =============================================
// 프리셋 관리
// =============================================

/**
 * 프리셋 리스트 아이템
 */
export interface PresetListItem {
  no: number;
  presetSeq: number;
  presetName: string;
  protocolType: string;
  commIp: string | null;
  commPort: number | null;
  presetDescription: string | null;
  commandCount: number;
  deviceCount: number;
  presetOrder: number;
}

/**
 * 프리셋 명령어
 */
export interface PresetCommand {
  commandSeq: number;
  commandName: string;
  commandCode: string;
  commandType: string;
  commandOrder: number;
}

/**
 * 프리셋 상세
 */
export interface PresetDetail {
  presetSeq: number;
  presetName: string;
  protocolType: string;
  commIp: string | null;
  commPort: number | null;
  presetDescription: string | null;
  presetOrder: number;
  presetIsdel: string;
  regDate: string;
  updDate: string;
  commands: PresetCommand[];
}

/**
 * 프리셋 리스트 응답 (페이징)
 */
export interface PresetListResponse {
  items: PresetListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 프리셋 등록 명령어 DTO
 */
export interface CreatePresetCommandDto {
  commandName: string;
  commandCode: string;
  commandType?: string;
  commandOrder?: number;
}

/**
 * 프리셋 등록 요청 DTO
 */
export interface CreatePresetDto {
  presetName: string;
  protocolType: string;
  commIp?: string;
  commPort?: number;
  presetDescription?: string;
  presetOrder?: number;
  commands?: CreatePresetCommandDto[];
}

/**
 * 프리셋 수정 명령어 DTO
 */
export interface UpdatePresetCommandDto {
  commandSeq?: number;
  commandName: string;
  commandCode: string;
  commandType?: string;
  commandOrder?: number;
}

/**
 * 프리셋 수정 요청 DTO
 */
export interface UpdatePresetDto {
  presetName?: string;
  protocolType?: string;
  commIp?: string;
  commPort?: number;
  presetDescription?: string;
  presetOrder?: number;
  commands?: UpdatePresetCommandDto[];
}

/**
 * 프리셋 리스트 쿼리
 */
export interface PresetListQuery {
  page?: number;
  limit?: number;
  search?: string;
  protocol?: string;
}

// =============================================
// 장비 등록 (하드웨어 설정)
// =============================================

/**
 * 장비 리스트 아이템
 */
export interface DeviceListItem {
  no: number;
  spaceDeviceSeq: number;
  spaceSeq: number;
  spaceName: string;
  spaceFloor: string | null;
  presetSeq: number;
  presetName: string;
  protocolType: string;
  deviceName: string;
  deviceIp: string;
  devicePort: number;
  deviceStatus: string;
  deviceOrder: number;
}

/**
 * 장비 리스트 응답 (페이징)
 */
export interface DeviceListResponse {
  items: DeviceListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 장비 등록 요청 DTO
 */
export interface CreateDeviceDto {
  spaceSeq: number;
  presetSeq: number;
  deviceName: string;
  deviceIp: string;
  devicePort: number;
  deviceOrder?: number;
}

/**
 * 장비 일괄 등록 아이템
 */
export interface BulkDeviceItem {
  spaceSeq: number;
  deviceName: string;
  deviceIp: string;
  devicePort: number;
  deviceOrder?: number;
}

/**
 * 장비 일괄 등록 요청 DTO
 */
export interface CreateBulkDeviceDto {
  presetSeq: number;
  devices: BulkDeviceItem[];
}

/**
 * 장비 일괄 등록 결과 아이템
 */
export interface BulkDeviceResultItem {
  spaceSeq: number;
  spaceName: string | null;
  deviceName: string;
  status: string;
  message?: string;
}

/**
 * 장비 일괄 등록 결과
 */
export interface CreateBulkDeviceResult {
  totalRequested: number;
  successCount: number;
  results: BulkDeviceResultItem[];
}

/**
 * 장비 수정 요청 DTO
 */
export interface UpdateDeviceDto {
  presetSeq?: number;
  deviceName?: string;
  deviceIp?: string;
  devicePort?: number;
  deviceStatus?: string;
  deviceOrder?: number;
}

/**
 * 장비 리스트 쿼리
 */
export interface DeviceListQuery {
  buildingSeq: number;
  spaceSeq?: number;
  page?: number;
  limit?: number;
  search?: string;
}

// =============================================
// 장비 제어 (제어관리)
// =============================================

/**
 * 제어 화면용 명령어
 */
export interface ControlCommand {
  commandSeq: number;
  commandName: string;
  commandCode: string;
  commandType: string;
}

/**
 * 제어 화면용 장비
 */
export interface ControlDevice {
  spaceDeviceSeq: number;
  deviceName: string;
  presetSeq: number;
  presetName: string;
  protocolType: string;
  deviceIp: string;
  devicePort: number;
  deviceStatus: string;
  deviceOrder: number;
  commands: ControlCommand[];
}

/**
 * 공간 목록 아이템 (장비 수 포함)
 */
export interface ControlSpaceItem {
  spaceSeq: number;
  spaceName: string;
  spaceFloor: string | null;
  spaceType: string | null;
  deviceCount: number;
}

/**
 * 제어관리 메인 화면 응답 (건물 기준 공간 목록)
 */
export interface ControlSpacesResponse {
  buildingSeq: number;
  buildingName: string;
  spaces: ControlSpaceItem[];
}

/**
 * 공간별 장비 목록 응답
 */
export interface SpaceDevicesResponse {
  spaceSeq: number;
  spaceName: string;
  spaceFloor: string | null;
  devices: ControlDevice[];
}

/**
 * 단일 장비 명령어 실행 요청
 */
export interface ExecuteCommandDto {
  spaceDeviceSeq: number;
  commandSeq: number;
}

/**
 * 단일 장비 명령어 실행 결과
 */
export interface ExecuteCommandResult {
  logSeq: number;
  resultStatus: string;
  resultMessage: string;
  executedAt: string;
}

/**
 * 공간 일괄 제어 요청
 */
export interface ExecuteBatchDto {
  spaceSeq: number;
  commandType: string;
}

/**
 * 일괄 제어 장비별 결과
 */
export interface BatchDeviceResult {
  spaceDeviceSeq: number;
  deviceName: string;
  resultStatus: string;
  resultMessage: string;
}

/**
 * 공간 일괄 제어 결과
 */
export interface ExecuteBatchResult {
  spaceSeq: number;
  spaceName: string;
  totalDevices: number;
  results: BatchDeviceResult[];
  successCount: number;
  failCount: number;
  executedAt: string;
}

/**
 * 제어 로그 아이템
 */
export interface ControlLogItem {
  no: number;
  logSeq: number;
  spaceName: string;
  deviceName: string;
  commandName: string;
  commandType: string;
  executedBy: string;
  resultStatus: string;
  resultMessage: string | null;
  executedAt: string;
}

/**
 * 제어 로그 응답 (페이징)
 */
export interface ControlLogResponse {
  items: ControlLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 제어 로그 쿼리
 */
export interface ControlLogQuery {
  buildingSeq?: number;
  spaceSeq?: number;
  spaceDeviceSeq?: number;
  resultStatus?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// =============================================
// 제어관리 - 공간 목록 (spaces list)
// =============================================

/** 공간 목록 응답 (ControlSpacesResponse alias) */
export interface ControlSpacesListResponse {
  buildingSeq: number;
  buildingName: string;
  spaces: ControlSpaceItem[];
}

// =============================================
// 장비 일괄 등록 (제어관리용)
// =============================================

export interface BulkCreateDeviceItem {
  spaceSeq: number;
  deviceName: string;
  deviceIp: string;
  devicePort: number;
}

export interface BulkCreateDeviceDto {
  presetSeq: number;
  devices: BulkCreateDeviceItem[];
}

export interface BulkCreateDeviceResultItem {
  spaceSeq: number;
  spaceName: string;
  deviceName: string;
  status: string;
}

export interface BulkCreateDeviceResponse {
  totalRequested: number;
  successCount: number;
  results: BulkCreateDeviceResultItem[];
}
