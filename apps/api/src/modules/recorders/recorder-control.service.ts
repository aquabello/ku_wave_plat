import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  GatewayTimeoutException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TbRecorder } from './entities/recorder.entity';
import { TbRecorderPreset } from './entities/recorder-preset.entity';
import { TbRecordingSession } from './entities/recording-session.entity';
import { TbRecordingFile } from './entities/recording-file.entity';
import { TbRecorderLog } from './entities/recorder-log.entity';
import { PtzCommandDto } from './dto/ptz-command.dto';
import { RecordingStartDto } from './dto/recording-command.dto';
import { RecorderStatus } from './enums/recorder-status.enum';
import { SessionStatus } from './enums/session-status.enum';
import { FtpStatus } from './enums/ftp-status.enum';
import { RecorderLogType, ResultStatus } from './enums/log-type.enum';
import { RecorderProtocolService } from './services/recorder-protocol.service';
import { FtpService } from '@modules/ftp/ftp.service';

@Injectable()
export class RecorderControlService {
  private readonly logger = new Logger(RecorderControlService.name);

  constructor(
    @InjectRepository(TbRecorder)
    private readonly recorderRepo: Repository<TbRecorder>,
    @InjectRepository(TbRecorderPreset)
    private readonly presetRepo: Repository<TbRecorderPreset>,
    @InjectRepository(TbRecordingSession)
    private readonly sessionRepo: Repository<TbRecordingSession>,
    @InjectRepository(TbRecordingFile)
    private readonly fileRepo: Repository<TbRecordingFile>,
    @InjectRepository(TbRecorderLog)
    private readonly logRepo: Repository<TbRecorderLog>,
    private readonly httpService: HttpService,
    private readonly protocolService: RecorderProtocolService,
    private readonly ftpService: FtpService,
  ) {}

  // ──────────────── PTZ 제어 ────────────────

  async sendPtzCommand(recorderSeq: number, dto: PtzCommandDto, tuSeq?: number) {
    const recorder = await this.getOnlineRecorder(recorderSeq);
    const log = await this.createLog(recorderSeq, tuSeq, RecorderLogType.PTZ, dto);

    try {
      const url = this.buildRecorderUrl(recorder, '/ptz/control');
      await firstValueFrom(
        this.httpService.post(url, {
          action: dto.action,
          pan: dto.pan ?? 0,
          tilt: dto.tilt ?? 0,
          zoom: dto.zoom ?? 0,
        }, { timeout: 10000 }),
      );

      await this.updateLog(log.recLogSeq, ResultStatus.SUCCESS, 'PTZ 명령 전송 완료');
      return {
        recLogSeq: log.recLogSeq,
        resultStatus: ResultStatus.SUCCESS,
        resultMessage: 'PTZ 명령 전송 완료',
        executedAt: log.executedAt,
      };
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      const isTimeout = err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT';
      const status = isTimeout ? ResultStatus.TIMEOUT : ResultStatus.FAIL;
      const message = isTimeout ? '녹화기 응답 시간 초과' : `녹화기 통신 실패: ${err?.message}`;

      await this.updateLog(log.recLogSeq, status, message);
      if (isTimeout) throw new GatewayTimeoutException(message);
      throw new UnprocessableEntityException(message);
    }
  }

  // ──────────────── 녹화 제어 ────────────────

