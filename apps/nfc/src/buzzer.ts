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

  success(): void {
    if (!this.enabled) return;
    this.beep(0x05);
  }

  partial(): void {
    if (!this.enabled) return;
    this.beep(0x0A);
  }

  denied(): void {
    if (!this.enabled) return;
    this.beep(0x1E);
  }

  error(): void {
    if (!this.enabled) return;
    this.beep(0x1E);
  }

  private beep(duration: number): void {
    if (!this.transmit) {
      logger.debug('[BUZZER] transmit 미연결, 비프 생략');
      return;
    }

    const cmd = Buffer.from([0xFF, 0x00, 0x52, duration, 0x00]);
    this.transmit(cmd, 2).catch((err: Error) => {
      logger.debug(`[BUZZER] APDU 전송 실패: ${err.message}`);
    });
  }
}
