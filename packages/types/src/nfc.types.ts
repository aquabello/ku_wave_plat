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
