import { NfcAgentConfig } from '@ku/types';
import { logger } from './logger';

/**
 * ACR122U 내장 부저 제어
 * APDU: FF 00 52 {duration} 00
 * duration: 부저 울림 시간 (0x01 = 짧게, 0xFF = 길게)
 */
export class BuzzerController {
  private enabled: boolean;

  constructor(config: NfcAgentConfig) {
    this.enabled = config.buzzerEnabled;
  }

  /** 성공 - 짧은 비프 1회 */
  success(): void {
    if (!this.enabled) return;
    logger.debug('[BUZZER] SUCCESS beep');
    // TODO: ACR122U APDU로 짧은 비프
    // reader.transmit(Buffer.from([0xFF, 0x00, 0x52, 0x01, 0x00]), 2);
  }

  /** 부분 성공 - 짧은 비프 2회 */
  partial(): void {
    if (!this.enabled) return;
    logger.debug('[BUZZER] PARTIAL beep x2');
    // TODO: 짧은 비프 2회 (딜레이 후 반복)
  }

  /** 거부/미등록 - 긴 비프 1회 */
  denied(): void {
    if (!this.enabled) return;
    logger.debug('[BUZZER] DENIED long beep');
    // TODO: ACR122U APDU로 긴 비프
    // reader.transmit(Buffer.from([0xFF, 0x00, 0x52, 0xFF, 0x00]), 2);
  }

  /** 에러 - 긴 비프 3회 */
  error(): void {
    if (!this.enabled) return;
    logger.debug('[BUZZER] ERROR long beep x3');
    // TODO: 긴 비프 3회
  }
}
