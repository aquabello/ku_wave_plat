import { apiClient } from './client';
import type {
  RecordingSessionListItem,
  RecordingSessionDetail,
  RecordingFileListItem,
  RetryUploadResponse,
  ApiResponse,
  SessionStatus,
  FtpUploadStatus,
} from '@ku/types';
import type { RecorderPaginatedResponse } from './recorders';

// ============================================================
// MOCK DATA (BE 미연동 시 사용 — 연동 후 제거)
// ============================================================
const USE_MOCK = true;

const MOCK_SESSIONS: RecordingSessionListItem[] = [
  { no: 1, recSessionSeq: 101, recorderName: 'CAM-신공학관-301', buildingName: '신공학관', spaceName: '301호 강의실', sessionTitle: '데이터구조론 3주차', userName: '김교수', sessionStatus: 'COMPLETED' as SessionStatus, startedAt: '2026-03-04T09:00:00', endedAt: '2026-03-04T10:30:00', durationSec: 5400, fileCount: 3, presetName: '교탁 정면' },
  { no: 2, recSessionSeq: 102, recorderName: 'CAM-신공학관-302', buildingName: '신공학관', spaceName: '302호 강의실', sessionTitle: '운영체제 3주차', userName: '이교수', sessionStatus: 'COMPLETED' as SessionStatus, startedAt: '2026-03-04T10:00:00', endedAt: '2026-03-04T11:30:00', durationSec: 5400, fileCount: 2, presetName: '전체 화면' },
  { no: 3, recSessionSeq: 103, recorderName: 'CAM-공과대학-201', buildingName: '공과대학', spaceName: '201호 강의실', sessionTitle: '알고리즘 3주차', userName: '박교수', sessionStatus: 'RECORDING' as SessionStatus, startedAt: '2026-03-04T13:00:00', endedAt: null, durationSec: 1800, fileCount: 0, presetName: '칠판 확대' },
  { no: 4, recSessionSeq: 104, recorderName: 'CAM-경영관-101', buildingName: '경영관', spaceName: '101호 대강의실', sessionTitle: '경영학원론 특강', userName: '최교수', sessionStatus: 'FAILED' as SessionStatus, startedAt: '2026-03-03T14:00:00', endedAt: '2026-03-03T14:05:00', durationSec: 300, fileCount: 1, presetName: null },
  { no: 5, recSessionSeq: 105, recorderName: 'CAM-신공학관-301', buildingName: '신공학관', spaceName: '301호 강의실', sessionTitle: '컴퓨터네트워크 3주차', userName: '정교수', sessionStatus: 'COMPLETED' as SessionStatus, startedAt: '2026-03-03T09:00:00', endedAt: '2026-03-03T10:30:00', durationSec: 5400, fileCount: 2, presetName: '교탁 정면' },
  { no: 6, recSessionSeq: 106, recorderName: 'CAM-공과대학-201', buildingName: '공과대학', spaceName: '201호 강의실', sessionTitle: '선형대수 3주차', userName: '한교수', sessionStatus: 'COMPLETED' as SessionStatus, startedAt: '2026-03-03T11:00:00', endedAt: '2026-03-03T12:15:00', durationSec: 4500, fileCount: 2, presetName: '전체 화면' },
  { no: 7, recSessionSeq: 107, recorderName: 'CAM-경영관-101', buildingName: '경영관', spaceName: '101호 대강의실', sessionTitle: '마케팅원론 3주차', userName: '송교수', sessionStatus: 'CANCELLED' as SessionStatus, startedAt: '2026-03-02T10:00:00', endedAt: '2026-03-02T10:02:00', durationSec: 120, fileCount: 0, presetName: null },
  { no: 8, recSessionSeq: 108, recorderName: 'CAM-신공학관-302', buildingName: '신공학관', spaceName: '302호 강의실', sessionTitle: '소프트웨어공학 2주차', userName: '이교수', sessionStatus: 'COMPLETED' as SessionStatus, startedAt: '2026-03-02T13:00:00', endedAt: '2026-03-02T14:30:00', durationSec: 5400, fileCount: 3, presetName: '전체 화면' },
];

