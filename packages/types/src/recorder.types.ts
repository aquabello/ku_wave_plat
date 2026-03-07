// ============================================================
// Recorder Types (녹화기 관리 시스템)
// ============================================================

// --- Enums / Unions ---

export type RecorderStatus = 'ONLINE' | 'OFFLINE' | 'ERROR';
export type RecorderProtocol = 'HTTP' | 'ONVIF' | 'RTSP';
export type SessionStatus = 'RECORDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type FtpUploadStatus = 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'RETRY';
export type FtpProtocol = 'FTP' | 'SFTP' | 'FTPS';
export type PtzAction = 'move' | 'stop' | 'home';
export type LogType = 'PTZ' | 'REC_START' | 'REC_STOP' | 'PRESET_APPLY' | 'STATUS_CHECK' | 'POWER';
export type ResultStatus = 'SUCCESS' | 'FAIL' | 'TIMEOUT';

// --- Recorder CRUD ---

export interface RecorderListItem {
  no: number;
  recorderSeq: number;
  recorderName: string;
  recorderIp: string;
  recorderPort: number;
  recorderProtocol: RecorderProtocol;
  recorderModel: string | null;
  recorderStatus: RecorderStatus;
  lastHealthCheck: string | null;
  buildingName: string;
  spaceName: string;
  spaceFloor: string;
  currentUserName: string | null;
  assignedUserCount: number;
}

export interface RecorderAssignedUser {
  recorderUserSeq: number;
  tuSeq: number;
  tuName: string;
  tuEmail: string;
  isDefault: 'Y' | 'N';
}

export interface RecorderPreset {
  recPresetSeq: number;
  presetName: string;
  presetNumber: number;
  panValue: number;
  tiltValue: number;
  zoomValue: number;
  presetDescription?: string;
  presetOrder: number;
}

export interface RecorderDetail {
  recorderSeq: number;
  recorderName: string;
  recorderIp: string;
  recorderPort: number;
  recorderProtocol: RecorderProtocol;
  recorderUsername: string;
  recorderModel: string | null;
  recorderStatus: RecorderStatus;
  lastHealthCheck: string | null;
  recorderOrder: number;
  buildingSeq: number;
  buildingName: string;
  spaceSeq: number;
  spaceName: string;
  spaceFloor: string;
  currentUser: { tuSeq: number; tuName: string } | null;
  assignedUsers: RecorderAssignedUser[];
  presets: RecorderPreset[];
  regDate: string;
  updDate: string;
}

export interface CreateRecorderDto {
  spaceSeq: number;
  recorderName: string;
  recorderIp: string;
  recorderPort?: number;
  recorderProtocol?: RecorderProtocol;
  recorderUsername?: string;
  recorderPassword?: string;
  recorderModel?: string;
  recorderOrder?: number;
  assignedUsers?: { tuSeq: number; isDefault?: 'Y' | 'N' }[];
}

export interface UpdateRecorderDto {
  recorderName?: string;
  recorderIp?: string;
  recorderPort?: number;
  recorderProtocol?: RecorderProtocol;
  recorderUsername?: string;
  recorderPassword?: string;
  recorderModel?: string;
  recorderOrder?: number;
  assignedUsers?: { tuSeq: number; isDefault?: 'Y' | 'N' }[];
}

// --- Preset CRUD ---

export interface CreateRecorderPresetDto {
  presetName: string;
  presetNumber: number;
  panValue?: number;
  tiltValue?: number;
  zoomValue?: number;
  presetDescription?: string;
  presetOrder?: number;
}

export interface UpdateRecorderPresetDto {
  presetName?: string;
  presetNumber?: number;
  panValue?: number;
  tiltValue?: number;
  zoomValue?: number;
  presetDescription?: string;
  presetOrder?: number;
}

// --- Recorder Control ---

export interface PtzCommand {
  action: PtzAction;
  pan?: number;
  tilt?: number;
  zoom?: number;
}

export interface PtzResponse {
  recLogSeq: number;
  resultStatus: ResultStatus;
  resultMessage: string;
  executedAt: string;
}

export interface RecordStartDto {
  sessionTitle?: string;
  recPresetSeq?: number;
}

export interface RecordStartResponse {
  recSessionSeq: number;
  recorderSeq: number;
  sessionStatus: 'RECORDING';
  sessionTitle: string;
  startedAt: string;
  message: string;
}

