import { NFC } from 'nfc-pcsc';
import { NfcAgentConfig, NfcTagRequest, NfcTagResponse, NfcAidScanResult, NfcWsScanEventData, NfcAppData } from '@ku/types';
import { ApiClient } from './api-client';
import { BuzzerController } from './buzzer';
import { NfcWsServer } from './ws-server';
import { logger } from './logger';

export type NfcMode = 'tag' | 'aid-test';

export class NfcReader {
  private nfc: any = null;
  private currentReader: any = null;
  private mode: NfcMode = 'tag';
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastTagTime = 0; // 태깅 중복 방지 (밀리초)
  private processing = false; // 처리 중 락

  constructor(
    private config: NfcAgentConfig,
    private apiClient: ApiClient,
    private buzzer: BuzzerController,
    private wsServer: NfcWsServer,
  ) {}

  start(): void {
    logger.info('NFC 리더기 대기 중...');
    this.nfc = new NFC();

    this.nfc.on('reader', (reader: any) => {
      reader.autoProcessing = false;

      reader.on('error', (err: any) => {
        if (err.message?.includes('AID was not set')) {
          logger.debug('[리더기] ISO 14443-4 AID 에러 무시 (수동 처리)');
          return;
        }
        logger.error(`[리더기 오류] ${err.message}`);
      });

      logger.info(`[리더기 연결] ${reader.name}`);
      this.currentReader = reader;
      this.wsServer.setReaderConnected(true, reader.name);
      this.wsServer.broadcastReaderConnected(reader.name);

      this.buzzer.setReader(reader.reader);

      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      reader.on('card', async (card: any) => {
        // 중복 방지: 처리 중이거나 5초 이내 재태깅
        if (this.processing) {
          logger.info('[카드 감지] 이전 태깅 처리 중 — 무시');
          try { this.buzzer.cooldown(); } catch { /* ignore */ }
          return;
        }
        const now = Date.now();
        const elapsed = now - this.lastTagTime;
        if (elapsed < 5000) {
          logger.info(`[카드 감지] ${Math.ceil((5000 - elapsed) / 1000)}초 후 태깅 가능 — 무시`);
          try { this.buzzer.cooldown(); } catch { /* ignore */ }
          return;
        }
        this.processing = true;
        this.lastTagTime = now;
        try {
          await this.handleTag(reader, card);
        } finally {
          this.processing = false;
        }
      });

      reader.on('card.off', () => {
        logger.debug('[카드 제거]');
      });

      reader.on('end', () => {
        logger.warn('[리더기 연결 해제]');
        this.wsServer.setReaderConnected(false);
        this.wsServer.broadcastReaderDisconnected(reader.name);
        this.currentReader = null;
        this.buzzer.clearReader();
        this.scheduleReconnect();
      });
    });

    this.nfc.on('error', (err: any) => {
      logger.error(`[NFC 오류] ${err.message}`);
    });
  }