const MOCK_FILES: RecordingFileListItem[] = [
  { no: 1, recFileSeq: 1001, fileName: 'REC_데이터구조론_20260304_090000_part1.mp4', fileSize: 524288000, fileSizeFormatted: '500 MB', fileFormat: 'MP4', fileDurationSec: 1800, ftpStatus: 'COMPLETED' as FtpUploadStatus, ftpUploadedAt: '2026-03-04T11:00:00', ftpRetryCount: 0, ftpErrorMessage: null, sessionTitle: '데이터구조론 3주차', userName: '김교수', buildingName: '신공학관', spaceName: '301호 강의실', regDate: '2026-03-04T10:30:00' },
  { no: 2, recFileSeq: 1002, fileName: 'REC_데이터구조론_20260304_090000_part2.mp4', fileSize: 536870912, fileSizeFormatted: '512 MB', fileFormat: 'MP4', fileDurationSec: 1800, ftpStatus: 'COMPLETED' as FtpUploadStatus, ftpUploadedAt: '2026-03-04T11:15:00', ftpRetryCount: 0, ftpErrorMessage: null, sessionTitle: '데이터구조론 3주차', userName: '김교수', buildingName: '신공학관', spaceName: '301호 강의실', regDate: '2026-03-04T10:30:00' },
  { no: 3, recFileSeq: 1003, fileName: 'REC_데이터구조론_20260304_090000_part3.mp4', fileSize: 314572800, fileSizeFormatted: '300 MB', fileFormat: 'MP4', fileDurationSec: 1800, ftpStatus: 'UPLOADING' as FtpUploadStatus, ftpUploadedAt: null, ftpRetryCount: 0, ftpErrorMessage: null, sessionTitle: '데이터구조론 3주차', userName: '김교수', buildingName: '신공학관', spaceName: '301호 강의실', regDate: '2026-03-04T10:30:00' },
  { no: 4, recFileSeq: 1004, fileName: 'REC_운영체제_20260304_100000_part1.mp4', fileSize: 629145600, fileSizeFormatted: '600 MB', fileFormat: 'MP4', fileDurationSec: 2700, ftpStatus: 'COMPLETED' as FtpUploadStatus, ftpUploadedAt: '2026-03-04T12:00:00', ftpRetryCount: 0, ftpErrorMessage: null, sessionTitle: '운영체제 3주차', userName: '이교수', buildingName: '신공학관', spaceName: '302호 강의실', regDate: '2026-03-04T11:30:00' },
  { no: 5, recFileSeq: 1005, fileName: 'REC_운영체제_20260304_100000_part2.mp4', fileSize: 524288000, fileSizeFormatted: '500 MB', fileFormat: 'MP4', fileDurationSec: 2700, ftpStatus: 'FAILED' as FtpUploadStatus, ftpUploadedAt: null, ftpRetryCount: 3, ftpErrorMessage: 'FTP 서버 연결 시간 초과', sessionTitle: '운영체제 3주차', userName: '이교수', buildingName: '신공학관', spaceName: '302호 강의실', regDate: '2026-03-04T11:30:00' },
  { no: 6, recFileSeq: 1006, fileName: 'REC_경영학원론_20260303_140000.mp4', fileSize: 52428800, fileSizeFormatted: '50 MB', fileFormat: 'MP4', fileDurationSec: 300, ftpStatus: 'FAILED' as FtpUploadStatus, ftpUploadedAt: null, ftpRetryCount: 2, ftpErrorMessage: '녹화 세션 비정상 종료로 인한 파일 손상', sessionTitle: '경영학원론 특강', userName: '최교수', buildingName: '경영관', spaceName: '101호 대강의실', regDate: '2026-03-03T14:05:00' },
  { no: 7, recFileSeq: 1007, fileName: 'REC_컴퓨터네트워크_20260303_090000_part1.mp4', fileSize: 524288000, fileSizeFormatted: '500 MB', fileFormat: 'MP4', fileDurationSec: 2700, ftpStatus: 'COMPLETED' as FtpUploadStatus, ftpUploadedAt: '2026-03-03T11:30:00', ftpRetryCount: 0, ftpErrorMessage: null, sessionTitle: '컴퓨터네트워크 3주차', userName: '정교수', buildingName: '신공학관', spaceName: '301호 강의실', regDate: '2026-03-03T10:30:00' },
  { no: 8, recFileSeq: 1008, fileName: 'REC_컴퓨터네트워크_20260303_090000_part2.mp4', fileSize: 419430400, fileSizeFormatted: '400 MB', fileFormat: 'MP4', fileDurationSec: 2700, ftpStatus: 'PENDING' as FtpUploadStatus, ftpUploadedAt: null, ftpRetryCount: 0, ftpErrorMessage: null, sessionTitle: '컴퓨터네트워크 3주차', userName: '정교수', buildingName: '신공학관', spaceName: '301호 강의실', regDate: '2026-03-03T10:30:00' },
  { no: 9, recFileSeq: 1009, fileName: 'REC_소프트웨어공학_20260302_130000_part1.mp4', fileSize: 524288000, fileSizeFormatted: '500 MB', fileFormat: 'MP4', fileDurationSec: 1800, ftpStatus: 'COMPLETED' as FtpUploadStatus, ftpUploadedAt: '2026-03-02T15:30:00', ftpRetryCount: 1, ftpErrorMessage: null, sessionTitle: '소프트웨어공학 2주차', userName: '이교수', buildingName: '신공학관', spaceName: '302호 강의실', regDate: '2026-03-02T14:30:00' },
  { no: 10, recFileSeq: 1010, fileName: 'REC_소프트웨어공학_20260302_130000_part2.mp4', fileSize: 524288000, fileSizeFormatted: '500 MB', fileFormat: 'MP4', fileDurationSec: 1800, ftpStatus: 'RETRY' as FtpUploadStatus, ftpUploadedAt: null, ftpRetryCount: 2, ftpErrorMessage: 'FTP 인증 실패', sessionTitle: '소프트웨어공학 2주차', userName: '이교수', buildingName: '신공학관', spaceName: '302호 강의실', regDate: '2026-03-02T14:30:00' },
];

