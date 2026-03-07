import { apiClient } from './client';
import type {
  LectureSummaryListItem,
  LectureSummaryDetail,
  SpeechSessionListItem,
  SpeechSessionDetail,
  SpeechLogItem,
  CommandLogItem,
  VoiceCommandListItem,
  CreateVoiceCommandDto,
  UpdateVoiceCommandDto,
  WorkerServerListItem,
  WorkerServerDetail,
  CreateWorkerServerDto,
  UpdateWorkerServerDto,
  WorkerHealthResponse,
  ApiResponse,
  AiProcessStatus,
  SpeechSessionStatus,
} from '@ku/types';

// ============================================================
// MOCK DATA (BE 미연동 시 사용 — 연동 후 USE_MOCK = false)
// ============================================================
const USE_MOCK = true;

const MOCK_LECTURE_SUMMARIES: LectureSummaryListItem[] = [
  { no: 1, summarySeq: 1, buildingName: '신공학관', spaceName: '301호 강의실', spaceFloor: '3F', userName: '김교수', deviceCode: 'MINIPC-301', jobId: 'job-20260304-001', recordingTitle: '데이터구조론 3주차', recordingFilename: 'REC_데이터구조론_20260304.wav', durationSeconds: 5400, durationFormatted: '01:30:00', recordedAt: '2026-03-04T09:00:00', processStatus: 'COMPLETED' as AiProcessStatus, summaryKeywords: ['이진트리', '힙', '우선순위 큐', '시간복잡도'], completedAt: '2026-03-04T10:45:00', regDate: '2026-03-04T09:00:00' },
  { no: 2, summarySeq: 2, buildingName: '신공학관', spaceName: '302호 강의실', spaceFloor: '3F', userName: '이교수', deviceCode: 'MINIPC-302', jobId: 'job-20260304-002', recordingTitle: '운영체제 3주차', recordingFilename: 'REC_운영체제_20260304.wav', durationSeconds: 5400, durationFormatted: '01:30:00', recordedAt: '2026-03-04T10:00:00', processStatus: 'PROCESSING' as AiProcessStatus, summaryKeywords: null, completedAt: null, regDate: '2026-03-04T10:00:00' },
  { no: 3, summarySeq: 3, buildingName: '공과대학', spaceName: '201호 강의실', spaceFloor: '2F', userName: '박교수', deviceCode: 'MINIPC-201', jobId: 'job-20260304-003', recordingTitle: '알고리즘 3주차', recordingFilename: 'REC_알고리즘_20260304.wav', durationSeconds: 5400, durationFormatted: '01:30:00', recordedAt: '2026-03-04T13:00:00', processStatus: 'UPLOADING' as AiProcessStatus, summaryKeywords: null, completedAt: null, regDate: '2026-03-04T13:00:00' },
  { no: 4, summarySeq: 4, buildingName: '경영관', spaceName: '101호 대강의실', spaceFloor: '1F', userName: '최교수', deviceCode: 'MINIPC-101', jobId: 'job-20260303-001', recordingTitle: '경영학원론 특강', recordingFilename: 'REC_경영학원론_20260303.wav', durationSeconds: 7200, durationFormatted: '02:00:00', recordedAt: '2026-03-03T14:00:00', processStatus: 'COMPLETED' as AiProcessStatus, summaryKeywords: ['경영전략', 'SWOT분석', '마이클포터', '경쟁우위'], completedAt: '2026-03-03T16:30:00', regDate: '2026-03-03T14:00:00' },
  { no: 5, summarySeq: 5, buildingName: '신공학관', spaceName: '301호 강의실', spaceFloor: '3F', userName: '정교수', deviceCode: 'MINIPC-301', jobId: 'job-20260303-002', recordingTitle: '컴퓨터네트워크 3주차', recordingFilename: 'REC_컴퓨터네트워크_20260303.wav', durationSeconds: 5400, durationFormatted: '01:30:00', recordedAt: '2026-03-03T09:00:00', processStatus: 'FAILED' as AiProcessStatus, summaryKeywords: null, completedAt: null, regDate: '2026-03-03T09:00:00' },
  { no: 6, summarySeq: 6, buildingName: '공과대학', spaceName: '201호 강의실', spaceFloor: '2F', userName: '한교수', deviceCode: 'MINIPC-201', jobId: 'job-20260303-003', recordingTitle: '선형대수 3주차', recordingFilename: 'REC_선형대수_20260303.wav', durationSeconds: 4500, durationFormatted: '01:15:00', recordedAt: '2026-03-03T11:00:00', processStatus: 'COMPLETED' as AiProcessStatus, summaryKeywords: ['행렬', '고유값', '대각화', '선형변환'], completedAt: '2026-03-03T12:45:00', regDate: '2026-03-03T11:00:00' },
  { no: 7, summarySeq: 7, buildingName: '신공학관', spaceName: '302호 강의실', spaceFloor: '3F', userName: '이교수', deviceCode: 'MINIPC-302', jobId: 'job-20260302-001', recordingTitle: '소프트웨어공학 2주차', recordingFilename: 'REC_소프트웨어공학_20260302.wav', durationSeconds: 5400, durationFormatted: '01:30:00', recordedAt: '2026-03-02T13:00:00', processStatus: 'COMPLETED' as AiProcessStatus, summaryKeywords: ['애자일', '스크럼', '스프린트', 'CI/CD'], completedAt: '2026-03-02T15:00:00', regDate: '2026-03-02T13:00:00' },
  { no: 8, summarySeq: 8, buildingName: '경영관', spaceName: '101호 대강의실', spaceFloor: '1F', userName: '송교수', deviceCode: 'MINIPC-101', jobId: 'job-20260302-002', recordingTitle: '마케팅원론 3주차', recordingFilename: 'REC_마케팅원론_20260302.wav', durationSeconds: 5400, durationFormatted: '01:30:00', recordedAt: '2026-03-02T10:00:00', processStatus: 'COMPLETED' as AiProcessStatus, summaryKeywords: ['STP전략', '세분화', '포지셔닝', '4P'], completedAt: '2026-03-02T12:00:00', regDate: '2026-03-02T10:00:00' },
];