  stop(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.currentReader) {
      logger.info('리더기 연결 해제...');
    }
  }

  setMode(mode: NfcMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    logger.info(`[모드 전환] ${mode === 'tag' ? '태그 모드' : 'AID 테스트 모드'}`);
  }

  getMode(): NfcMode {
    return this.mode;
  }

  private scheduleReconnect(): void {
    logger.info('[자동 재연결] 5초 후 리더기 재연결 시도...');
    this.reconnectTimer = setTimeout(() => {
      if (this.currentReader) return;
      logger.info('[자동 재연결] NFC 서비스 재시작 중...');
      try {
        this.nfc = new NFC();
        this.start();
      } catch (err: any) {
        logger.error(`[자동 재연결] 실패: ${err.message}`);
        this.scheduleReconnect();
      }
    }, 5000);
  }

  /** 저수준 pcsclite connect (nfc-pcsc connect 실패 시 fallback) */
  private rawConnect(reader: any): Promise<number> {
    return new Promise((resolve, reject) => {
      const raw = reader.reader; // pcsclite CardReader
      raw.connect({ share_mode: raw.SCARD_SHARE_SHARED }, (err: any, protocol: number) => {
        if (err) return reject(err);
        resolve(protocol);
      });
    });
  }

  /** 저수준 pcsclite transmit */
  private rawTransmit(reader: any, data: Buffer, resLen: number, protocol: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const raw = reader.reader;
      raw.transmit(data, resLen, protocol, (err: any, response: Buffer) => {
        if (err) return reject(err);
        resolve(response);
      });
    });
  }

  private async handleTag(reader: any, card: any): Promise<void> {
    let uid = card.uid || '';

    // 연결: nfc-pcsc connect 시도 → 실패 시 저수준 fallback
    let rawProtocol: number | null = null;
    let connected = false;
    try {
      await reader.connect();
      connected = true;
    } catch {
      try {
        rawProtocol = await this.rawConnect(reader);
        connected = true;
        logger.debug(`[저수준 연결] protocol=${rawProtocol}`);
      } catch (err: any) {
        logger.warn(`[연결 실패] ${err.message}`);
      }
    }

    // transmit 래퍼: 연결 방식에 따라 분기
    const transmit = async (data: Buffer, resLen: number): Promise<Buffer> => {
      if (rawProtocol !== null) {
        return this.rawTransmit(reader, data, resLen, rawProtocol);
      }
      return reader.transmit(data, resLen);
    };

    if (!uid && connected) {
      try {
        const getUidCmd = Buffer.from([0xFF, 0xCA, 0x00, 0x00, 0x00]);
        const uidResponse = await transmit(getUidCmd, 256);
        const sw = uidResponse.slice(-2);
        if (sw[0] === 0x90 && sw[1] === 0x00) {
          uid = uidResponse.slice(0, -2).toString('hex').toUpperCase();
        }
      } catch (err: any) {
        logger.warn(`[UID 읽기 실패] ${err.message}`);
      }
    }

    const atr = card.atr?.toString('hex').toUpperCase() ?? '';
    logger.info('────────────────────────────────────────');
    logger.info(`[태깅] UID: ${uid || '-'} | ATR: ${atr || '-'}`);

    // AID 스캔 (1회 시도, 실패 시 재태깅 요청)
    const scan = await this.scanAllAids(reader, transmit);
    const aidResults = scan.aidResults;
    const firstMatchedAid = scan.firstMatchedAid;
    const matchedAids = aidResults.filter(r => r.status === 'SUCCESS').map(r => r.aid);

    const scanData: NfcWsScanEventData = {
      uid: uid || 'UNKNOWN',
      atr,
      cardType: this.detectCardType(atr),
      aidResults,
      matchedAids,
    };
    this.wsServer.broadcastScan(scanData);

    if (firstMatchedAid) {
      logger.info(`[AID] ${firstMatchedAid} 매칭`);
    } else {
      logger.warn(`[AID] 매칭 실패 — 다시 태깅해주세요`);
    }

    if (this.mode === 'aid-test') {
      logger.info('[AID 테스트 모드] API 호출 생략, 스캔 결과만 브로드캐스트');
      return;
    }

    // identifier 결정: AID 시리얼 > UID (랜덤 UID 카드 대응)
    let identifier = '';

    // 1순위: AID SELECT 후 카드 고유 시리얼 읽기
    if (firstMatchedAid && connected) {
      try {
        // GET DATA (카드 시리얼)
        const getSerial = Buffer.from([0x80, 0xCA, 0x00, 0x04, 0x00]);
        const resp = await transmit(getSerial, 256);
        const sw = resp.slice(-2);
        if (sw[0] === 0x90 && sw[1] === 0x00 && resp.length > 2) {
          identifier = resp.slice(0, -2).toString('hex').toUpperCase();
        }
      } catch { /* GET DATA 미지원 */ }

      // GET DATA 실패 시 FCI 응답 사용
      if (!identifier) {
        const matchedResult = aidResults.find(r => r.status === 'SUCCESS' && r.appData?.serialNumber);
        if (matchedResult?.appData?.serialNumber) {
          identifier = matchedResult.appData.serialNumber;
        }
      }
    }

    // UID fallback 사용 안 함 (랜덤 UID 카드 중복 등록 방지)
    // AID 스캔 실패 시 재태깅 요청

    if (!identifier) {
      logger.warn('[식별 실패] 다시 태깅해주세요');
      try { this.buzzer.cooldown(); } catch { /* 카드 제거됨 */ }
      return;
    }

    const request: NfcTagRequest = {
      identifier,
      aid: firstMatchedAid || undefined,
    };

    logger.info(`[API 전송] POST /nfc/tag | identifier: ${identifier.substring(0, 20)}... | aid: ${firstMatchedAid ?? '없음'}`);

    try {
      const response = await this.apiClient.sendTag(request);
      const label = (response as any).cardLabel ?? '-';
      const ctrlResult = response.controlResult ?? '-';
      const ctrl = response.controlSummary ? `${response.controlSummary.successCount}/${response.controlSummary.totalDevices}` : '-';
      if (response.result === 'SUCCESS' || response.result === 'PARTIAL') {
        logger.info(`[API 결과] 성공 | ${response.logType === 'ENTER' ? '입실' : '퇴실'} | 카드: ${label} | 장비제어: ${ctrlResult}(${ctrl}) | ${response.message}`);
      } else if (response.result === 'DENIED') {
        logger.warn(`[API 결과] 거부 | 카드: ${label} | ${response.message}`);
      } else {
        logger.info(`[API 결과] ${response.result} | ${response.message}`);
      }
      this.wsServer.broadcastTag(request, response);
      this.handleResponse(response, identifier);
    } catch (err: any) {
      logger.error(`[API 실패] ${err.message}`);
      try { this.buzzer.error(); } catch { /* 카드 제거됨 */ }
    }
  }

  private static readonly AID_LABELS: Record<string, string> = {
    'D4100000030001': 'T-money (티머니)',
    'A0000000041010': 'Mastercard',
    'A0000000031010': 'Visa',
    'A000000025010104': 'American Express',
    'D4100000150001': 'Cashbee (캐시비)',
    'A0000004760101': 'Payco',
    'A00000000401': 'EB 카드',
  };

  private async scanAllAids(reader: any, transmit: (data: Buffer, resLen: number) => Promise<Buffer>): Promise<{
    aidResults: NfcAidScanResult[];
    firstMatchedAid: string | null;
  }> {
    const aidResults: NfcAidScanResult[] = [];
    let firstMatchedAid: string | null = null;

    for (const aidHex of this.config.aidList) {
      const label = NfcReader.AID_LABELS[aidHex.toUpperCase()] ?? 'Unknown';

      try {
        const aidBytes = Buffer.from(aidHex, 'hex');
        const selectCmd = Buffer.from([
          0x00, 0xA4, 0x04, 0x00,
          aidBytes.length,
          ...aidBytes,
        ]);

        logger.debug(`[AID SCAN] ${aidHex} (${label}) 시도...`);
        const response = await transmit(selectCmd, 256);
        const sw = response.slice(-2);
        const swHex = sw.toString('hex').toUpperCase();
        const responseData = response.length > 2
          ? response.slice(0, -2).toString('hex').toUpperCase()
          : null;

        if (sw[0] === 0x90 && sw[1] === 0x00) {
          logger.info(`[AID SCAN] ${aidHex} (${label}) ✓ 성공 (SW: ${swHex})`);
          // 태그 모드: FCI만으로 식별, readAppData 생략 (약 5초 단축)
          const appData = this.mode === 'tag'
            ? { serialNumber: responseData, fci: responseData, balance: null, records: [] }
            : await this.readAppData(transmit, aidHex, responseData);
          aidResults.push({ aid: aidHex, label, status: 'SUCCESS', sw: swHex, responseData, appData });
          if (!firstMatchedAid) firstMatchedAid = aidHex;
        } else if (sw[0] === 0x61) {
          logger.info(`[AID SCAN] ${aidHex} (${label}) ✓ 성공 (SW: ${swHex}, 추가 ${sw[1]}B)`);
          const appData = this.mode === 'tag'
            ? { serialNumber: responseData, fci: responseData, balance: null, records: [] }
            : await this.readAppData(transmit, aidHex, responseData);
          aidResults.push({ aid: aidHex, label, status: 'SUCCESS', sw: swHex, responseData, appData });
          if (!firstMatchedAid) firstMatchedAid = aidHex;
        } else {
          logger.debug(`[AID SCAN] ${aidHex} (${label}) ✗ 실패 (SW: ${swHex})`);
          aidResults.push({ aid: aidHex, label, status: 'FAIL', sw: swHex, responseData: null, appData: null });
        }
      } catch (err: any) {
        logger.debug(`[AID SCAN] ${aidHex} (${label}) ✗ 오류: ${err.message}`);
        aidResults.push({ aid: aidHex, label, status: 'ERROR', sw: '', responseData: null, appData: null });
      }
    }

    return { aidResults, firstMatchedAid };
  }

  private async readAppData(transmit: (data: Buffer, resLen: number) => Promise<Buffer>, aidHex: string, fci: string | null): Promise<NfcAppData> {
    const appData: NfcAppData = {
      serialNumber: null,
      fci,
      balance: null,
      records: [],
    };

    try {
      for (let sfi = 1; sfi <= 3; sfi++) {
        for (let rec = 1; rec <= 3; rec++) {
          try {
            const p2 = (sfi << 3) | 0x04;
            const readCmd = Buffer.from([0x00, 0xB2, rec, p2, 0x00]);
            const resp = await transmit(readCmd, 256);
            const rSw = resp.slice(-2);

            if (rSw[0] === 0x90 && rSw[1] === 0x00 && resp.length > 2) {
              const data = resp.slice(0, -2).toString('hex').toUpperCase();
              appData.records.push({ sfi, record: rec, data });
              logger.debug(`[APP DATA] Record SFI${sfi}/R${rec}: ${data}`);
            }
          } catch {
            // 해당 레코드 없음
          }
        }
      }

      try {
        const getSerial = Buffer.from([0x80, 0xCA, 0x00, 0x04, 0x00]);
        const resp = await transmit(getSerial, 256);
        const rSw = resp.slice(-2);
        if (rSw[0] === 0x90 && rSw[1] === 0x00 && resp.length > 2) {
          appData.serialNumber = resp.slice(0, -2).toString('hex').toUpperCase();
          logger.info(`[APP DATA] 시리얼: ${appData.serialNumber}`);
        }
      } catch {
        // GET DATA 미지원
      }

      if (!appData.serialNumber && fci && fci.length >= 16) {
        appData.serialNumber = fci;
        logger.info(`[APP DATA] FCI 기반 식별값: ${fci}`);
      }

      if (!appData.serialNumber && appData.records.length > 0) {
        appData.serialNumber = appData.records[0].data;
        logger.info(`[APP DATA] Record 기반 식별값: ${appData.serialNumber}`);
      }

      try {
        const getBalance = Buffer.from([0x80, 0x4C, 0x00, 0x00, 0x04]);
        const resp = await transmit(getBalance, 256);
        const rSw = resp.slice(-2);
        if (rSw[0] === 0x90 && rSw[1] === 0x00 && resp.length >= 6) {
          const balBytes = resp.slice(0, 4);
          appData.balance = balBytes.readUInt32BE(0);
          logger.info(`[APP DATA] 잔액: ${appData.balance}원`);
        }
      } catch {
        // GET BALANCE 미지원
      }
    } catch (err: any) {
      logger.debug(`[APP DATA] 읽기 오류: ${err.message}`);
    }

    return appData;
  }

  private detectCardType(atr: string): string {
    if (!atr) return 'UNKNOWN';
    if (atr.includes('0001') || atr.includes('0002')) return 'MIFARE Classic';
    if (atr.includes('0003')) return 'MIFARE Ultralight';
    if (atr.includes('0005') || atr.includes('F004')) return 'MIFARE DESFire';
    if (atr.includes('F012') || atr.includes('11')) return 'FeliCa';
    if (atr.includes('8040') || atr.includes('0080')) return 'ISO 14443-4 (NFC-A)';
    return 'NFC Tag';
  }

  private handleResponse(response: NfcTagResponse, identifier: string): void {

    // Buzzer (카드 제거 시 TransmitError 방어)
    try {
      switch (response.result) {
        case 'SUCCESS':
        case 'REGISTER_SAVE':
          this.buzzer.success();
          break;
        case 'PARTIAL':
          this.buzzer.partial();
          break;
        case 'REGISTER_NO':
        case 'REGISTER_TIMEOUT':
          break; // 등록 취소/타임아웃은 buzzer 없음
        case 'DENIED':
          // 쿨다운 메시지인 경우 짧은 비프, 그 외 거부 비프
          if (response.message?.includes('초 후 다시')) {
            this.buzzer.cooldown();
          } else {
            this.buzzer.denied();
          }
          break;
        case 'UNKNOWN':
          this.buzzer.denied();
          break;
        default:
          this.buzzer.error();
      }
    } catch {
      // 카드가 이미 제거된 경우 buzzer 무시
    }
  }
}
