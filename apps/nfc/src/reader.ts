import { NFC } from 'nfc-pcsc';
import { NfcAgentConfig, NfcTagRequest, NfcTagResponse, NfcAidScanResult, NfcWsScanEventData, NfcAppData } from '@ku/types';
import { ApiClient } from './api-client';
import { OfflineQueue } from './queue';
import { BuzzerController } from './buzzer';
import { NfcWsServer } from './ws-server';
import { logger } from './logger';

export class NfcReader {
  private nfc: any;
  private currentReader: any = null;

  constructor(
    private config: NfcAgentConfig,
    private apiClient: ApiClient,
    private queue: OfflineQueue,
    private buzzer: BuzzerController,
    private wsServer: NfcWsServer,
  ) {
    this.nfc = new NFC();
  }

  start(): void {
    logger.info('NFC 리더기 대기 중...');

    this.nfc.on('reader', (reader: any) => {
      logger.info(`[리더기 연결] ${reader.name}`);
      this.currentReader = reader;
      this.wsServer.setReaderConnected(true, reader.name);
      this.wsServer.broadcastReaderConnected(reader.name);

      // autoProcessing 비활성화: 일부 카드에서 자동 UID 읽기 실패 방지
      reader.autoProcessing = false;

      reader.on('card', async (card: any) => {
        logger.debug(`[카드 감지] ATR: ${card.atr?.toString('hex') ?? 'N/A'}`);
        await this.handleTag(reader, card);
      });

      reader.on('card.off', () => {
        logger.debug('[카드 제거]');
      });

      reader.on('error', (err: any) => {
        logger.error(`[리더기 오류] ${err.message}`);
        logger.debug(`[리더기 오류 상세] ${JSON.stringify(err)}`);
      });

      reader.on('end', () => {
        logger.warn('[리더기 연결 해제]');
        this.wsServer.setReaderConnected(false);
        this.wsServer.broadcastReaderDisconnected(reader.name);
        this.currentReader = null;
      });
    });

    this.nfc.on('error', (err: any) => {
      logger.error(`[NFC 오류] ${err.message}`);
    });
  }

  stop(): void {
    if (this.currentReader) {
      logger.info('리더기 연결 해제...');
    }
  }

  private async handleTag(reader: any, card: any): Promise<void> {
    // autoProcessing=false이므로 수동으로 카드 연결 + UID 읽기
    let uid = card.uid || '';

    if (!uid) {
      try {
        // APDU: GET DATA (UID) - FF CA 00 00 00
        await reader.connect(1); // SCARD_SHARE_SHARED
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

    // 모든 AID 스캔 (전체 결과 수집)
    const { aidResults, firstMatchedAid } = await this.scanAllAids(reader);
    const matchedAids = aidResults.filter(r => r.status === 'SUCCESS').map(r => r.aid);

    // scan 이벤트 브로드캐스트 (상세 스캔 결과)
    const scanData: NfcWsScanEventData = {
      uid: uid || 'UNKNOWN',
      atr,
      cardType: this.detectCardType(atr),
      aidResults,
      matchedAids,
    };
    this.wsServer.broadcastScan(scanData);

    logger.info(`[스캔 결과] 매칭 AID: ${matchedAids.length > 0 ? matchedAids.join(', ') : '없음'}`);

    // 식별값 결정
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
      // 오프라인 큐에 추가
      this.queue.enqueue(request);
      this.buzzer.error();
    }
  }

  /** 잘 알려진 AID 라벨 */
  private static readonly AID_LABELS: Record<string, string> = {
    'D4100000030001': 'T-money (티머니)',
    'A0000000041010': 'Mastercard',
    'A0000000031010': 'Visa',
    'A000000025010104': 'American Express',
    'D4100000150001': 'Cashbee (캐시비)',
    'A0000004760101': 'Payco',
    'A00000000401': 'EB 카드',
  };

  /** config.aidList의 모든 AID에 SELECT 시도, 전체 결과 반환 */
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

  /** SELECT AID 성공 후 앱 내부 데이터 읽기 */
  private async readAppData(reader: any, aidHex: string, fci: string | null): Promise<NfcAppData> {
    const appData: NfcAppData = {
      serialNumber: null,
      fci,
      balance: null,
      records: [],
    };

    try {
      // 1. READ RECORD - SFI 1~3, Record 1~3 시도
      for (let sfi = 1; sfi <= 3; sfi++) {
        for (let rec = 1; rec <= 3; rec++) {
          try {
            // READ RECORD: 00 B2 [record] [SFI*8+4] 00
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
            // 해당 레코드 없음 - 계속
          }
        }
      }

      // 2. GET DATA (카드 시리얼) - T-money/교통카드 계열
      try {
        // GET DATA: 80 CA 00 04 00 (카드번호)
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

      // 3. 시리얼이 없으면 FCI에서 추출 시도
      if (!appData.serialNumber && fci && fci.length >= 16) {
        appData.serialNumber = fci;
        logger.info(`[APP DATA] FCI 기반 식별값: ${fci}`);
      }

      // 4. 시리얼이 없으면 첫 번째 레코드에서 추출
      if (!appData.serialNumber && appData.records.length > 0) {
        appData.serialNumber = appData.records[0].data;
        logger.info(`[APP DATA] Record 기반 식별값: ${appData.serialNumber}`);
      }

      // 5. GET BALANCE (T-money 계열)
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

  /** ATR 기반 카드 타입 추정 */
  private detectCardType(atr: string): string {
    if (!atr) return 'UNKNOWN';
    // MIFARE Classic 1K
    if (atr.includes('0001') || atr.includes('0002')) return 'MIFARE Classic';
    // MIFARE Ultralight
    if (atr.includes('0003')) return 'MIFARE Ultralight';
    // MIFARE DESFire
    if (atr.includes('0005') || atr.includes('F004')) return 'MIFARE DESFire';
    // FeliCa
    if (atr.includes('F012') || atr.includes('11')) return 'FeliCa';
    // ISO 14443-4 (phone NFC / HCE)
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