export interface RecordStopResponse {
  recSessionSeq: number;
  sessionStatus: 'COMPLETED';
  startedAt: string;
  endedAt: string;
  durationSec: number;
  message: string;
}

export interface PresetApplyResponse {
  recLogSeq: number;
  presetName: string;
  presetNumber: number;
  resultStatus: ResultStatus;
  resultMessage: string;
  executedAt: string;
}

export interface RecorderControlStatus {
  recorderSeq: number;
  recorderName: string;
  recorderStatus: RecorderStatus;
  isRecording: boolean;
  currentSession: {
    recSessionSeq: number;
    sessionTitle: string;
    startedAt: string;
    elapsedSec: number;
  } | null;
  currentUser: {
    tuSeq: number;
    tuName: string;
  } | null;
  lastHealthCheck: string | null;
}

// --- Recording Sessions ---

export interface RecordingSessionListItem {
  no: number;
  recSessionSeq: number;
  recorderName: string;
  buildingName: string;
  spaceName: string;
  sessionTitle: string;
  userName: string;
  sessionStatus: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  durationSec: number;
  fileCount: number;
  presetName: string | null;
}

export interface RecordingFileItem {
  recFileSeq: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileFormat: string;
  fileDurationSec: number;
  ftpStatus: FtpUploadStatus;
  ftpUploadedPath: string | null;
  ftpUploadedAt: string | null;
  ftpRetryCount: number;
}

export interface RecordingSessionDetail {
  recSessionSeq: number;
  recorderSeq: number;
  recorderName: string;
  buildingName: string;
  spaceName: string;
  sessionTitle: string;
  userName: string;
  sessionStatus: SessionStatus;
  presetName: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSec: number;
  files: RecordingFileItem[];
}

// --- Recording Files ---

export interface RecordingFileListItem {
  no: number;
  recFileSeq: number;
  fileName: string;
  fileSize: number;
  fileSizeFormatted: string;
  fileFormat: string;
  fileDurationSec: number;
  ftpStatus: FtpUploadStatus;
  ftpUploadedAt: string | null;
  ftpRetryCount: number;
  ftpErrorMessage: string | null;
  sessionTitle: string;
  userName: string;
  buildingName: string;
  spaceName: string;
  regDate: string;
}

export interface RetryUploadResponse {
  recFileSeq: number;
  ftpStatus: 'UPLOADING';
  ftpRetryCount: number;
  message: string;
}

// --- FTP Config ---

export interface FtpConfigListItem {
  ftpConfigSeq: number;
  ftpName: string;
  ftpHost: string;
  ftpPort: number;
  ftpProtocol: FtpProtocol;
  ftpPath: string;
  ftpPassiveMode: 'Y' | 'N';
  isDefault: 'Y' | 'N';
  recorderSeq: number | null;
  recorderName: string | null;
  regDate: string;
}

export interface CreateFtpConfigDto {
  ftpName: string;
  ftpHost: string;
  ftpPort?: number;
  ftpUsername: string;
  ftpPassword: string;
  ftpPath?: string;
  ftpProtocol?: FtpProtocol;
  ftpPassiveMode?: 'Y' | 'N';
  isDefault?: 'Y' | 'N';
  recorderSeq?: number | null;
}

export interface UpdateFtpConfigDto {
  ftpName?: string;
  ftpHost?: string;
  ftpPort?: number;
  ftpUsername?: string;
  ftpPassword?: string;
  ftpPath?: string;
  ftpProtocol?: FtpProtocol;
  ftpPassiveMode?: 'Y' | 'N';
  isDefault?: 'Y' | 'N';
  recorderSeq?: number | null;
}

export interface FtpTestResponse {
  result: 'SUCCESS' | 'FAIL';
  message: string;
  serverInfo?: string;
  testedAt: string;
}

// --- Recorder Logs ---

export interface RecorderLogItem {
  no: number;
  recLogSeq: number;
  logType: LogType;
  commandDetail: string;
  resultStatus: ResultStatus;
  resultMessage: string;
  executedBy: string;
  executedAt: string;
}

// --- Preset List Response ---

export interface RecorderPresetsResponse {
  recorderSeq: number;
  recorderName: string;
  presets: RecorderPreset[];
}