const MOCK_LECTURE_SUMMARY_DETAIL: LectureSummaryDetail = {
  summarySeq: 1,
  spaceSeq: 10,
  buildingName: '신공학관',
  spaceName: '301호 강의실',
  spaceFloor: '3F',
  tuSeq: 100,
  userName: '김교수',
  deviceCode: 'MINIPC-301',
  jobId: 'job-20260304-001',
  recordingTitle: '데이터구조론 3주차',
  recordingFilename: 'REC_데이터구조론_20260304.wav',
  durationSeconds: 5400,
  durationFormatted: '01:30:00',
  recordedAt: '2026-03-04T09:00:00',
  sttText: '오늘은 이진트리에 대해 알아보겠습니다. 이진트리는 각 노드가 최대 두 개의 자식 노드를 가지는 트리 구조입니다. 완전 이진트리와 포화 이진트리의 차이를 먼저 살펴보겠습니다. 완전 이진트리는 마지막 레벨을 제외한 모든 레벨이 완전히 채워진 트리입니다. 힙은 완전 이진트리를 기반으로 하며, 최대 힙과 최소 힙으로 나뉩니다. 우선순위 큐는 힙을 이용하여 구현할 수 있으며, 삽입과 삭제 연산의 시간복잡도는 O(log n)입니다.',
  sttLanguage: 'ko',
  sttConfidence: 0.94,
  summaryText: '## 데이터구조론 3주차 - 이진트리와 힙\n\n### 주요 내용\n1. **이진트리 개념**: 각 노드가 최대 2개의 자식 노드를 가지는 트리 구조\n2. **완전 이진트리 vs 포화 이진트리**: 마지막 레벨 채움 여부 차이\n3. **힙(Heap)**: 완전 이진트리 기반, 최대 힙/최소 힙 구분\n4. **우선순위 큐**: 힙 기반 구현, 삽입/삭제 O(log n)\n\n### 핵심 키워드\n이진트리, 완전 이진트리, 힙, 우선순위 큐, 시간복잡도',
  summaryKeywords: ['이진트리', '힙', '우선순위 큐', '시간복잡도'],
  processStatus: 'COMPLETED',
  completedAt: '2026-03-04T10:45:00',
  sessionSeq: 201,
  regDate: '2026-03-04T09:00:00',
  updDate: '2026-03-04T10:45:00',
};

