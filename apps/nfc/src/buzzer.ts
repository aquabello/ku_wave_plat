import { NfcAgentConfig } from '@ku/types';
import { logger } from './logger';

const IOCTL_CCID_ESCAPE = 0x42000000 + 3500;

export class BuzzerController {
  private enabled: boolean;
  private rawReader: any = null;

  constructor(config: NfcAgentConfig) {
    this.enabled = config.buzzerEnabled;
  }

  /** pcsclite raw reader 설정 (reader.reader) */
  setReader(rawReader: any): void {
    this.rawReader = rawReader;
  }

  clearReader(): void {
    this.rawReader = null;
  }

  /** 성공: 비프 1회 (띠) */
  success(): void {
    this.send(0x01, 0x00, 0x00, 0x01);
  }

  /** 부분 성공: 비프 2회 (띠띠) */
  partial(): void {
    this.send(0x01, 0x01, 0x01, 0x01);
  }

  /** 거부/식별실패: 비프 3회 (띠띠띠) */
  denied(): void {
    this.send(0x01, 0x01, 0x02, 0x01);
  }

  /** 쿨다운: 비프 3회 (띠띠띠) */
  cooldown(): void {
    this.send(0x01, 0x01, 0x02, 0x01);
  }

  /** 오류: 긴 비프 1회 */
  error(): void {
    this.send(0x05, 0x00, 0x00, 0x01);
  }

  private send(t1: number, t2: number, repeat: number, buzzer: number): void {
    if (!this.enabled || !this.rawReader) return;

    const cmd = Buffer.from([0xFF, 0x00, 0x40, 0x00, 0x04, t1, t2, repeat, buzzer]);
    const raw = this.rawReader;

    // DIRECT 모드로 연결 → IOCTL로 전송 (카드 없이도 동작)
    raw.connect({ share_mode: raw.SCARD_SHARE_DIRECT }, (err: any, protocol: number) => {
      if (err) {
        logger.debug(`[BUZZER] DIRECT 연결 실패: ${err.message}`);
        return;
      }
      raw.control(cmd, IOCTL_CCID_ESCAPE, 256, (err2: any) => {
        if (err2) logger.debug(`[BUZZER] control 실패: ${err2.message}`);
        raw.disconnect(raw.SCARD_LEAVE_CARD, () => {});
      });
    });
  }
}
