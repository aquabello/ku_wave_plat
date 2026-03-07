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
import { TbRecorderLog } from './entities/recorder-log.entity';
import { PtzCommandDto } from './dto/ptz-command.dto';
import { RecordingStartDto } from './dto/recording-command.dto';
import { RecorderStatus } from './enums/recorder-status.enum';
import { SessionStatus } from './enums/session-status.enum';
import { RecorderLogType, ResultStatus } from './enums/log-type.enum';

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
    @InjectRepository(TbRecorderLog)
    private readonly logRepo: Repository<TbRecorderLog>,
    private readonly httpService: HttpService,
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

      if (isTimeout) {
        throw new GatewayTimeoutException(message);
      }
      throw new UnprocessableEntityException(message);
    }
  }

  // ──────────────── 녹화 제어 ────────────────

  async startRecording(recorderSeq: number, dto: RecordingStartDto, tuSeq?: number) {
    const recorder = await this.getOnlineRecorder(recorderSeq);

    // 다른 사용자가 선점 중인지 확인
    if (recorder.currentUserSeq && recorder.currentUserSeq !== tuSeq) {
      throw new ConflictException('다른 사용자가 녹화기를 사용 중입니다.');
    }

    // 진행 중인 세션 확인
    const activeSession = await this.sessionRepo.findOne({
      where: { recorderSeq, sessionStatus: SessionStatus.RECORDING },
    });
    if (activeSession) {
      throw new ConflictException('이미 녹화 중입니다.');
    }

    // 프리셋 적용
    if (dto.recPresetSeq) {
      await this.applyPreset(recorderSeq, dto.recPresetSeq, tuSeq);
    }

    const log = await this.createLog(recorderSeq, tuSeq, RecorderLogType.REC_START, dto);

    try {
      const url = this.buildRecorderUrl(recorder, '/recording/start');
      await firstValueFrom(
        this.httpService.post(url, {}, { timeout: 10000 }),
      );

      // 사용자 선점 + 세션 생성
      await this.recorderRepo.update(recorderSeq, {
        currentUserSeq: tuSeq ?? null,
      });

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
    } catch (error: unknown) {
      if (error instanceof ConflictException || error instanceof GatewayTimeoutException) {
        throw error;
      }
      const err = error as { code?: string; message?: string };
      const isTimeout = err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT';
      const message = isTimeout ? '녹화기 응답 시간 초과' : `녹화기 통신 실패: ${err?.message}`;
      await this.updateLog(log.recLogSeq, isTimeout ? ResultStatus.TIMEOUT : ResultStatus.FAIL, message);

      if (isTimeout) throw new GatewayTimeoutException(message);
      throw new UnprocessableEntityException(message);
    }
  }

  async stopRecording(recorderSeq: number, tuSeq?: number) {
    const recorder = await this.getRecorder(recorderSeq);

    const session = await this.sessionRepo.findOne({
      where: { recorderSeq, sessionStatus: SessionStatus.RECORDING },
    });
    if (!session) {
      throw new NotFoundException('진행 중인 녹화 세션이 없습니다.');
    }

    const log = await this.createLog(recorderSeq, tuSeq, RecorderLogType.REC_STOP, null);

    try {
      const url = this.buildRecorderUrl(recorder, '/recording/stop');
      await firstValueFrom(
        this.httpService.post(url, {}, { timeout: 10000 }),
      );

      const endedAt = new Date();
      const durationSec = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);

      session.sessionStatus = SessionStatus.COMPLETED;
      session.endedAt = endedAt;
      session.durationSec = durationSec;
      await this.sessionRepo.save(session);

      // 사용자 선점 해제
      await this.recorderRepo.update(recorderSeq, {
        currentUserSeq: null,
      });

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
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      const isTimeout = err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT';
      const message = isTimeout ? '녹화기 응답 시간 초과' : `녹화기 통신 실패: ${err?.message}`;
      await this.updateLog(log.recLogSeq, isTimeout ? ResultStatus.TIMEOUT : ResultStatus.FAIL, message);

      if (isTimeout) throw new GatewayTimeoutException(message);
      throw new UnprocessableEntityException(message);
    }
  }

  // ──────────────── 프리셋 적용 ────────────────

  async applyPreset(recorderSeq: number, recPresetSeq: number, tuSeq?: number) {
    const recorder = await this.getOnlineRecorder(recorderSeq);

    const preset = await this.presetRepo.findOne({
      where: { recPresetSeq, recorderSeq, presetIsdel: 'N' },
    });
    if (!preset) {
      throw new NotFoundException('해당 프리셋을 찾을 수 없습니다.');
    }

    const log = await this.createLog(recorderSeq, tuSeq, RecorderLogType.PRESET_APPLY, {
      presetNumber: preset.presetNumber,
    });

    try {
      const url = this.buildRecorderUrl(recorder, `/preset/${preset.presetNumber}`);
      await firstValueFrom(
        this.httpService.post(url, {}, { timeout: 10000 }),
      );

      await this.updateLog(log.recLogSeq, ResultStatus.SUCCESS, '프리셋 적용 완료');

      return {
        recLogSeq: log.recLogSeq,
        presetName: preset.presetName,
        presetNumber: preset.presetNumber,
        resultStatus: ResultStatus.SUCCESS,
        resultMessage: '프리셋 적용 완료',
        executedAt: log.executedAt,
      };
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      const isTimeout = err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT';
      const message = isTimeout ? '녹화기 응답 시간 초과' : `녹화기 통신 실패: ${err?.message}`;
      await this.updateLog(log.recLogSeq, isTimeout ? ResultStatus.TIMEOUT : ResultStatus.FAIL, message);

      if (isTimeout) throw new GatewayTimeoutException(message);
      throw new UnprocessableEntityException(message);
    }
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
    };
  }

  // ──────────────── 헬퍼 메서드 ────────────────

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
