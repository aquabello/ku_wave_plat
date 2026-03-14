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
      reader.aid = null;

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

      this.buzzer.setTransmit((data: Buffer, len: number) => reader.transmit(data, len));

      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      reader.on('card', async (card: any) => {
        logger.debug(`[카드 감지] ATR: ${card.atr?.toString('hex') ?? 'N/A'}`);
        await this.handleTag(reader, card);
      });

      reader.on('card.off', () => {
        logger.debug('[카드 제거]');
      });

      reader.on('end', () => {
        logger.warn('[리더기 연결 해제]');
        this.wsServer.setReaderConnected(false);
        this.wsServer.broadcastReaderDisconnected(reader.name);
        this.currentReader = null;
        this.buzzer.clearTransmit();
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

  private async handleTag(reader: any, card: any): Promise<void> {
    let uid = card.uid || '';

    if (!uid) {
      try {
        await reader.connect(1);
        const getUidCmd = Buffer.from([0xFF, 0xCA, 0x00, 0x00, 0x00]);
        const uidResponse = await reader.transmit(getUidCmd, 256);
        const sw = uidResponse.slice(-2);
        if (sw[0] === 0x90 && sw[1] === 0x00) {
          uid = uidResponse.slice(0, -2).toString('hex').toUpperCase();
        }
      } catch (err: any) {
        logger.warn(`[UID 읽기 실패] ${err.message}`);
      }
    }

    const atr = card.atr?.toString('hex').toUpperCase() ?? '';
    logger.info(`[태깅 감지] UID: ${uid || '(unknown)'} | ATR: ${atr || 'N/A'}`);

    const { aidResults, firstMatchedAid } = await this.scanAllAids(reader);
    const matchedAids = aidResults.filter(r => r.status === 'SUCCESS').map(r => r.aid);

    const scanData: NfcWsScanEventData = {
      uid: uid || 'UNKNOWN',
      atr,
      cardType: this.detectCardType(atr),
      aidResults,
      matchedAids,
    };
    this.wsServer.broadcastScan(scanData);

    logger.info(`[스캔 결과] 매칭 AID: ${matchedAids.length > 0 ? matchedAids.join(', ') : '없음'}`);

    if (this.mode === 'aid-test') {
      logger.info('[AID 테스트 모드] API 호출 생략, 스캔 결과만 브로드캐스트');
      return;
    }

    const identifier = uid || 'UNKNOWN';

    const request: NfcTagRequest = {
      identifier,
      aid: firstMatchedAid || undefined,
    };

    try {
      const response = await this.apiClient.sendTag(request);
      this.wsServer.broadcastTag(request, response);
      this.handleResponse(response);
    } catch (err: any) {
      logger.error(`[API 호출 실패] ${err.message}`);
      this.buzzer.error();
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

  private async scanAllAids(reader: any): Promise<{
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
        const response = await reader.transmit(selectCmd, 256);
        const sw = response.slice(-2);
        const swHex = sw.toString('hex').toUpperCase();
        const responseData = response.length > 2
          ? response.slice(0, -2).toString('hex').toUpperCase()
          : null;

        if (sw[0] === 0x90 && sw[1] === 0x00) {
          logger.info(`[AID SCAN] ${aidHex} (${label}) ✓ 성공 (SW: ${swHex})`);
          const appData = await this.readAppData(reader, aidHex, responseData);
          aidResults.push({ aid: aidHex, label, status: 'SUCCESS', sw: swHex, responseData, appData });
          if (!firstMatchedAid) firstMatchedAid = aidHex;
        } else if (sw[0] === 0x61) {
          logger.info(`[AID SCAN] ${aidHex} (${label}) ✓ 성공 (SW: ${swHex}, 추가 ${sw[1]}B)`);
          const appData = await this.readAppData(reader, aidHex, responseData);
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

  private async readAppData(reader: any, aidHex: string, fci: string | null): Promise<NfcAppData> {
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
            const resp = await reader.transmit(readCmd, 256);
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
        const resp = await reader.transmit(getSerial, 256);
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
        const resp = await reader.transmit(getBalance, 256);
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

  private handleResponse(response: NfcTagResponse): void {
    switch (response.result) {
      case 'SUCCESS':
        logger.info(`[${response.logType}] ${response.spaceName} - ${response.message}`);
        this.buzzer.success();
        break;
      case 'PARTIAL':
        logger.warn(`[${response.logType}] ${response.spaceName} - ${response.message}`);
        this.buzzer.partial();
        break;
      case 'DENIED':
        logger.warn(`[DENIED] ${response.message}`);
        this.buzzer.denied();
        break;
      case 'UNKNOWN':
        logger.warn(`[UNKNOWN] ${response.message}`);
        this.buzzer.denied();
        break;
      default:
        logger.error(`[ERROR] ${response.message}`);
        this.buzzer.error();
    }
  }
}