const MOCK_SPEECH_SESSIONS: SpeechSessionListItem[] = [
  { no: 1, sessionSeq: 201, buildingName: '신공학관', spaceName: '301호 강의실', userName: '김교수', sessionStatus: 'ENDED' as SpeechSessionStatus, sttEngine: 'Whisper', sttModel: 'large-v3', startedAt: '2026-03-04T09:00:00', endedAt: '2026-03-04T10:30:00', totalDurationSec: 5400, totalSegments: 128, totalCommands: 5, recordingFilename: 'REC_데이터구조론_20260304.wav' },
  { no: 2, sessionSeq: 202, buildingName: '신공학관', spaceName: '302호 강의실', userName: '이교수', sessionStatus: 'ACTIVE' as SpeechSessionStatus, sttEngine: 'Whisper', sttModel: 'large-v3', startedAt: '2026-03-04T10:00:00', endedAt: null, totalDurationSec: null, totalSegments: 45, totalCommands: 2, recordingFilename: 'REC_운영체제_20260304.wav' },
  { no: 3, sessionSeq: 203, buildingName: '공과대학', spaceName: '201호 강의실', userName: '박교수', sessionStatus: 'PAUSED' as SpeechSessionStatus, sttEngine: 'Vosk', sttModel: 'vosk-model-ko', startedAt: '2026-03-04T13:00:00', endedAt: null, totalDurationSec: null, totalSegments: 30, totalCommands: 1, recordingFilename: 'REC_알고리즘_20260304.wav' },
  { no: 4, sessionSeq: 204, buildingName: '경영관', spaceName: '101호 대강의실', userName: '최교수', sessionStatus: 'ENDED' as SpeechSessionStatus, sttEngine: 'Whisper', sttModel: 'large-v3', startedAt: '2026-03-03T14:00:00', endedAt: '2026-03-03T16:00:00', totalDurationSec: 7200, totalSegments: 195, totalCommands: 8, recordingFilename: 'REC_경영학원론_20260303.wav' },
  { no: 5, sessionSeq: 205, buildingName: '신공학관', spaceName: '301호 강의실', userName: '정교수', sessionStatus: 'ENDED' as SpeechSessionStatus, sttEngine: 'Whisper', sttModel: 'medium', startedAt: '2026-03-03T09:00:00', endedAt: '2026-03-03T10:30:00', totalDurationSec: 5400, totalSegments: 110, totalCommands: 3, recordingFilename: 'REC_컴퓨터네트워크_20260303.wav' },
  { no: 6, sessionSeq: 206, buildingName: '공과대학', spaceName: '201호 강의실', userName: '한교수', sessionStatus: 'ENDED' as SpeechSessionStatus, sttEngine: 'Vosk', sttModel: 'vosk-model-ko', startedAt: '2026-03-03T11:00:00', endedAt: '2026-03-03T12:15:00', totalDurationSec: 4500, totalSegments: 95, totalCommands: 4, recordingFilename: 'REC_선형대수_20260303.wav' },
  { no: 7, sessionSeq: 207, buildingName: '신공학관', spaceName: '302호 강의실', userName: '이교수', sessionStatus: 'ENDED' as SpeechSessionStatus, sttEngine: 'Whisper', sttModel: 'large-v3', startedAt: '2026-03-02T13:00:00', endedAt: '2026-03-02T14:30:00', totalDurationSec: 5400, totalSegments: 140, totalCommands: 6, recordingFilename: 'REC_소프트웨어공학_20260302.wav' },
  { no: 8, sessionSeq: 208, buildingName: '경영관', spaceName: '101호 대강의실', userName: '송교수', sessionStatus: 'ENDED' as SpeechSessionStatus, sttEngine: 'Whisper', sttModel: 'medium', startedAt: '2026-03-02T10:00:00', endedAt: '2026-03-02T11:30:00', totalDurationSec: 5400, totalSegments: 120, totalCommands: 3, recordingFilename: 'REC_마케팅원론_20260302.wav' },
];

