// =============================================
// NFC Agent Configuration
// =============================================

export interface NfcAgentConfig {
  apiUrl: string;
  apiKey: string;
  retryInterval: number;
  offlineQueueMax: number;
  buzzerEnabled: boolean;
  logLevel: string;
  wsEnabled: boolean;
  wsPort: number;
  aidList: string[];
}

// =============================================
// NFC Tag API (Agent → BE)
// =============================================

/** Agent → BE: POST /nfc/tag 요청 */
export interface NfcTagRequest {
  identifier: string;
  aid?: string;
}

/** BE → Agent: POST /nfc/tag 응답 */
export interface NfcTagResponse {
  result: 'SUCCESS' | 'PARTIAL' | 'DENIED' | 'UNKNOWN' | 'ERROR';
  logType: 'ENTER' | 'EXIT' | 'DENIED' | 'UNKNOWN';
  spaceName: string;
  userName: string | null;
  controlResult: 'SUCCESS' | 'FAIL' | 'PARTIAL' | 'SKIPPED' | null;
  controlSummary: NfcControlSummary | null;
  message: string;
}

export interface NfcControlSummary {
  totalDevices: number;
  successCount: number;
  failCount: number;
}

// =============================================
// NFC Reader (Console CRUD)
// =============================================

export interface NfcReader {
  readerSeq: number;
  spaceSeq: number;
  readerName: string;
  readerCode: string;
  readerSerial: string | null;
  readerApiKey: string;
  readerStatus: 'ACTIVE' | 'INACTIVE';
  readerIsdel: string;
  regDate: string;
  updDate: string;
}

export interface NfcReaderListItem {
  no: number;
  readerSeq: number;
  readerName: string;
  readerCode: string;
  readerSerial: string | null;
  readerStatus: 'ACTIVE' | 'INACTIVE';
  spaceSeq: number;
  spaceName: string;
  buildingName: string;
  regDate: string;
}

export interface CreateNfcReaderRequest {
  spaceSeq: number;
  readerName: string;
  readerSerial?: string;
}

export interface UpdateNfcReaderRequest {
  spaceSeq?: number;
  readerName?: string;
  readerSerial?: string;
  readerStatus?: 'ACTIVE' | 'INACTIVE';
}

// =============================================
// NFC Card (Console CRUD)
// =============================================

export interface NfcCard {
  cardSeq: number;
  tuSeq: number;
  cardIdentifier: string;
  cardAid: string | null;
  cardLabel: string | null;
  cardType: 'CARD' | 'PHONE';
  cardStatus: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  cardIsdel: string;
  regDate: string;
  updDate: string;
}

export interface NfcCardListItem {
  no: number;
  cardSeq: number;
  tuSeq: number;
  userName: string;
  cardIdentifier: string;
  cardAid: string | null;
  cardLabel: string | null;
  cardType: 'CARD' | 'PHONE';
  cardStatus: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  lastTaggedAt: string | null;
  regDate: string;
}

export interface CreateNfcCardRequest {
  tuSeq: number;
  cardIdentifier: string;
  cardAid?: string;
  cardLabel?: string;
  cardType?: 'CARD' | 'PHONE';
}

