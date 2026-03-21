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
    const port = recorder.recorderPort ?? 6060;
    const log = await this.createLog(recorderSeq, tuSeq, RecorderLogType.PTZ, dto);

    try {
      let ack = false;
      const { action, pan = 0, tilt = 0, zoom = 0 } = dto;

      if (action === 'home') {
        ack = await this.protocolService.ptzHome(recorder.recorderIp, port);
      } else if (action === 'stop') {
        ack = await this.protocolService.ptzStop(recorder.recorderIp, port);
        await this.protocolService.ptzZoomStop(recorder.recorderIp, port);
      } else if (action === 'move') {
        if (zoom !== 0) {
          ack = await this.protocolService.ptzZoom(recorder.recorderIp, port, zoom > 0 ? 'in' : 'out');
        } else {
          const direction = this.resolvePtzDirection(pan, tilt);
          if (direction) {
            ack = await this.protocolService.ptzMove(recorder.recorderIp, port, direction);
          }
        }
      }

      const resultStatus = ack ? ResultStatus.SUCCESS : ResultStatus.FAIL;
      const resultMessage = ack ? 'PTZ 명령 전송 완료' : 'PTZ 명령 거부 (NACK)';
      await this.updateLog(log.recLogSeq, resultStatus, resultMessage);

      return {
        recLogSeq: log.recLogSeq,
        resultStatus,
        resultMessage,
        executedAt: log.executedAt,
      };
    } catch (error: unknown) {
      const message = `PTZ 통신 실패: ${(error as Error)?.message}`;
      await this.updateLog(log.recLogSeq, ResultStatus.FAIL, message);
      throw new UnprocessableEntityException(message);
    }
  }

  private resolvePtzDirection(pan: number, tilt: number): string | null {
    if (pan < 0 && tilt > 0) return 'leftUp';
    if (pan > 0 && tilt > 0) return 'rightUp';
    if (pan < 0 && tilt < 0) return 'leftDown';
    if (pan > 0 && tilt < 0) return 'rightDown';
    if (pan < 0) return 'left';
    if (pan > 0) return 'right';
    if (tilt > 0) return 'up';
    if (tilt < 0) return 'down';
    return null;
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

    // TCP로 녹화 시작
    const tcpResult = await this.protocolService.startRecording(recorder.recorderIp, port);
    if (!tcpResult.success) {
      await this.updateLog(log.recLogSeq, ResultStatus.FAIL, '녹화기가 녹화 시작 명령을 거부했습니다 (NACK)');
      throw new UnprocessableEntityException('녹화기가 녹화 시작 명령을 거부했습니다 (NACK)');
    }

    // [참고] REST API 녹화 시작 (filepath 획득 가능, 현재 미사용)
    // try {
    //   const restResult = await this.protocolService.restStartRecording(recorder.recorderIp, dto.sessionTitle);
    //   recFilePath = restResult.filepath || null;
    // } catch (restError) {
    //   this.logger.warn(`REST API 녹화 시작 실패: ${(restError as Error).message}`);
    // }

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

    // FTP에서 최신 녹화 폴더 조회하여 파일 레코드 생성
    const ftpConfig = await this.ftpService.getConfigForRecorder(recorderSeq);
    const latestFile = await this.ftpService.getLatestRecordingPath();

    const filePath = latestFile ? `${latestFile.remotePath}${latestFile.fileName}` : null;
    const fileName = latestFile?.fileName ?? `recording_${endedAt.toISOString().replace(/[-:T]/g, '').slice(0, 14)}.mp4`;

    const recordingFile = this.fileRepo.create({
      recSessionSeq: session.recSessionSeq,
      fileName,
      filePath,
      fileSize: latestFile?.fileSize ? String(latestFile.fileSize) : null,
      fileFormat: 'mp4',
      fileDurationSec: durationSec,
      ftpStatus: filePath ? FtpStatus.COMPLETED : FtpStatus.FAILED,
      ftpConfigSeq: ftpConfig?.ftpConfigSeq ?? null,
      ftpErrorMessage: filePath ? null : 'FTP에서 녹화 파일을 찾을 수 없습니다.',
    });
    const savedFile = await this.fileRepo.save(recordingFile);

    await this.updateLog(log.recLogSeq, ResultStatus.SUCCESS, '녹화 종료 완료');

    // 백그라운드: FTP → 캐시 다운로드 (미리보기/다운로드 속도 향상)
    if (savedFile.filePath) {
      this.ftpService.downloadToCache(savedFile.recFileSeq, savedFile.filePath).catch((err) => {
        this.logger.warn(`Background cache download failed: ${(err as Error).message}`);
      });
    }

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