  async startRecording(recorderSeq: number, dto: RecordingStartDto, tuSeq?: number) {
    const recorder = await this.getOnlineRecorder(recorderSeq);
    const port = recorder.recorderPort ?? 6060;

    if (recorder.currentUserSeq && recorder.currentUserSeq !== tuSeq) {
      throw new ConflictException('다른 사용자가 녹화기를 사용 중입니다.');
    }

    const activeSession = await this.sessionRepo.findOne({
      where: { recorderSeq, sessionStatus: SessionStatus.RECORDING },
    });
    if (activeSession) {
      throw new ConflictException('이미 녹화 중입니다.');
    }

    if (dto.recPresetSeq) {
      const preset = await this.presetRepo.findOne({
        where: { recPresetSeq: dto.recPresetSeq, recorderSeq, presetIsdel: 'N' },
      });
      if (!preset) {
        throw new NotFoundException('해당 프리셋을 찾을 수 없습니다.');
      }
      const presetAck = await this.protocolService.setPreset(recorder.recorderIp, port, preset.presetNumber);
      if (!presetAck) {
        throw new UnprocessableEntityException('프리셋 적용이 거부되었습니다 (NACK)');
      }
    }

    const log = await this.createLog(recorderSeq, tuSeq, RecorderLogType.REC_START, dto);

    const ack = await this.protocolService.startRecording(recorder.recorderIp, port);
    if (!ack) {
      await this.updateLog(log.recLogSeq, ResultStatus.FAIL, '녹화기가 녹화 시작 명령을 거부했습니다 (NACK)');
      throw new UnprocessableEntityException('녹화기가 녹화 시작 명령을 거부했습니다 (NACK)');
    }

    try {
      await this.recorderRepo.update(recorderSeq, { currentUserSeq: tuSeq ?? null });

      const session = this.sessionRepo.create({
        recorderSeq,
        tuSeq,
        sessionStatus: SessionStatus.RECORDING,
        recPresetSeq: dto.recPresetSeq ?? null,
        sessionTitle: dto.sessionTitle ?? null,
        startedAt: new Date(),
      });
      const savedSession = await this.sessionRepo.save(session);

      await this.updateLog(log.recLogSeq, ResultStatus.SUCCESS, '녹화 시작 완료');

      return {
        recSessionSeq: savedSession.recSessionSeq,
        recorderSeq,
        sessionStatus: savedSession.sessionStatus,
        sessionTitle: savedSession.sessionTitle,
        startedAt: savedSession.startedAt,
        message: '녹화가 시작되었습니다',
      };
    } catch (dbError: unknown) {
      this.logger.error(`DB 저장 실패, 녹화 중지 롤백: ${(dbError as Error).message}`);
      await this.protocolService.stopRecording(recorder.recorderIp, port).catch(() => {});
      await this.updateLog(log.recLogSeq, ResultStatus.FAIL, 'DB 저장 실패로 녹화 롤백');
      throw dbError;
    }
  }

  async stopRecording(recorderSeq: number, tuSeq?: number) {
    const recorder = await this.getRecorder(recorderSeq);
    const port = recorder.recorderPort ?? 6060;

    const session = await this.sessionRepo.findOne({
      where: { recorderSeq, sessionStatus: SessionStatus.RECORDING },
    });
    if (!session) {
      throw new NotFoundException('진행 중인 녹화 세션이 없습니다.');
    }

    const log = await this.createLog(recorderSeq, tuSeq, RecorderLogType.REC_STOP, null);

    const ack = await this.protocolService.stopRecording(recorder.recorderIp, port);
    if (!ack) {
      await this.updateLog(log.recLogSeq, ResultStatus.FAIL, '녹화기가 녹화 종료 명령을 거부했습니다 (NACK)');
      throw new UnprocessableEntityException('녹화기가 녹화 종료 명령을 거부했습니다 (NACK)');
    }

    const endedAt = new Date();
    const durationSec = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);

    session.sessionStatus = SessionStatus.COMPLETED;
    session.endedAt = endedAt;
    session.durationSec = durationSec;
    await this.sessionRepo.save(session);

    await this.recorderRepo.update(recorderSeq, { currentUserSeq: null });

    const ftpConfig = await this.ftpService.getConfigForRecorder(recorderSeq);
    const timestamp = endedAt.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const safeTitle = (session.sessionTitle ?? 'recording').replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    const recordingFile = this.fileRepo.create({
      recSessionSeq: session.recSessionSeq,
      fileName: `${safeTitle}_${timestamp}.mp4`,
      filePath: `/recordings/${recorder.recorderIp}/${timestamp}/`,
      fileFormat: 'mp4',
      ftpStatus: FtpStatus.PENDING,
      ftpConfigSeq: ftpConfig?.ftpConfigSeq ?? null,
    });
    await this.fileRepo.save(recordingFile);

    await this.updateLog(log.recLogSeq, ResultStatus.SUCCESS, '녹화 종료 완료');

