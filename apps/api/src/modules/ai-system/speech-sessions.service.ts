import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbAiSpeechSession } from './entities/tb-ai-speech-session.entity';
import { TbAiSpeechLog } from './entities/tb-ai-speech-log.entity';
import { TbAiCommandLog } from './entities/tb-ai-command-log.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { SpeechSessionStatus } from './enums/speech-session-status.enum';
import { CreateSpeechSessionDto } from './dto/create-speech-session.dto';
import { EndSpeechSessionDto } from './dto/end-speech-session.dto';
import { ListSpeechSessionsDto } from './dto/list-speech-sessions.dto';
import { CreateSpeechLogDto } from './dto/create-speech-log.dto';
import { CreateCommandLogDto } from './dto/create-command-log.dto';

@Injectable()
export class SpeechSessionsService {
  private readonly logger = new Logger(SpeechSessionsService.name);

  constructor(
    @InjectRepository(TbAiSpeechSession)
    private readonly sessionRepository: Repository<TbAiSpeechSession>,
    @InjectRepository(TbAiSpeechLog)
    private readonly speechLogRepository: Repository<TbAiSpeechLog>,
    @InjectRepository(TbAiCommandLog)
    private readonly commandLogRepository: Repository<TbAiCommandLog>,
  ) {}

