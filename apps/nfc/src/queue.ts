import * as fs from 'fs';
import * as path from 'path';
import { NfcAgentConfig, NfcTagRequest } from '@ku/types';
import { logger } from './logger';

const QUEUE_FILE = path.resolve(__dirname, '../.queue.json');

interface QueueItem {
  request: NfcTagRequest;
  timestamp: string;
  retryCount: number;
}

export class OfflineQueue {
  private queue: QueueItem[] = [];
  private maxSize: number;

  constructor(config: NfcAgentConfig) {
    this.maxSize = config.offlineQueueMax;
    this.load();
  }

  enqueue(request: NfcTagRequest): void {
    if (this.queue.length >= this.maxSize) {
      // 가장 오래된 항목 제거
      this.queue.shift();
      logger.warn(`[QUEUE] 큐 초과, 가장 오래된 항목 제거`);
    }

    this.queue.push({
      request,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    });

    this.save();
    logger.info(`[QUEUE] 오프라인 큐 추가 (${this.queue.length}/${this.maxSize})`);
  }

  dequeue(): QueueItem | undefined {
    const item = this.queue.shift();
    if (item) this.save();
    return item;
  }

  size(): number {
    return this.queue.length;
  }

  /** 프로그램 종료 시 큐를 파일에 저장 */
  flush(): void {
    this.save();
    logger.info(`[QUEUE] 큐 저장 완료 (${this.queue.length}건)`);
  }

  private save(): void {
    try {
      fs.writeFileSync(QUEUE_FILE, JSON.stringify(this.queue, null, 2));
    } catch (err: any) {
      logger.error(`[QUEUE] 저장 실패: ${err.message}`);
    }
  }

  private load(): void {
    try {
      if (fs.existsSync(QUEUE_FILE)) {
        const raw = fs.readFileSync(QUEUE_FILE, 'utf-8');
        this.queue = JSON.parse(raw);
        if (this.queue.length > 0) {
          logger.info(`[QUEUE] 이전 큐 복원: ${this.queue.length}건`);
        }
      }
    } catch {
      this.queue = [];
    }
  }
}
