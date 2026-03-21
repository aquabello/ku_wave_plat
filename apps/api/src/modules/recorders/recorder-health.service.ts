import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as net from 'net';
import { TbRecorder } from './entities/recorder.entity';
import { RecorderStatus } from './enums/recorder-status.enum';

@Injectable()
export class RecorderHealthService implements OnModuleInit {
  private readonly logger = new Logger(RecorderHealthService.name);
  private readonly intervalMs: number;
  private readonly healthTimeout: number;
  private readonly RECORDER_TCP_PORT = 6060;

  constructor(
    @InjectRepository(TbRecorder)
    private readonly recorderRepo: Repository<TbRecorder>,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.intervalMs = this.configService.get<number>(
      'RECORDER_HEALTH_CHECK_INTERVAL_MS',
      30000,
    );
    this.healthTimeout = this.configService.get<number>(
      'RECORDER_HEALTH_CHECK_TIMEOUT_MS',
      3000,
    );
  }

  onModuleInit() {
    const interval = setInterval(() => this.checkAll(), this.intervalMs);
    this.schedulerRegistry.addInterval('recorder-health-check', interval);
    this.logger.log(
      `Health check scheduler started (interval: ${this.intervalMs}ms, timeout: ${this.healthTimeout}ms, port: ${this.RECORDER_TCP_PORT})`,
    );
  }

  /**
   * 활성 녹화기 전체 health check
   */
  async checkAll(): Promise<void> {
    const recorders = await this.recorderRepo.find({
      where: { recorderIsdel: 'N' },
    });

    if (recorders.length === 0) return;

    const results = await Promise.allSettled(
      recorders.map((recorder) => this.checkOne(recorder)),
    );

    let onlineCount = 0;
    let offlineCount = 0;
    for (const result of results) {
      if (result.status === 'fulfilled') {
        result.value ? onlineCount++ : offlineCount++;
      } else {
        offlineCount++;
      }
    }

    this.logger.debug(
      `Health check completed: ${onlineCount} ONLINE, ${offlineCount} OFFLINE (total: ${recorders.length})`,
    );
  }

  /**
   * 단일 녹화기 health check (TCP 6060 소켓 연결)
   * @returns true = ONLINE, false = OFFLINE
   */
  private async checkOne(recorder: TbRecorder): Promise<boolean> {
    const ip = recorder.recorderIp;
    const port = this.RECORDER_TCP_PORT;

    try {
      await this.tcpPing(ip, port);

      await this.recorderRepo.update(recorder.recorderSeq, {
        recorderStatus: RecorderStatus.ONLINE,
        lastHealthCheck: new Date(),
      });

      return true;
    } catch {
      const prevStatus = recorder.recorderStatus;
      await this.recorderRepo.update(recorder.recorderSeq, {
        recorderStatus: RecorderStatus.OFFLINE,
        lastHealthCheck: new Date(),
      });

      if (prevStatus !== RecorderStatus.OFFLINE) {
        this.logger.warn(
          `Recorder ${recorder.recorderName}(${recorder.recorderSeq}) went OFFLINE (${ip}:${port})`,
        );
      }

      return false;
    }
  }

  /**
   * TCP 소켓 연결 테스트 (연결 성공 시 즉시 종료)
   */
  private tcpPing(ip: string, port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();

      const timer = setTimeout(() => {
        socket.destroy();
        reject(new Error(`TCP connect timeout (${ip}:${port})`));
      }, this.healthTimeout);

      socket.connect(port, ip, () => {
        clearTimeout(timer);
        socket.destroy();
        resolve();
      });

      socket.on('error', (err: Error) => {
        clearTimeout(timer);
        socket.destroy();
        reject(err);
      });
    });
  }
}