export interface UpdateNfcCardRequest {
  tuSeq?: number;
  cardAid?: string;
  cardLabel?: string;
  cardType?: 'CARD' | 'PHONE';
  cardStatus?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

// =============================================
// NFC Log
// =============================================

export type NfcLogType = 'ENTER' | 'EXIT' | 'DENIED' | 'UNKNOWN';
export type NfcControlResult = 'SUCCESS' | 'FAIL' | 'PARTIAL' | 'SKIPPED';

export interface NfcLogListItem {
  no: number;
  nfcLogSeq: number;
  readerName: string;
  readerCode: string;
  spaceName: string;
  buildingName: string;
  userName: string | null;
  cardLabel: string | null;
  logType: NfcLogType;
  tagIdentifier: string;
  controlResult: NfcControlResult | null;
  controlSummary: NfcControlSummary | null;
  taggedAt: string;
}

export interface NfcLogDetail {
  nfcLogSeq: number;
  readerSeq: number;
  readerName: string;
  readerCode: string;
  spaceSeq: number;
  spaceName: string;
  buildingName: string;
  cardSeq: number | null;
  userName: string | null;
  cardLabel: string | null;
  cardType: 'CARD' | 'PHONE' | null;
  logType: NfcLogType;
  tagIdentifier: string;
  tagAid: string | null;
  controlResult: NfcControlResult | null;
  controlDetails: NfcControlDetailItem[];
  taggedAt: string;
}

export interface NfcControlDetailItem {
  spaceDeviceSeq: number;
  deviceName: string;
  commandType: string;
  resultStatus: 'SUCCESS' | 'FAIL' | 'TIMEOUT';
  resultMessage: string | null;
}

// =============================================
// NFC Stats (Dashboard)
// =============================================

export interface NfcStats {
  readers: {
    total: number;
    active: number;
    inactive: number;
  };
  cards: {
    total: number;
    active: number;
    blocked: number;
    inactive: number;
    byType: {
      CARD: number;
      PHONE: number;
    };
  };
  today: {
    totalTags: number;
    enters: number;
    exits: number;
    denied: number;
    unknown: number;
  };
  activeSpaces: NfcActiveSpace[];
}

export interface NfcActiveSpace {
  spaceSeq: number;
  spaceName: string;
  currentUser: string;
  enteredAt: string;
}

// =============================================
// Paginated Response Types
// =============================================

export interface NfcReaderListResponse {
  items: NfcReaderListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NfcCardListResponse {
  items: NfcCardListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NfcLogListResponse {
  items: NfcLogListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =============================================
// NFC Reader Detail (includes API Key + building info)
// =============================================

export interface NfcReaderDetail {
  readerSeq: number;
  readerName: string;
  readerCode: string;
  readerSerial: string | null;
  readerApiKey: string;
  readerStatus: 'ACTIVE' | 'INACTIVE';
  spaceSeq: number;
  spaceName: string;
  spaceFloor: string;
  buildingSeq: number;
  buildingName: string;
  readerIsdel: string;
  regDate: string;
  updDate: string;
}

// =============================================
// NFC Card Detail (includes tagCount, userEmail)
// =============================================

export interface NfcCardDetail {
  cardSeq: number;
  tuSeq: number;
  userName: string;
  userEmail: string;
  cardIdentifier: string;
  cardAid: string | null;
  cardLabel: string | null;
  cardType: 'CARD' | 'PHONE';
  cardStatus: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  cardIsdel: string;
  lastTaggedAt: string | null;
  tagCount: number;
  regDate: string;
  updDate: string;
}

// =============================================
// Unregistered Tag (from NFC logs with unknown cards)
// =============================================

export interface UnregisteredTagItem {
  tagIdentifier: string;
  tagAid: string | null;
  firstTaggedAt: string;
  lastTaggedAt: string;
  tagCount: number;
  lastReaderName: string;
  lastSpaceName: string;
}

export interface UnregisteredTagListResponse {
  items: UnregisteredTagItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// =============================================
// NFC WebSocket Events (Agent → FE Console)
// =============================================

/** WebSocket 이벤트 타입 */
export type NfcWsEventType = 'tag' | 'scan' | 'reader_connected' | 'reader_disconnected' | 'heartbeat';

/** 공통 WebSocket 메시지 구조 */
export interface NfcWsMessage<T = unknown> {
  event: NfcWsEventType;
  timestamp: string;
  data: T;
}

/** tag 이벤트 데이터: 태깅 요청 + 응답 */
export interface NfcWsTagEventData {
  request: NfcTagRequest;
  response: NfcTagResponse;
}

/** reader_connected / reader_disconnected 이벤트 데이터 */
export interface NfcWsReaderEventData {
  readerName: string;
}

/** scan 이벤트 데이터: 카드/폰 상세 스캔 결과 */
export interface NfcWsScanEventData {
  uid: string;
  atr: string;
  cardType: string;
  aidResults: NfcAidScanResult[];
  matchedAids: string[];
}

/** 개별 AID SELECT 시도 결과 */
export interface NfcAidScanResult {
  aid: string;
  label: string;
  status: 'SUCCESS' | 'FAIL' | 'ERROR';
  sw: string;
  responseData: string | null;
  /** SELECT 성공 시 추가로 읽은 앱 데이터 */
  appData: NfcAppData | null;
}

/** SELECT AID 성공 후 읽은 앱 내부 데이터 */
export interface NfcAppData {
  /** 카드/앱 시리얼 번호 (유니크 식별값) */
  serialNumber: string | null;
  /** FCI (File Control Information) */
  fci: string | null;
  /** 잔액 (교통카드 등) */
  balance: number | null;
  /** 추가 레코드 데이터 */
  records: { sfi: number; record: number; data: string }[];
}

/** heartbeat 이벤트 데이터 */
export interface NfcWsHeartbeatData {
  uptime: number;
  connectedClients: number;
  readerConnected: boolean;
}

// =============================================
// NFC Reader Command Mapping
// =============================================

/** 명령어 매핑 조회 응답 */
export interface NfcReaderCommandMapping {
  readerSeq: number;
  readerName: string;
  spaceSeq: number;
  spaceName: string;
  buildingName: string;
  devices: NfcReaderCommandDevice[];
  mappedCount: number;
  totalDevices: number;
}

/** 명령어 매핑 대상 장비 */
export interface NfcReaderCommandDevice {
  spaceDeviceSeq: number;
  deviceName: string;
  presetName: string;
  deviceStatus: 'ACTIVE' | 'INACTIVE';
  isMapped: boolean;
  enterCommand: NfcDeviceCommand | null;
  exitCommand: NfcDeviceCommand | null;
  availableCommands: NfcDeviceCommand[];
}

/** 장비 프리셋 명령어 */
export interface NfcDeviceCommand {
  commandSeq: number;
  commandName: string;
  commandCode?: string;
  commandType: string;
}

/** 명령어 매핑 저장 요청 */
export interface UpdateNfcReaderCommandsRequest {
  mappings?: NfcReaderCommandMappingItem[];
  mapAll?: boolean;
}

/** 개별 장비 매핑 항목 */
export interface NfcReaderCommandMappingItem {
  spaceDeviceSeq: number;
  enterCommandSeq: number | null;
  exitCommandSeq: number | null;
}

/** 명령어 매핑 저장 응답 */
export interface UpdateNfcReaderCommandsResponse {
  readerSeq: number;
  readerName: string;
  mappedCount: number;
  mappings: {
    spaceDeviceSeq: number;
    deviceName: string;
    enterCommandName: string | null;
    exitCommandName: string | null;
  }[];
  message: string;
}