const MOCK_SESSION_DETAIL: RecordingSessionDetail = {
  recSessionSeq: 101,
  recorderSeq: 1,
  recorderName: 'CAM-신공학관-301',
  buildingName: '신공학관',
  spaceName: '301호 강의실',
  sessionTitle: '데이터구조론 3주차',
  userName: '김교수',
  sessionStatus: 'COMPLETED',
  presetName: '교탁 정면',
  startedAt: '2026-03-04T09:00:00',
  endedAt: '2026-03-04T10:30:00',
  durationSec: 5400,
  files: [
    { recFileSeq: 1001, fileName: 'REC_데이터구조론_20260304_090000_part1.mp4', filePath: '/recordings/2026/03/04/', fileSize: 524288000, fileFormat: 'MP4', fileDurationSec: 1800, ftpStatus: 'COMPLETED', ftpUploadedPath: '/ftp/lectures/2026/03/', ftpUploadedAt: '2026-03-04T11:00:00', ftpRetryCount: 0 },
    { recFileSeq: 1002, fileName: 'REC_데이터구조론_20260304_090000_part2.mp4', filePath: '/recordings/2026/03/04/', fileSize: 536870912, fileFormat: 'MP4', fileDurationSec: 1800, ftpStatus: 'COMPLETED', ftpUploadedPath: '/ftp/lectures/2026/03/', ftpUploadedAt: '2026-03-04T11:15:00', ftpRetryCount: 0 },
    { recFileSeq: 1003, fileName: 'REC_데이터구조론_20260304_090000_part3.mp4', filePath: '/recordings/2026/03/04/', fileSize: 314572800, fileFormat: 'MP4', fileDurationSec: 1800, ftpStatus: 'UPLOADING', ftpUploadedPath: null, ftpUploadedAt: null, ftpRetryCount: 0 },
  ],
};

function paginateMock<T>(items: T[], page = 1, limit = 20): RecorderPaginatedResponse<T> {
  const start = (page - 1) * limit;
  const paginatedItems = items.slice(start, start + limit);
  return {
    items: paginatedItems,
    total: items.length,
    page,
    limit,
    totalPages: Math.ceil(items.length / limit),
  };
}