const MOCK_SPEECH_LOGS: SpeechLogItem[] = [
  { speechLogSeq: 1, segmentText: '오늘은 이진트리에 대해 알아보겠습니다', segmentStartSec: 0, segmentEndSec: 3.5, confidence: 0.96, isCommand: 'N', createdAt: '2026-03-04T09:00:03' },
  { speechLogSeq: 2, segmentText: '화면 켜줘', segmentStartSec: 5.0, segmentEndSec: 6.2, confidence: 0.98, isCommand: 'Y', createdAt: '2026-03-04T09:00:06' },
  { speechLogSeq: 3, segmentText: '이진트리는 각 노드가 최대 두 개의 자식 노드를 가지는 트리 구조입니다', segmentStartSec: 8.0, segmentEndSec: 14.5, confidence: 0.94, isCommand: 'N', createdAt: '2026-03-04T09:00:14' },
  { speechLogSeq: 4, segmentText: '슬라이드 다음', segmentStartSec: 20.0, segmentEndSec: 21.5, confidence: 0.97, isCommand: 'Y', createdAt: '2026-03-04T09:00:21' },
  { speechLogSeq: 5, segmentText: '완전 이진트리와 포화 이진트리의 차이를 먼저 살펴보겠습니다', segmentStartSec: 25.0, segmentEndSec: 31.0, confidence: 0.92, isCommand: 'N', createdAt: '2026-03-04T09:00:31' },
  { speechLogSeq: 6, segmentText: '조명 밝게', segmentStartSec: 180.0, segmentEndSec: 181.5, confidence: 0.95, isCommand: 'Y', createdAt: '2026-03-04T09:03:01' },
  { speechLogSeq: 7, segmentText: '힙은 완전 이진트리를 기반으로 합니다', segmentStartSec: 2700.0, segmentEndSec: 2704.0, confidence: 0.93, isCommand: 'N', createdAt: '2026-03-04T09:45:04' },
  { speechLogSeq: 8, segmentText: '화면 꺼줘', segmentStartSec: 5390.0, segmentEndSec: 5391.5, confidence: 0.97, isCommand: 'Y', createdAt: '2026-03-04T10:29:51' },
];

const MOCK_COMMAND_LOGS: CommandLogItem[] = [
  { commandLogSeq: 1, sessionSeq: 201, voiceCommandSeq: 1, recognizedText: '화면 켜줘', matchedKeyword: '화면 켜', matchScore: 0.95, verifySource: 'LOCAL_VOSK', executionStatus: 'EXECUTED', executionResult: '프로젝터 전원 ON 성공', createdAt: '2026-03-04T09:00:06' },
  { commandLogSeq: 2, sessionSeq: 201, voiceCommandSeq: 2, recognizedText: '슬라이드 다음', matchedKeyword: '다음 슬라이드', matchScore: 0.88, verifySource: 'REMOTE_WHISPER', executionStatus: 'EXECUTED', executionResult: '슬라이드 넘김 성공', createdAt: '2026-03-04T09:00:21' },
  { commandLogSeq: 3, sessionSeq: 201, voiceCommandSeq: 3, recognizedText: '조명 밝게', matchedKeyword: '조명 밝게', matchScore: 0.97, verifySource: 'LOCAL_VOSK', executionStatus: 'EXECUTED', executionResult: '조명 밝기 100% 설정', createdAt: '2026-03-04T09:03:01' },
  { commandLogSeq: 4, sessionSeq: 201, voiceCommandSeq: null, recognizedText: '이건 명령이 아니에요', matchedKeyword: null, matchScore: 0.3, verifySource: 'LOCAL_VOSK', executionStatus: 'NO_MATCH', executionResult: null, createdAt: '2026-03-04T09:30:00' },
  { commandLogSeq: 5, sessionSeq: 201, voiceCommandSeq: 1, recognizedText: '화면 꺼줘', matchedKeyword: '화면 꺼', matchScore: 0.96, verifySource: 'LOCAL_VOSK', executionStatus: 'EXECUTED', executionResult: '프로젝터 전원 OFF 성공', createdAt: '2026-03-04T10:29:51' },
];

