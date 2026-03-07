import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TbRecorder } from './entities/recorder.entity';
import { RecorderStatus } from './enums/recorder-status.enum';

@Injectable()
export class RecorderHealthService implements OnModuleInit {
  private readonly logger = new Logger(RecorderHealthService.name);
  private readonly intervalMs: number;
  private readonly healthTimeout: number;

  constructor(
    @InjectRepository(TbRecorder)
    private readonly recorderRepo: Repository<TbRecorder>,
    private readonly httpService: HttpService,
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
      `Health check scheduler started (interval: ${this.intervalMs}ms, timeout: ${this.healthTimeout}ms)`,
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
   * 단일 녹화기 health check
   * @returns true = ONLINE, false = OFFLINE
   */
  private async checkOne(recorder: TbRecorder): Promise<boolean> {
    const protocol =
      recorder.recorderProtocol === 'RTSP' ? 'rtsp' : 'http';
    const url = `${protocol}://${recorder.recorderIp}:${recorder.recorderPort ?? 80}/`;

    try {
      await firstValueFrom(
        this.httpService.get(url, { timeout: this.healthTimeout }),
      );

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
          `Recorder ${recorder.recorderName}(${recorder.recorderSeq}) went OFFLINE`,
        );
      }

      return false;
    }
  }
}
