import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbAiLectureSummary } from './entities/tb-ai-lecture-summary.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { ProcessStatus } from './enums/process-status.enum';
import { ListLectureSummariesDto } from './dto/list-lecture-summaries.dto';
import { CreateLectureSummaryDto } from './dto/create-lecture-summary.dto';
import { UpdateLectureSummaryStatusDto } from './dto/update-lecture-summary-status.dto';
import { UpdateLectureSummaryResultDto } from './dto/update-lecture-summary-result.dto';

@Injectable()
export class LectureSummariesService {
  private readonly logger = new Logger(LectureSummariesService.name);

  constructor(
    @InjectRepository(TbAiLectureSummary)
    private readonly summaryRepository: Repository<TbAiLectureSummary>,
  ) {}

  async list(query: ListLectureSummariesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.summaryRepository
      .createQueryBuilder('ls')
      .leftJoin(TbSpace, 's', 's.space_seq = ls.space_seq')
      .leftJoin(TbBuilding, 'b', 'b.building_seq = s.building_seq')
      .leftJoin(TbUser, 'u', 'u.tu_seq = ls.tu_seq')
      .select([
        'ls.summary_seq AS summarySeq',
        's.space_name AS spaceName',
        's.space_floor AS spaceFloor',
        'b.building_name AS buildingName',
        'u.tu_name AS userName',
        'ls.device_code AS deviceCode',
        'ls.job_id AS jobId',
        'ls.recording_title AS recordingTitle',
        'ls.recording_filename AS recordingFilename',
        'ls.duration_seconds AS durationSeconds',
        'ls.recorded_at AS recordedAt',
        'ls.process_status AS processStatus',
        'ls.summary_keywords AS summaryKeywords',
        'ls.completed_at AS completedAt',
        'ls.reg_date AS regDate',
      ])
      .where("ls.summary_isdel = 'N'");

    if (query.spaceSeq) {
      qb.andWhere('ls.space_seq = :spaceSeq', { spaceSeq: query.spaceSeq });
    }
    if (query.buildingSeq) {
      qb.andWhere('s.building_seq = :buildingSeq', { buildingSeq: query.buildingSeq });
    }
    if (query.processStatus) {
      qb.andWhere('ls.process_status = :processStatus', { processStatus: query.processStatus });
    }
    if (query.search) {
      qb.andWhere(
        '(ls.recording_title LIKE :search OR ls.recording_filename LIKE :search OR ls.summary_keywords LIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.startDate) {
      qb.andWhere('ls.recorded_at >= :startDate', { startDate: `${query.startDate} 00:00:00` });
    }
    if (query.endDate) {
      qb.andWhere('ls.recorded_at <= :endDate', { endDate: `${query.endDate} 23:59:59` });
    }

    const totalQuery = qb.clone();
    const totalResult = await totalQuery.select('COUNT(*)', 'cnt').getRawOne();
    const total = parseInt(totalResult?.cnt ?? '0', 10);

    const rawItems = await qb
      .orderBy('ls.recorded_at', 'DESC')
      .addOrderBy('ls.reg_date', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    const items = rawItems.map((row, index) => {
      let durationFormatted: string | null = null;
      if (row.durationSeconds) {
        const hours = Math.floor(row.durationSeconds / 3600);
        const minutes = Math.floor((row.durationSeconds % 3600) / 60);
        durationFormatted = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
      }

      let summaryKeywords: string[] | null = null;
      if (row.summaryKeywords) {
        try { summaryKeywords = JSON.parse(row.summaryKeywords); } catch { /* ignore */ }
      }

      return {
        no: total - skip - index,
        summarySeq: row.summarySeq,
        buildingName: row.buildingName ?? '',
        spaceName: row.spaceName ?? '',
        spaceFloor: row.spaceFloor ?? '',
        userName: row.userName ?? '',
        deviceCode: row.deviceCode,
        jobId: row.jobId,
        recordingTitle: row.recordingTitle ?? '',
        recordingFilename: row.recordingFilename,
        durationSeconds: row.durationSeconds,
        durationFormatted,
        recordedAt: row.recordedAt,
        processStatus: row.processStatus,
        summaryKeywords,
        completedAt: row.completedAt,
        regDate: row.regDate,
      };
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(summarySeq: number) {
    const raw = await this.summaryRepository
      .createQueryBuilder('ls')
      .leftJoin(TbSpace, 's', 's.space_seq = ls.space_seq')
      .leftJoin(TbBuilding, 'b', 'b.building_seq = s.building_seq')
      .leftJoin(TbUser, 'u', 'u.tu_seq = ls.tu_seq')
      .select([
        'ls.summary_seq AS summarySeq',
        'ls.space_seq AS spaceSeq',
        's.space_name AS spaceName',
        's.space_floor AS spaceFloor',
        'b.building_name AS buildingName',
        'ls.tu_seq AS tuSeq',
        'u.tu_name AS userName',
        'ls.device_code AS deviceCode',
        'ls.job_id AS jobId',
        'ls.recording_title AS recordingTitle',
        'ls.recording_filename AS recordingFilename',
        'ls.duration_seconds AS durationSeconds',
        'ls.recorded_at AS recordedAt',
        'ls.stt_text AS sttText',
        'ls.stt_language AS sttLanguage',
        'ls.stt_confidence AS sttConfidence',
        'ls.summary_text AS summaryText',
        'ls.summary_keywords AS summaryKeywords',
        'ls.process_status AS processStatus',
        'ls.completed_at AS completedAt',
        'ls.session_seq AS sessionSeq',
        'ls.reg_date AS regDate',
        'ls.upd_date AS updDate',
      ])
      .where('ls.summary_seq = :summarySeq', { summarySeq })
      .andWhere("ls.summary_isdel = 'N'")
      .getRawOne();

    if (!raw) {
      throw new NotFoundException('강의요약을 찾을 수 없습니다');
    }

    let durationFormatted: string | null = null;
    if (raw.durationSeconds) {
      const hours = Math.floor(raw.durationSeconds / 3600);
      const minutes = Math.floor((raw.durationSeconds % 3600) / 60);
      durationFormatted = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
    }

    let summaryKeywords: string[] | null = null;
    if (raw.summaryKeywords) {
      try { summaryKeywords = JSON.parse(raw.summaryKeywords); } catch { /* ignore */ }
    }

    return {
      summarySeq: raw.summarySeq,
      spaceSeq: raw.spaceSeq,
      buildingName: raw.buildingName ?? '',
      spaceName: raw.spaceName ?? '',
      spaceFloor: raw.spaceFloor ?? '',
      tuSeq: raw.tuSeq,
      userName: raw.userName ?? '',
      deviceCode: raw.deviceCode,
      jobId: raw.jobId,
      recordingTitle: raw.recordingTitle ?? '',
      recordingFilename: raw.recordingFilename,
      durationSeconds: raw.durationSeconds,
      durationFormatted,
      recordedAt: raw.recordedAt,
      sttText: raw.sttText,
      sttLanguage: raw.sttLanguage,
      sttConfidence: raw.sttConfidence,
      summaryText: raw.summaryText,
      summaryKeywords,
      processStatus: raw.processStatus,
      completedAt: raw.completedAt,
      sessionSeq: raw.sessionSeq,
      regDate: raw.regDate,
      updDate: raw.updDate,
    };
  }

  async create(dto: CreateLectureSummaryDto) {
    const entity = this.summaryRepository.create({
      spaceSeq: dto.spaceSeq,
      tuSeq: dto.tuSeq ?? null,
      deviceCode: dto.deviceCode,
      jobId: dto.jobId,
      recordingTitle: dto.recordingTitle ?? null,
      recordingFilename: dto.recordingFilename,
      durationSeconds: dto.durationSeconds ?? null,
      recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : null,
      processStatus: ProcessStatus.UPLOADING,
    });

    const saved = await this.summaryRepository.save(entity);
    return {
      summarySeq: saved.summarySeq,
      jobId: saved.jobId,
      processStatus: saved.processStatus,
      message: '강의요약 레코드가 생성되었습니다.',
    };
  }

  async updateStatus(summarySeq: number, dto: UpdateLectureSummaryStatusDto) {
    const entity = await this.summaryRepository.findOne({
      where: { summarySeq, summaryIsdel: 'N' },
    });
    if (!entity) {
      throw new NotFoundException('강의요약을 찾을 수 없습니다');
    }

    entity.processStatus = dto.processStatus;
    await this.summaryRepository.save(entity);

    return {
      summarySeq: entity.summarySeq,
      processStatus: entity.processStatus,
      message: '상태가 변경되었습니다.',
    };
  }

  async updateResult(summarySeq: number, dto: UpdateLectureSummaryResultDto) {
    const entity = await this.summaryRepository.findOne({
      where: { summarySeq, summaryIsdel: 'N' },
    });
    if (!entity) {
      throw new NotFoundException('강의요약을 찾을 수 없습니다');
    }

    entity.sttText = dto.sttText;
    entity.summaryText = dto.summaryText;
    entity.completedAt = new Date(dto.completedAt);
    entity.processStatus = ProcessStatus.COMPLETED;
    if (dto.sttLanguage !== undefined) entity.sttLanguage = dto.sttLanguage;
    if (dto.sttConfidence !== undefined) entity.sttConfidence = dto.sttConfidence;
    if (dto.summaryKeywords) entity.summaryKeywords = JSON.stringify(dto.summaryKeywords);
    if (dto.sessionSeq !== undefined) entity.sessionSeq = dto.sessionSeq;

    await this.summaryRepository.save(entity);

    return {
      summarySeq: entity.summarySeq,
      processStatus: entity.processStatus,
      message: '강의요약 결과가 저장되었습니다.',
    };
  }

  async remove(summarySeq: number) {
    const entity = await this.summaryRepository.findOne({
      where: { summarySeq, summaryIsdel: 'N' },
    });
    if (!entity) {
      throw new NotFoundException('강의요약을 찾을 수 없습니다');
    }

    entity.summaryIsdel = 'Y';
    await this.summaryRepository.save(entity);

    return { summarySeq: entity.summarySeq, message: '강의요약이 삭제되었습니다.' };
  }

  async findByJobId(jobId: string) {
    return this.summaryRepository.findOne({
      where: { jobId, summaryIsdel: 'N' },
    });
  }
}