const MOCK_SPEECH_SESSION_DETAIL: SpeechSessionDetail = {
  sessionSeq: 201,
  spaceSeq: 10,
  buildingName: '신공학관',
  spaceName: '301호 강의실',
  tuSeq: 100,
  userName: '김교수',
  sessionStatus: 'ENDED',
  sttEngine: 'Whisper',
  sttModel: 'large-v3',
  startedAt: '2026-03-04T09:00:00',
  endedAt: '2026-03-04T10:30:00',
  totalDurationSec: 5400,
  totalSegments: 128,
  totalCommands: 5,
  recordingFilename: 'REC_데이터구조론_20260304.wav',
  summarySeq: 1,
  logs: MOCK_SPEECH_LOGS,
  commandLogs: MOCK_COMMAND_LOGS,
};

function paginateMock<T>(items: T[], page = 1, limit = 20): PaginatedResponse<T> {
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    total: items.length,
    page,
    limit,
    totalPages: Math.ceil(items.length / limit),
  };
}

// ============================================================

// ─── Param types ───

export interface GetLectureSummariesParams {
  page?: number;
  limit?: number;
  spaceSeq?: number;
  buildingSeq?: number;
  processStatus?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetSpeechSessionsParams {
  page?: number;
  limit?: number;
  spaceSeq?: number;
  sessionStatus?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetVoiceCommandsParams {
  spaceSeq?: number;
  search?: string;
}

// ─── Response wrappers ───

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── 1. Lecture Summary (강의요약) ───

export async function getLectureSummaries(
  params?: GetLectureSummariesParams,
): Promise<PaginatedResponse<LectureSummaryListItem>> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return paginateMock(MOCK_LECTURE_SUMMARIES, params?.page, params?.limit);
  }
  const response = await apiClient<ApiResponse<PaginatedResponse<LectureSummaryListItem>>>(
    '/ai-system/lecture-summaries',
    { method: 'GET', params },
  );
  if (!response.success || !response.data) {
    throw new Error('강의요약 목록 조회 실패');
  }
  return response.data;
}

export async function getLectureSummaryDetail(
  summarySeq: number,
): Promise<LectureSummaryDetail> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return { ...MOCK_LECTURE_SUMMARY_DETAIL, summarySeq };
  }
  const response = await apiClient<ApiResponse<LectureSummaryDetail>>(
    `/ai-system/lecture-summaries/${summarySeq}`,
    { method: 'GET' },
  );
  if (!response.success || !response.data) {
    throw new Error('강의요약 상세 조회 실패');
  }
  return response.data;
}

// ─── 2. Speech Session (음성인식 세션) ───

export async function getSpeechSessions(
  params?: GetSpeechSessionsParams,
): Promise<PaginatedResponse<SpeechSessionListItem>> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return paginateMock(MOCK_SPEECH_SESSIONS, params?.page, params?.limit);
  }
  const response = await apiClient<ApiResponse<PaginatedResponse<SpeechSessionListItem>>>(
    '/ai-system/speech-sessions',
    { method: 'GET', params },
  );
  if (!response.success || !response.data) {
    throw new Error('음성인식 세션 목록 조회 실패');
  }
  return response.data;
}

export async function getSpeechSessionDetail(
  sessionSeq: number,
): Promise<SpeechSessionDetail> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return { ...MOCK_SPEECH_SESSION_DETAIL, sessionSeq };
  }
  const response = await apiClient<ApiResponse<SpeechSessionDetail>>(
    `/ai-system/speech-sessions/${sessionSeq}`,
    { method: 'GET' },
  );
  if (!response.success || !response.data) {
    throw new Error('음성인식 세션 상세 조회 실패');
  }
  return response.data;
}

// ─── 3. Voice Command (음성 명령어) ───

export async function getVoiceCommands(
  params?: GetVoiceCommandsParams,
): Promise<{ items: VoiceCommandListItem[] }> {
  const response = await apiClient<ApiResponse<{ items: VoiceCommandListItem[] }>>(
    '/ai-system/voice-commands',
    { method: 'GET', params },
  );
  if (!response.success || !response.data) {
    throw new Error('음성 명령어 목록 조회 실패');
  }
  return response.data;
}

