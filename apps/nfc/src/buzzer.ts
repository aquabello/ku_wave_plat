import { NfcAgentConfig } from '@ku/types';
import { logger } from './logger';

type TransmitFn = (data: Buffer, responseMaxLength: number) => Promise<Buffer>;

export class BuzzerController {
  private enabled: boolean;
  private transmit: TransmitFn | null = null;

  constructor(config: NfcAgentConfig) {
    this.enabled = config.buzzerEnabled;
  }

  setTransmit(transmit: TransmitFn): void {
    this.transmit = transmit;
  }

  clearTransmit(): void {
    this.transmit = null;
  }

  /** 성공: 비프 1회 (띠) */
  success(): void {
    if (!this.enabled) return;
    this.ledBuzzer(0x01, 0x00, 0x00, 0x01);
  }

  /** 부분 성공: 비프 2회 (띠띠) */
  partial(): void {
    if (!this.enabled) return;
    this.ledBuzzer(0x01, 0x01, 0x01, 0x01);
  }

  /** 거부/식별실패: 비프 3회 (띠띠띠) */
  denied(): void {
    if (!this.enabled) return;
    this.ledBuzzer(0x01, 0x01, 0x02, 0x01);
  }

  /** 쿨다운(30초 미만 재태깅): 비프 3회 (띠띠띠) */
  cooldown(): void {
    if (!this.enabled) return;
    this.ledBuzzer(0x01, 0x01, 0x02, 0x01);
  }

  /** 오류: 긴 비프 1회 */
  error(): void {
    if (!this.enabled) return;
    this.ledBuzzer(0x05, 0x00, 0x00, 0x01);
  }

  /**
   * ACR122U LED/Buzzer 제어 (FF 00 40)
   */
  private ledBuzzer(t1: number, t2: number, repeat: number, buzzer: number): void {
    if (!this.transmit) {
      logger.debug('[BUZZER] transmit 미연결, 비프 생략');
      return;
    }

    const cmd = Buffer.from([0xFF, 0x00, 0x40, 0x00, 0x04, t1, t2, repeat, buzzer]);
    this.transmit(cmd, 2).catch((err: Error) => {
      logger.debug(`[BUZZER] APDU 전송 실패: ${err.message}`);
    });
  }
}
