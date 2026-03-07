// ============================================================
// AI System Types (AI 시스템 - 강의요약 + 실시간 음성인식)
// ============================================================

// --- Enums / Unions ---

export type AiProcessStatus = 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type SpeechSessionStatus = 'ACTIVE' | 'PAUSED' | 'ENDED';
export type CommandExecutionStatus = 'MATCHED' | 'EXECUTED' | 'FAILED' | 'NO_MATCH';
export type VerifySource = 'LOCAL_VOSK' | 'REMOTE_WHISPER';
export type WorkerServerStatus = 'ONLINE' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE';

// --- Lecture Summary (강의요약) ---

export interface LectureSummaryListItem {
  no: number;
  summarySeq: number;
  buildingName: string;
  spaceName: string;
  spaceFloor: string;
  userName: string | null;
  deviceCode: string;
  jobId: string;
  recordingTitle: string | null;
  recordingFilename: string;
  durationSeconds: number | null;
  durationFormatted: string | null;
  recordedAt: string | null;
  processStatus: AiProcessStatus;
  summaryKeywords: string[] | null;
  completedAt: string | null;
  regDate: string;
}

export interface LectureSummaryDetail {
  summarySeq: number;
  spaceSeq: number;
  buildingName: string;
  spaceName: string;
  spaceFloor: string;
  tuSeq: number | null;
  userName: string | null;
  deviceCode: string;
  jobId: string;
  recordingTitle: string | null;
  recordingFilename: string;
  durationSeconds: number | null;
  durationFormatted: string | null;
  recordedAt: string | null;
  sttText: string | null;
  sttLanguage: string | null;
  sttConfidence: number | null;
  summaryText: string | null;
  summaryKeywords: string[] | null;
  processStatus: AiProcessStatus;
  completedAt: string | null;
  sessionSeq: number | null;
  regDate: string;
  updDate: string;
}

export interface CreateLectureSummaryDto {
  spaceSeq: number;
  tuSeq?: number;
  deviceCode: string;
  jobId: string;
  recordingTitle?: string;
  recordingFilename: string;
  durationSeconds?: number;
  recordedAt?: string;
}

export interface UpdateLectureSummaryStatusDto {
  processStatus: AiProcessStatus;
}

export interface UpdateLectureSummaryResultDto {
  sttText: string;
  sttLanguage?: string;
  sttConfidence?: number;
  summaryText: string;
  summaryKeywords?: string[];
  completedAt: string;
  sessionSeq?: number;
}

// --- Speech Session (음성인식 세션) ---

export interface SpeechSessionListItem {
  no: number;
  sessionSeq: number;
  buildingName: string;
  spaceName: string;
  userName: string | null;
  sessionStatus: SpeechSessionStatus;
  sttEngine: string;
  sttModel: string;
  startedAt: string;
  endedAt: string | null;
  totalDurationSec: number | null;
  totalSegments: number;
  totalCommands: number;
  recordingFilename: string | null;
}

export interface SpeechSessionDetail {
  sessionSeq: number;
  spaceSeq: number;
  buildingName: string;
  spaceName: string;
  tuSeq: number | null;
  userName: string | null;
  sessionStatus: SpeechSessionStatus;
  sttEngine: string;
  sttModel: string;
  startedAt: string;
  endedAt: string | null;
  totalDurationSec: number | null;
  totalSegments: number;
  totalCommands: number;
  recordingFilename: string | null;
  summarySeq: number | null;
  logs: SpeechLogItem[];
  commandLogs: CommandLogItem[];
}

export interface CreateSpeechSessionDto {
  spaceSeq: number;
  tuSeq?: number;
  sttEngine?: string;
  sttModel?: string;
  recordingFilename?: string;
}

export interface EndSpeechSessionDto {
  totalDurationSec?: number;
  totalSegments?: number;
  totalCommands?: number;
  summarySeq?: number;
}

// --- Speech Log (음성인식 로그) ---