export async function createVoiceCommand(
  data: CreateVoiceCommandDto,
): Promise<{ voiceCommandSeq: number; message: string }> {
  const response = await apiClient<ApiResponse<{ voiceCommandSeq: number; message: string }>>(
    '/ai-system/voice-commands',
    { method: 'POST', body: data },
  );
  if (!response.success || !response.data) {
    throw new Error('음성 명령어 등록 실패');
  }
  return response.data;
}

export async function updateVoiceCommand(
  voiceCommandSeq: number,
  data: UpdateVoiceCommandDto,
): Promise<{ voiceCommandSeq: number; message: string }> {
  const response = await apiClient<ApiResponse<{ voiceCommandSeq: number; message: string }>>(
    `/ai-system/voice-commands/${voiceCommandSeq}`,
    { method: 'PUT', body: data },
  );
  if (!response.success || !response.data) {
    throw new Error('음성 명령어 수정 실패');
  }
  return response.data;
}

export async function deleteVoiceCommand(
  voiceCommandSeq: number,
): Promise<{ voiceCommandSeq: number; message: string }> {
  const response = await apiClient<ApiResponse<{ voiceCommandSeq: number; message: string }>>(
    `/ai-system/voice-commands/${voiceCommandSeq}`,
    { method: 'DELETE' },
  );
  if (!response.success || !response.data) {
    throw new Error('음성 명령어 삭제 실패');
  }
  return response.data;
}

// ─── 4. Worker Server (AI Worker 서버) ───

export async function getWorkerServers(): Promise<{ items: WorkerServerListItem[] }> {
  const response = await apiClient<ApiResponse<{ items: WorkerServerListItem[] }>>(
    '/ai-system/worker-servers',
    { method: 'GET' },
  );
  if (!response.success || !response.data) {
    throw new Error('Worker 서버 목록 조회 실패');
  }
  return response.data;
}

export async function getWorkerServerDetail(
  workerServerSeq: number,
): Promise<WorkerServerDetail> {
  const response = await apiClient<ApiResponse<WorkerServerDetail>>(
    `/ai-system/worker-servers/${workerServerSeq}`,
    { method: 'GET' },
  );
  if (!response.success || !response.data) {
    throw new Error('Worker 서버 상세 조회 실패');
  }
  return response.data;
}

export async function createWorkerServer(
  data: CreateWorkerServerDto,
): Promise<{ workerServerSeq: number; message: string }> {
  const response = await apiClient<ApiResponse<{ workerServerSeq: number; message: string }>>(
    '/ai-system/worker-servers',
    { method: 'POST', body: data },
  );
  if (!response.success || !response.data) {
    throw new Error('Worker 서버 등록 실패');
  }
  return response.data;
}

export async function updateWorkerServer(
  workerServerSeq: number,
  data: UpdateWorkerServerDto,
): Promise<{ workerServerSeq: number; message: string }> {
  const response = await apiClient<ApiResponse<{ workerServerSeq: number; message: string }>>(
    `/ai-system/worker-servers/${workerServerSeq}`,
    { method: 'PUT', body: data },
  );
  if (!response.success || !response.data) {
    throw new Error('Worker 서버 수정 실패');
  }
  return response.data;
}

export async function deleteWorkerServer(
  workerServerSeq: number,
): Promise<{ workerServerSeq: number; message: string }> {
  const response = await apiClient<ApiResponse<{ workerServerSeq: number; message: string }>>(
    `/ai-system/worker-servers/${workerServerSeq}`,
    { method: 'DELETE' },
  );
  if (!response.success || !response.data) {
    throw new Error('Worker 서버 삭제 실패');
  }
  return response.data;
}

export async function getWorkerHealth(
  workerServerSeq: number,
): Promise<WorkerHealthResponse> {
  const response = await apiClient<ApiResponse<WorkerHealthResponse>>(
    `/ai-system/worker-servers/${workerServerSeq}/health`,
    { method: 'GET' },
  );
  if (!response.success || !response.data) {
    throw new Error('Worker 서버 헬스체크 실패');
  }
  return response.data;
}