  async list(query: ListSpeechSessionsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.sessionRepository
      .createQueryBuilder('ss')
      .leftJoin(TbSpace, 's', 's.space_seq = ss.space_seq')
      .leftJoin(TbBuilding, 'b', 'b.building_seq = s.building_seq')
      .leftJoin(TbUser, 'u', 'u.tu_seq = ss.tu_seq')
      .select([
        'ss.session_seq AS sessionSeq',
        's.space_name AS spaceName',
        'b.building_name AS buildingName',
        'u.tu_name AS userName',
        'ss.session_status AS sessionStatus',
        'ss.stt_engine AS sttEngine',
        'ss.stt_model AS sttModel',
        'ss.started_at AS startedAt',
        'ss.ended_at AS endedAt',
        'ss.total_duration_sec AS totalDurationSec',
        'ss.total_segments AS totalSegments',
        'ss.total_commands AS totalCommands',
        'ss.recording_filename AS recordingFilename',
      ])
      .where("ss.session_isdel = 'N'");

    if (query.spaceSeq) {
      qb.andWhere('ss.space_seq = :spaceSeq', { spaceSeq: query.spaceSeq });
    }
    if (query.sessionStatus) {
      qb.andWhere('ss.session_status = :sessionStatus', { sessionStatus: query.sessionStatus });
    }
    if (query.startDate) {
      qb.andWhere('ss.started_at >= :startDate', { startDate: `${query.startDate} 00:00:00` });
    }
    if (query.endDate) {
      qb.andWhere('ss.started_at <= :endDate', { endDate: `${query.endDate} 23:59:59` });
    }

    const totalQuery = qb.clone();
    const totalResult = await totalQuery.select('COUNT(*)', 'cnt').getRawOne();
    const total = parseInt(totalResult?.cnt ?? '0', 10);

    const rawItems = await qb
      .orderBy('ss.started_at', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    const items = rawItems.map((row, index) => ({
      no: total - skip - index,
      sessionSeq: row.sessionSeq,
      buildingName: row.buildingName ?? '',
      spaceName: row.spaceName ?? '',
      userName: row.userName ?? '',
      sessionStatus: row.sessionStatus,
      sttEngine: row.sttEngine,
      sttModel: row.sttModel,
      startedAt: row.startedAt,
      endedAt: row.endedAt,
      totalDurationSec: row.totalDurationSec,
      totalSegments: row.totalSegments,
      totalCommands: row.totalCommands,
      recordingFilename: row.recordingFilename,
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(sessionSeq: number) {
    const raw = await this.sessionRepository
      .createQueryBuilder('ss')
      .leftJoin(TbSpace, 's', 's.space_seq = ss.space_seq')
      .leftJoin(TbBuilding, 'b', 'b.building_seq = s.building_seq')
      .leftJoin(TbUser, 'u', 'u.tu_seq = ss.tu_seq')
      .select([
        'ss.session_seq AS sessionSeq',
        'ss.space_seq AS spaceSeq',
        's.space_name AS spaceName',
        'b.building_name AS buildingName',
        'ss.tu_seq AS tuSeq',
        'u.tu_name AS userName',
        'ss.session_status AS sessionStatus',
        'ss.stt_engine AS sttEngine',
        'ss.stt_model AS sttModel',
        'ss.started_at AS startedAt',
        'ss.ended_at AS endedAt',
        'ss.total_duration_sec AS totalDurationSec',
        'ss.total_segments AS totalSegments',
        'ss.total_commands AS totalCommands',
        'ss.recording_filename AS recordingFilename',
        'ss.summary_seq AS summarySeq',
      ])
      .where('ss.session_seq = :sessionSeq', { sessionSeq })
      .andWhere("ss.session_isdel = 'N'")
      .getRawOne();

    if (!raw) {
      throw new NotFoundException('음성인식 세션을 찾을 수 없습니다');
    }

    const logs = await this.speechLogRepository.find({
      where: { sessionSeq },
      order: { createdAt: 'ASC' },
    });

    const commandLogs = await this.commandLogRepository.find({
      where: { sessionSeq },
      order: { createdAt: 'ASC' },
    });

    return {
      sessionSeq: raw.sessionSeq,
      spaceSeq: raw.spaceSeq,
      buildingName: raw.buildingName ?? '',
      spaceName: raw.spaceName ?? '',
      tuSeq: raw.tuSeq,
      userName: raw.userName ?? '',
      sessionStatus: raw.sessionStatus,
      sttEngine: raw.sttEngine,
      sttModel: raw.sttModel,
      startedAt: raw.startedAt,
      endedAt: raw.endedAt,
      totalDurationSec: raw.totalDurationSec,
      totalSegments: raw.totalSegments,
      totalCommands: raw.totalCommands,
      recordingFilename: raw.recordingFilename,
      summarySeq: raw.summarySeq,
      logs: logs.map((l) => ({
        speechLogSeq: l.speechLogSeq,
        segmentText: l.segmentText,
        segmentStartSec: l.segmentStartSec,
        segmentEndSec: l.segmentEndSec,
        confidence: l.confidence,
        isCommand: l.isCommand,
        createdAt: l.createdAt,
      })),
      commandLogs: commandLogs.map((cl) => ({
        commandLogSeq: cl.commandLogSeq,
        sessionSeq: cl.sessionSeq,
        voiceCommandSeq: cl.voiceCommandSeq,
        recognizedText: cl.recognizedText,
        matchedKeyword: cl.matchedKeyword,
        matchScore: cl.matchScore,
        verifySource: cl.verifySource,
        executionStatus: cl.executionStatus,
        executionResult: cl.executionResult,
        createdAt: cl.createdAt,
      })),
    };
  }

  async create(dto: CreateSpeechSessionDto) {
    const entity = this.sessionRepository.create({
      spaceSeq: dto.spaceSeq,
      tuSeq: dto.tuSeq ?? null,
      sttEngine: dto.sttEngine ?? 'faster-whisper',
      sttModel: dto.sttModel ?? 'small',
      recordingFilename: dto.recordingFilename ?? null,
      sessionStatus: SpeechSessionStatus.ACTIVE,
    });

    const saved = await this.sessionRepository.save(entity);
    return {
      sessionSeq: saved.sessionSeq,
      sessionStatus: saved.sessionStatus,
      startedAt: saved.startedAt,
      message: '음성인식 세션이 시작되었습니다.',
    };
  }

  async end(sessionSeq: number, dto: EndSpeechSessionDto) {
    const entity = await this.sessionRepository.findOne({
      where: { sessionSeq, sessionIsdel: 'N' },
    });
    if (!entity) {
      throw new NotFoundException('음성인식 세션을 찾을 수 없습니다');
    }

    entity.sessionStatus = SpeechSessionStatus.ENDED;
    entity.endedAt = new Date();
    if (dto.totalDurationSec !== undefined) entity.totalDurationSec = dto.totalDurationSec;
    if (dto.totalSegments !== undefined) entity.totalSegments = dto.totalSegments;
    if (dto.totalCommands !== undefined) entity.totalCommands = dto.totalCommands;
    if (dto.summarySeq !== undefined) entity.summarySeq = dto.summarySeq;

    await this.sessionRepository.save(entity);

    return {
      sessionSeq: entity.sessionSeq,
      sessionStatus: entity.sessionStatus,
      endedAt: entity.endedAt,
      message: '세션이 종료되었습니다.',
    };
  }

  async createSpeechLog(dto: CreateSpeechLogDto) {
    const session = await this.sessionRepository.findOne({
      where: { sessionSeq: dto.sessionSeq, sessionIsdel: 'N' },
    });
    if (!session) {
      throw new NotFoundException('음성인식 세션을 찾을 수 없습니다');
    }

    const entity = this.speechLogRepository.create({
      sessionSeq: dto.sessionSeq,
      segmentText: dto.segmentText,
      segmentStartSec: dto.segmentStartSec ?? null,
      segmentEndSec: dto.segmentEndSec ?? null,
      confidence: dto.confidence ?? null,
      isCommand: dto.isCommand ?? 'N',
    });

    const saved = await this.speechLogRepository.save(entity);
    return {
      speechLogSeq: saved.speechLogSeq,
      message: '로그가 저장되었습니다.',
    };
  }

  async createCommandLog(dto: CreateCommandLogDto) {
    const session = await this.sessionRepository.findOne({
      where: { sessionSeq: dto.sessionSeq, sessionIsdel: 'N' },
    });
    if (!session) {
      throw new NotFoundException('음성인식 세션을 찾을 수 없습니다');
    }

    const entity = this.commandLogRepository.create({
      sessionSeq: dto.sessionSeq,
      recognizedText: dto.recognizedText,
      matchedKeyword: dto.matchedKeyword ?? null,
      matchScore: dto.matchScore ?? null,
      voiceCommandSeq: dto.voiceCommandSeq ?? null,
      verifySource: dto.verifySource ?? null,
      executionStatus: dto.executionStatus,
      executionResult: dto.executionResult ?? null,
    });

    const saved = await this.commandLogRepository.save(entity);
    return {
      commandLogSeq: saved.commandLogSeq,
      message: '명령 로그가 저장되었습니다.',
    };
  }
}