    const minutes = Math.floor(durationSec / 60);
    return {
      recSessionSeq: session.recSessionSeq,
      sessionStatus: session.sessionStatus,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      durationSec,
      message: `녹화가 종료되었습니다 (${minutes}분)`,
    };
  }

  // ──────────────── 프리셋 적용 ────────────────

  async applyPreset(recorderSeq: number, recPresetSeq: number, tuSeq?: number) {
    const recorder = await this.getOnlineRecorder(recorderSeq);
    const port = recorder.recorderPort ?? 6060;

    const preset = await this.presetRepo.findOne({
      where: { recPresetSeq, recorderSeq, presetIsdel: 'N' },
    });
    if (!preset) {
      throw new NotFoundException('해당 프리셋을 찾을 수 없습니다.');
    }

    const log = await this.createLog(recorderSeq, tuSeq, RecorderLogType.PRESET_APPLY, {
      presetNumber: preset.presetNumber,
    });

    const ack = await this.protocolService.setPreset(recorder.recorderIp, port, preset.presetNumber);
    if (!ack) {
      await this.updateLog(log.recLogSeq, ResultStatus.FAIL, '프리셋 적용 거부 (NACK)');
      throw new UnprocessableEntityException('프리셋 적용이 거부되었습니다 (NACK)');
    }

    await this.updateLog(log.recLogSeq, ResultStatus.SUCCESS, '프리셋 적용 완료');
    return {
      recLogSeq: log.recLogSeq,
      presetName: preset.presetName,
      presetNumber: preset.presetNumber,
      resultStatus: ResultStatus.SUCCESS,
      resultMessage: '프리셋 적용 완료',
      executedAt: log.executedAt,
    };
  }

  // ──────────────── 상태 조회 ────────────────

  async getStatus(recorderSeq: number) {
    const recorder = await this.getRecorder(recorderSeq);

    const session = await this.sessionRepo.findOne({
      where: { recorderSeq, sessionStatus: SessionStatus.RECORDING },
    });

    let currentSession = null;
    if (session) {
      const elapsedSec = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
      currentSession = {
        recSessionSeq: session.recSessionSeq,
        sessionTitle: session.sessionTitle,
        startedAt: session.startedAt,
        elapsedSec,
      };
    }

    let liveStatus = null;
    if (recorder.recorderStatus !== RecorderStatus.OFFLINE) {
      const port = recorder.recorderPort ?? 6060;
      try {
        const full = await this.protocolService.getFullStatus(recorder.recorderIp, port);
        liveStatus = {
          recordingStatus: full.recording.status,
          elapsedSec: full.elapsedSec,
          elapsedFormatted: this.formatDuration(full.elapsedSec),
          storage: {
            totalBytes: full.storage.totalBytes.toString(),
            availableBytes: full.storage.availableBytes.toString(),
            usedPercent: full.storage.usedPercent,
            isWarning: full.storage.usedPercent >= 90,
          },
        };
      } catch {
        // 녹화기 통신 불가
      }
    }

    const recentFiles = session
      ? await this.fileRepo.find({
          where: { recSessionSeq: session.recSessionSeq, fileIsdel: 'N' },
          order: { regDate: 'DESC' },
          take: 5,
        })
      : [];

    return {
      recorderSeq: recorder.recorderSeq,
      recorderName: recorder.recorderName,
      recorderStatus: recorder.recorderStatus,
      isRecording: !!session,
      currentSession,
      currentUser: recorder.currentUser
        ? { tuSeq: recorder.currentUser.seq, tuName: recorder.currentUser.name }
        : null,
      lastHealthCheck: recorder.lastHealthCheck,
      liveStatus,
      recentFiles: recentFiles.map((f) => ({
        recFileSeq: f.recFileSeq,
        fileName: f.fileName,
        ftpStatus: f.ftpStatus,
        ftpRetryCount: f.ftpRetryCount,
      })),
    };
  }

  // ──────────────── 헬퍼 메서드 ────────────────

  private formatDuration(totalSec: number): string {
    const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  private async getRecorder(recorderSeq: number): Promise<TbRecorder> {
    const recorder = await this.recorderRepo.findOne({
      where: { recorderSeq, recorderIsdel: 'N' },
      relations: ['currentUser'],
    });
    if (!recorder) {
      throw new NotFoundException('해당 녹화기를 찾을 수 없습니다.');
    }
    return recorder;
  }

  private async getOnlineRecorder(recorderSeq: number): Promise<TbRecorder> {
    const recorder = await this.getRecorder(recorderSeq);
    if (recorder.recorderStatus === RecorderStatus.OFFLINE) {
      throw new UnprocessableEntityException('녹화기가 OFFLINE 상태입니다.');
    }
    return recorder;
  }

  private buildRecorderUrl(recorder: TbRecorder, path: string): string {
    const protocol = recorder.recorderProtocol === 'RTSP' ? 'rtsp' : 'http';
    return `${protocol}://${recorder.recorderIp}:${recorder.recorderPort ?? 80}${path}`;
  }

  private async createLog(
    recorderSeq: number,
    tuSeq: number | undefined,
    logType: RecorderLogType,
    detail: unknown,
  ): Promise<TbRecorderLog> {
    const log = this.logRepo.create({
      recorderSeq,
      tuSeq: tuSeq ?? null,
      logType,
      commandDetail: detail ? JSON.stringify(detail) : null,
      resultStatus: ResultStatus.SUCCESS,
    });
    return this.logRepo.save(log);
  }

  private async updateLog(recLogSeq: number, status: ResultStatus, message: string) {
    await this.logRepo.update(recLogSeq, {
      resultStatus: status,
      resultMessage: message,
    });
  }
}