export interface SpeechLogItem {
  speechLogSeq: number;
  segmentText: string;
  segmentStartSec: number | null;
  segmentEndSec: number | null;
  confidence: number | null;
  isCommand: 'Y' | 'N';
  createdAt: string;
}

export interface CreateSpeechLogDto {
  sessionSeq: number;
  segmentText: string;
  segmentStartSec?: number;
  segmentEndSec?: number;
  confidence?: number;
  isCommand?: 'Y' | 'N';
}

// --- Command Log (명령 실행 로그) ---

export interface CommandLogItem {
  commandLogSeq: number;
  sessionSeq: number;
  voiceCommandSeq: number | null;
  recognizedText: string;
  matchedKeyword: string | null;
  matchScore: number | null;
  verifySource: VerifySource | null;
  executionStatus: CommandExecutionStatus;
  executionResult: string | null;
  createdAt: string;
}

export interface CreateCommandLogDto {
  sessionSeq: number;
  recognizedText: string;
  matchedKeyword?: string;
  matchScore?: number;
  voiceCommandSeq?: number;
  verifySource?: VerifySource;
  executionStatus: CommandExecutionStatus;
  executionResult?: string;
}

// --- Voice Command (음성 명령어 매핑) ---

export interface VoiceCommandListItem {
  voiceCommandSeq: number;
  spaceSeq: number;
  spaceName: string;
  keyword: string;
  keywordAliases: string[] | null;
  spaceDeviceSeq: number;
  deviceName: string;
  commandSeq: number;
  commandName: string;
  minConfidence: number;
  commandPriority: number;
  regDate: string;
}

export interface CreateVoiceCommandDto {
  spaceSeq: number;
  keyword: string;
  keywordAliases?: string[];
  spaceDeviceSeq: number;
  commandSeq: number;
  minConfidence?: number;
  commandPriority?: number;
}

export interface UpdateVoiceCommandDto {
  keyword?: string;
  keywordAliases?: string[];
  spaceDeviceSeq?: number;
  commandSeq?: number;
  minConfidence?: number;
  commandPriority?: number;
}

// --- Worker Server (AI Worker 서버) ---

export interface WorkerServerListItem {
  workerServerSeq: number;
  serverName: string;
  serverUrl: string;
  serverStatus: WorkerServerStatus;
  lastHealthCheck: string | null;
  gpuInfo: string | null;
  maxConcurrentJobs: number;
  defaultSttModel: string;
  defaultLlmModel: string;
  regDate: string;
}

export interface WorkerServerDetail {
  workerServerSeq: number;
  serverName: string;
  serverUrl: string;
  serverStatus: WorkerServerStatus;
  lastHealthCheck: string | null;
  gpuInfo: string | null;
  maxConcurrentJobs: number;
  defaultSttModel: string;
  defaultLlmModel: string;
  regDate: string;
  updDate: string;
}

export interface CreateWorkerServerDto {
  serverName: string;
  serverUrl: string;
  apiKey: string;
  callbackSecret?: string;
  gpuInfo?: string;
  maxConcurrentJobs?: number;
  defaultSttModel?: string;
  defaultLlmModel?: string;
}

export interface UpdateWorkerServerDto {
  serverName?: string;
  serverUrl?: string;
  apiKey?: string;
  callbackSecret?: string;
  gpuInfo?: string;
  maxConcurrentJobs?: number;
  defaultSttModel?: string;
  defaultLlmModel?: string;
}

export interface WorkerHealthResponse {
  serverStatus: WorkerServerStatus;
  gpuUsage: number | null;
  memoryUsage: number | null;
  activeJobs: number;
  queuedJobs: number;
  uptime: number;
}

// --- Callback (ku_ai_worker → 미니PC) ---

export interface AiWorkerCallbackPayload {
  jobId: string;
  status: 'COMPLETED' | 'FAILED';
  result?: {
    sttText: string;
    sttLanguage: string;
    sttConfidence: number;
    summaryText: string;
    summaryKeywords: string[];
  };
  error?: {
    errorCode: string;
    errorMessage: string;
  };
}
