import apiClient from './client';
import type {
  NfcReaderListResponse,
  NfcReaderDetail,
  CreateNfcReaderRequest,
  UpdateNfcReaderRequest,
  NfcCardListResponse,
  NfcCardDetail,
  CreateNfcCardRequest,
  UpdateNfcCardRequest,
  UnregisteredTagListResponse,
  NfcLogListResponse,
  NfcLogDetail,
  NfcStats,
  NfcTagRequest,
  NfcTagResponse,
  NfcReaderCommandMapping,
  UpdateNfcReaderCommandsRequest,
  UpdateNfcReaderCommandsResponse,
} from '@ku/types';

// ==================== 리더기 ====================

/** 리더기 목록 조회 */
export async function getReaders(params?: {
  page?: number;
  limit?: number;
  search?: string;
  buildingSeq?: number;
  spaceSeq?: number;
  status?: string;
}): Promise<NfcReaderListResponse> {
  return await apiClient<NfcReaderListResponse>('/nfc/readers', { params });
}

/** 리더기 상세 조회 (BE 응답의 중첩 space/building 구조를 flat으로 변환) */
export async function getReader(readerSeq: number): Promise<NfcReaderDetail> {
  const raw = await apiClient<Record<string, unknown>>(`/nfc/readers/${readerSeq}`);
  const space = raw.space as Record<string, unknown> | undefined;
  const building = space?.building as Record<string, unknown> | undefined;
  return {
    readerSeq: raw.readerSeq as number,
    readerName: raw.readerName as string,
    readerCode: raw.readerCode as string,
    readerSerial: (raw.readerSerial as string | null) ?? null,
    readerApiKey: raw.readerApiKey as string,
    readerStatus: raw.readerStatus as 'ACTIVE' | 'INACTIVE',
    spaceSeq: raw.spaceSeq as number,
    spaceName: (space?.spaceName as string) ?? '',
    spaceFloor: (space?.spaceFloor as string) ?? '',
    buildingSeq: (space?.buildingSeq as number) ?? (building?.buildingSeq as number) ?? 0,
    buildingName: (building?.buildingName as string) ?? '',
    readerIsdel: raw.readerIsdel as string,
    regDate: raw.regDate as string,
    updDate: raw.updDate as string,
  };
}

/** 리더기 등록 */
export async function createReader(dto: CreateNfcReaderRequest): Promise<NfcReaderDetail> {
  return await apiClient<NfcReaderDetail>('/nfc/readers', {
    method: 'POST',
    body: dto,
  });
}

/** 리더기 수정 */
export async function updateReader(readerSeq: number, dto: UpdateNfcReaderRequest): Promise<NfcReaderDetail> {
  return await apiClient<NfcReaderDetail>(`/nfc/readers/${readerSeq}`, {
    method: 'PUT',
    body: dto,
  });
}

/** 리더기 삭제 */
export async function deleteReader(readerSeq: number): Promise<void> {
  await apiClient(`/nfc/readers/${readerSeq}`, { method: 'DELETE' });
}

/** API Key 재발급 */
export async function regenerateReaderKey(readerSeq: number): Promise<{ readerSeq: number; readerApiKey: string; message: string }> {
  return await apiClient(`/nfc/readers/${readerSeq}/regenerate-key`, {
    method: 'POST',
  });
}

// ==================== 카드/태그 ====================

/** 등록된 카드 목록 조회 */
export async function getCards(params?: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
}): Promise<NfcCardListResponse> {
  return await apiClient<NfcCardListResponse>('/nfc/cards', { params });
}

/** 카드 상세 조회 */
export async function getCard(cardSeq: number): Promise<NfcCardDetail> {
  return await apiClient<NfcCardDetail>(`/nfc/cards/${cardSeq}`);
}

/** 미등록 태그 목록 조회 */
export async function getUnregisteredTags(params?: {
  page?: number;
  limit?: number;
}): Promise<UnregisteredTagListResponse> {
  return await apiClient<UnregisteredTagListResponse>('/nfc/cards/unregistered', { params });
}

/** 카드 등록 (승인) */
export async function createCard(dto: CreateNfcCardRequest): Promise<NfcCardDetail> {
  return await apiClient<NfcCardDetail>('/nfc/cards', {
    method: 'POST',
    body: dto,
  });
}

/** 카드 수정 */
export async function updateCard(cardSeq: number, dto: UpdateNfcCardRequest): Promise<NfcCardDetail> {
  return await apiClient<NfcCardDetail>(`/nfc/cards/${cardSeq}`, {
    method: 'PUT',
    body: dto,
  });
}

/** 카드 삭제 */
export async function deleteCard(cardSeq: number): Promise<void> {
  await apiClient(`/nfc/cards/${cardSeq}`, { method: 'DELETE' });
}

// ==================== 로그 ====================

/** 태깅 로그 목록 조회 */
export async function getLogs(params?: {
  page?: number;
  limit?: number;
  buildingSeq?: number;
  spaceSeq?: number;
  readerSeq?: number;
  logType?: string;
  controlResult?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}): Promise<NfcLogListResponse> {
  return await apiClient<NfcLogListResponse>('/nfc/logs', { params });
}

/** 태깅 로그 상세 조회 */
export async function getLogDetail(nfcLogSeq: number): Promise<NfcLogDetail> {
  return await apiClient<NfcLogDetail>(`/nfc/logs/${nfcLogSeq}`);
}

// ==================== 통계 ====================

/** NFC 대시보드 통계 */
export async function getStats(params?: {
  buildingSeq?: number;
}): Promise<NfcStats> {
  return await apiClient<NfcStats>('/nfc/stats', { params });
}

// ==================== 리더기 명령어 매핑 ====================

/** 리더기 명령어 매핑 조회 */
export async function getReaderCommands(readerSeq: number): Promise<NfcReaderCommandMapping> {
  return await apiClient<NfcReaderCommandMapping>(`/nfc/readers/${readerSeq}/commands`);
}

/** 리더기 명령어 매핑 저장 */
export async function updateReaderCommands(
  readerSeq: number,
  dto: UpdateNfcReaderCommandsRequest,
): Promise<UpdateNfcReaderCommandsResponse> {
  return await apiClient<UpdateNfcReaderCommandsResponse>(`/nfc/readers/${readerSeq}/commands`, {
    method: 'PUT',
    body: dto,
  });
}

// ==================== AID 태깅 테스트 ====================

/** AID 태깅 테스트 (콘솔에서 Agent 동작 시뮬레이션) */
export async function testNfcTag(
  apiKey: string,
  dto: NfcTagRequest
): Promise<NfcTagResponse> {
  return await apiClient<NfcTagResponse>('/nfc/tag', {
    method: 'POST',
    body: dto,
    headers: {
      'X-NFC-Api-Key': apiKey,
    },
  });
}