// ============================================================

export interface GetSessionsParams {
  page?: number;
  limit?: number;
  buildingSeq?: number;
  recorderSeq?: number;
  tuSeq?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface GetFilesParams {
  page?: number;
  limit?: number;
  buildingSeq?: number;
  ftpStatus?: string;
  startDate?: string;
  endDate?: string;
}

export async function getSessions(params?: GetSessionsParams): Promise<RecorderPaginatedResponse<RecordingSessionListItem>> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return paginateMock(MOCK_SESSIONS, params?.page, params?.limit);
  }
  const response = await apiClient<ApiResponse<RecorderPaginatedResponse<RecordingSessionListItem>>>('/recordings/sessions', {
    method: 'GET',
    params,
  });
  if (!response.success || !response.data) {
    throw new Error('녹화 세션 목록 조회 실패');
  }
  return response.data;
}

export async function getSessionDetail(recSessionSeq: number): Promise<RecordingSessionDetail> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return { ...MOCK_SESSION_DETAIL, recSessionSeq };
  }
  const response = await apiClient<ApiResponse<RecordingSessionDetail>>(`/recordings/sessions/${recSessionSeq}`, {
    method: 'GET',
  });
  if (!response.success || !response.data) {
    throw new Error('녹화 세션 상세 조회 실패');
  }
  return response.data;
}

export async function getFiles(params?: GetFilesParams): Promise<RecorderPaginatedResponse<RecordingFileListItem>> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return paginateMock(MOCK_FILES, params?.page, params?.limit);
  }
  const response = await apiClient<ApiResponse<RecorderPaginatedResponse<RecordingFileListItem>>>('/recordings/files', {
    method: 'GET',
    params,
  });
  if (!response.success || !response.data) {
    throw new Error('녹화 파일 목록 조회 실패');
  }
  return response.data;
}

export interface FilePreviewInfo {
  recFileSeq: number;
  fileName: string;
  fileFormat: string;
  fileDurationSec: number;
  fileSize: string;
  fileSizeFormatted: string;
  previewPath: string;
}

export async function previewFile(recFileSeq: number): Promise<FilePreviewInfo> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    const mockFile = MOCK_FILES.find((f) => f.recFileSeq === recFileSeq) ?? MOCK_FILES[0];
    return {
      recFileSeq: mockFile.recFileSeq,
      fileName: mockFile.fileName,
      fileFormat: mockFile.fileFormat,
      fileDurationSec: mockFile.fileDurationSec,
      fileSize: String(mockFile.fileSize),
      fileSizeFormatted: mockFile.fileSizeFormatted,
      previewPath: `/ftp/ku_wave/${mockFile.fileName.slice(4, 12)}/${mockFile.fileName}`,
    };
  }
  const response = await apiClient<ApiResponse<FilePreviewInfo>>(`/recordings/files/${recFileSeq}/preview`, {
    method: 'GET',
  });
  if (!response.success || !response.data) {
    throw new Error('파일 미리보기 정보 조회 실패');
  }
  return response.data;
}

export async function downloadFile(recFileSeq: number): Promise<string> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    const blob = new Blob(['mock video data'], { type: 'video/mp4' });
    return URL.createObjectURL(blob);
  }
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE_URL}/recordings/files/${recFileSeq}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 403) {
    throw new Error('녹화를 진행한 사용자만 다운로드할 수 있습니다.');
  }
  if (!res.ok) {
    throw new Error('파일 다운로드 실패');
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function retryUpload(recFileSeq: number): Promise<RetryUploadResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return { recFileSeq, ftpStatus: 'RETRY' as const, ftpRetryCount: 0, message: 'FTP 업로드 재시도가 예약되었습니다' };
  }
  const response = await apiClient<ApiResponse<RetryUploadResponse>>(`/recordings/files/${recFileSeq}/retry-upload`, {
    method: 'POST',
  });
  if (!response.success || !response.data) {
    throw new Error('FTP 업로드 재시도 실패');
  }
  return response.data;
}
