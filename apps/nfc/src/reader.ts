import { NFC } from 'nfc-pcsc';
import { NfcAgentConfig, NfcTagRequest, NfcTagResponse } from '@ku/types';
import { ApiClient } from './api-client';
import { OfflineQueue } from './queue';
import { BuzzerController } from './buzzer';
import { logger } from './logger';

export class NfcReader {
  private nfc: any;
  private currentReader: any = null;

  constructor(
    private config: NfcAgentConfig,
    private apiClient: ApiClient,
    private queue: OfflineQueue,
    private buzzer: BuzzerController,
  ) {
    this.nfc = new NFC();
  }

  start(): void {
    logger.info('NFC 리더기 대기 중...');

    this.nfc.on('reader', (reader: any) => {
      logger.info(`[리더기 연결] ${reader.name}`);
      this.currentReader = reader;

      reader.on('card', async (card: any) => {
        await this.handleTag(reader, card);
      });

      reader.on('card.off', () => {
        logger.debug('[카드 제거]');
      });

      reader.on('error', (err: any) => {
        logger.error(`[리더기 오류] ${err.message}`);
      });

      reader.on('end', () => {
        logger.warn('[리더기 연결 해제]');
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
    const uid = card.uid || '';
    logger.info(`[태깅 감지] UID: ${uid}`);

    // AID 읽기 시도
    const aid = await this.readAid(reader);

    // 식별값 결정 (AID 응답 데이터 또는 UID)
    const identifier = uid;

    const request: NfcTagRequest = {
      identifier,
      aid: aid || undefined,
    };

    try {
      const response = await this.apiClient.sendTag(request);
      this.handleResponse(response);
    } catch (err: any) {
      logger.error(`[API 호출 실패] ${err.message}`);
      // 오프라인 큐에 추가
      this.queue.enqueue(request);
      this.buzzer.error();
    }
  }

  private async readAid(reader: any): Promise<string | null> {
    // TODO: 설정에서 타겟 AID 목록을 읽어 SELECT 시도
    // 현재는 UID 기반 식별만 사용
    try {
      const getUid = Buffer.from([0xFF, 0xCA, 0x00, 0x00, 0x00]);
      const response = await reader.transmit(getUid, 256);
      const sw = response.slice(-2);
      if (sw[0] === 0x90) {
        return response.slice(0, -2).toString('hex').toUpperCase();
      }
    } catch {
      // AID 읽기 실패 시 무시
    }
    return null;
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
