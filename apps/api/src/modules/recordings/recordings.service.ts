import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbRecordingSession } from '@modules/recorders/entities/recording-session.entity';
import { TbRecordingFile } from '@modules/recorders/entities/recording-file.entity';
import { QuerySessionsDto, QueryFilesDto } from './dto/query-recordings.dto';
import { FtpStatus } from '@modules/recorders/enums/ftp-status.enum';

@Injectable()
export class RecordingsService {
  constructor(
    @InjectRepository(TbRecordingSession)
    private readonly sessionRepo: Repository<TbRecordingSession>,
    @InjectRepository(TbRecordingFile)
    private readonly fileRepo: Repository<TbRecordingFile>,
  ) {}

  // ──────────────── 세션 이력 ────────────────

  async findSessions(query: QuerySessionsDto) {
    const { page = 1, limit = 20, buildingSeq, recorderSeq, tuSeq, status, startDate, endDate } = query;

    const qb = this.sessionRepo
      .createQueryBuilder('s')
      .leftJoin('s.recorder', 'recorder')
      .addSelect(['recorder.recorderSeq', 'recorder.recorderName', 'recorder.spaceSeq'])
      .leftJoin('recorder.space', 'space')
      .addSelect(['space.spaceName', 'space.spaceFloor', 'space.buildingSeq'])
      .leftJoin('space.building', 'building')
      .addSelect(['building.buildingSeq', 'building.buildingName'])
      .leftJoin('s.user', 'user')
      .addSelect(['user.seq', 'user.name'])
      .leftJoin('s.preset', 'preset')
      .addSelect(['preset.recPresetSeq', 'preset.presetName']);

    if (buildingSeq) {
      qb.andWhere('space.building_seq = :buildingSeq', { buildingSeq });
    }
    if (recorderSeq) {
      qb.andWhere('s.recorder_seq = :recorderSeq', { recorderSeq });
    }
    if (tuSeq) {
      qb.andWhere('s.tu_seq = :tuSeq', { tuSeq });
    }
    if (status) {
      qb.andWhere('s.session_status = :status', { status });
    }
    if (startDate) {
      qb.andWhere('s.started_at >= :startDate', { startDate: `${startDate} 00:00:00` });
    }
    if (endDate) {
      qb.andWhere('s.started_at <= :endDate', { endDate: `${endDate} 23:59:59` });
    }

    qb.orderBy('s.startedAt', 'DESC');

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const result = await Promise.all(
      items.map(async (s, idx) => {
        const fileCount = await this.fileRepo.count({
          where: { recSessionSeq: s.recSessionSeq, fileIsdel: 'N' },
        });

        return {
          no: total - (page - 1) * limit - idx,
          recSessionSeq: s.recSessionSeq,
          recorderName: s.recorder?.recorderName ?? null,
          buildingName: s.recorder?.space?.building?.buildingName ?? null,
          spaceName: s.recorder?.space?.spaceName ?? null,
          sessionTitle: s.sessionTitle,
          userName: s.user?.name ?? null,
          sessionStatus: s.sessionStatus,
          startedAt: s.startedAt,
          endedAt: s.endedAt,
          durationSec: s.durationSec,
          fileCount,
          presetName: s.preset?.presetName ?? null,
        };
      }),
    );

    return {
      items: result,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSessionDetail(recSessionSeq: number) {
    const session = await this.sessionRepo.findOne({
      where: { recSessionSeq },
      relations: ['recorder', 'recorder.space', 'recorder.space.building', 'user', 'preset'],
    });

    if (!session) {
      throw new NotFoundException('해당 녹화 세션을 찾을 수 없습니다.');
    }

    const files = await this.fileRepo.find({
      where: { recSessionSeq, fileIsdel: 'N' },
      order: { regDate: 'ASC' },
    });

    return {
      recSessionSeq: session.recSessionSeq,
      recorderSeq: session.recorderSeq,
      recorderName: session.recorder?.recorderName ?? null,
      buildingName: session.recorder?.space?.building?.buildingName ?? null,
      spaceName: session.recorder?.space?.spaceName ?? null,
      sessionTitle: session.sessionTitle,
      userName: session.user?.name ?? null,
      sessionStatus: session.sessionStatus,
      presetName: session.preset?.presetName ?? null,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      durationSec: session.durationSec,
      files: files.map((f) => ({
        recFileSeq: f.recFileSeq,
        fileName: f.fileName,
        filePath: f.filePath,
        fileSize: f.fileSize,
        fileFormat: f.fileFormat,
        fileDurationSec: f.fileDurationSec,
        ftpStatus: f.ftpStatus,
        ftpUploadedPath: f.ftpUploadedPath,
        ftpUploadedAt: f.ftpUploadedAt,
        ftpRetryCount: f.ftpRetryCount,
      })),
    };
  }

  // ──────────────── 파일 관리 ────────────────

  async findFiles(query: QueryFilesDto) {
    const { page = 1, limit = 20, buildingSeq, ftpStatus, startDate, endDate } = query;

    const qb = this.fileRepo
      .createQueryBuilder('f')
      .leftJoin('f.session', 'session')
      .addSelect(['session.recSessionSeq', 'session.sessionTitle', 'session.tuSeq', 'session.recorderSeq'])
      .leftJoin('session.user', 'user')
      .addSelect(['user.seq', 'user.name'])
      .leftJoin('session.recorder', 'recorder')
      .addSelect(['recorder.recorderSeq', 'recorder.recorderName', 'recorder.spaceSeq'])
      .leftJoin('recorder.space', 'space')
      .addSelect(['space.spaceName', 'space.buildingSeq'])
      .leftJoin('space.building', 'building')
      .addSelect(['building.buildingSeq', 'building.buildingName'])
      .where('f.file_isdel = :isdel', { isdel: 'N' });

    if (buildingSeq) {
      qb.andWhere('space.building_seq = :buildingSeq', { buildingSeq });
    }
    if (ftpStatus) {
      qb.andWhere('f.ftp_status = :ftpStatus', { ftpStatus });
    }
    if (startDate) {
      qb.andWhere('f.reg_date >= :startDate', { startDate: `${startDate} 00:00:00` });
    }
    if (endDate) {
      qb.andWhere('f.reg_date <= :endDate', { endDate: `${endDate} 23:59:59` });
    }

    qb.orderBy('f.regDate', 'DESC');

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items: items.map((f, idx) => ({
        no: total - (page - 1) * limit - idx,
        recFileSeq: f.recFileSeq,
        fileName: f.fileName,
        fileSize: f.fileSize,
        fileSizeFormatted: this.formatFileSize(f.fileSize ? Number(f.fileSize) : null),
        fileFormat: f.fileFormat,
        fileDurationSec: f.fileDurationSec,
        ftpStatus: f.ftpStatus,
        ftpUploadedAt: f.ftpUploadedAt,
        ftpRetryCount: f.ftpRetryCount,
        ftpErrorMessage: f.ftpErrorMessage,
        sessionTitle: f.session?.sessionTitle ?? null,
        userName: f.session?.user?.name ?? null,
        buildingName: f.session?.recorder?.space?.building?.buildingName ?? null,
        spaceName: f.session?.recorder?.space?.spaceName ?? null,
        regDate: f.regDate,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async retryUpload(recFileSeq: number) {
    const file = await this.fileRepo.findOne({
      where: { recFileSeq, fileIsdel: 'N' },
    });

    if (!file) {
      throw new NotFoundException('해당 파일을 찾을 수 없습니다.');
    }

    if (file.ftpStatus === FtpStatus.COMPLETED) {
      throw new ConflictException('이미 업로드 완료된 파일입니다.');
    }

    if (file.ftpRetryCount >= 3) {
      throw new ConflictException('최대 재시도 횟수(3회)를 초과했습니다.');
    }

    file.ftpStatus = FtpStatus.RETRY;
    file.ftpRetryCount += 1;
    await this.fileRepo.save(file);

    return {
      recFileSeq: file.recFileSeq,
      ftpStatus: file.ftpStatus,
      ftpRetryCount: file.ftpRetryCount,
      message: `FTP 업로드 재시도를 시작합니다 (${file.ftpRetryCount}/3회)`,
    };
  }

  // ──────────────── 파일 다운로드 / 미리보기 ────────────────

  async getFileForDownload(recFileSeq: number, userSeq: number) {
    const file = await this.fileRepo.findOne({
      where: { recFileSeq, fileIsdel: 'N' },
      relations: ['session'],
    });
    if (!file) {
      throw new NotFoundException('해당 파일을 찾을 수 없습니다.');
    }
    if (file.session.tuSeq !== userSeq) {
      throw new ForbiddenException('녹화를 진행한 사용자만 접근할 수 있습니다.');
    }
    return {
      recFileSeq: file.recFileSeq,
      fileName: file.fileName,
      filePath: file.filePath,
      fileSize: file.fileSize,
      fileFormat: file.fileFormat,
      ftpUploadedPath: file.ftpUploadedPath,
    };
  }

  async getFileForPreview(recFileSeq: number, userSeq: number) {
    const file = await this.fileRepo.findOne({
      where: { recFileSeq, fileIsdel: 'N' },
      relations: ['session'],
    });
    if (!file) {
      throw new NotFoundException('해당 파일을 찾을 수 없습니다.');
    }
    if (file.session.tuSeq !== userSeq) {
      throw new ForbiddenException('녹화를 진행한 사용자만 접근할 수 있습니다.');
    }
    return {
      recFileSeq: file.recFileSeq,
      fileName: file.fileName,
      fileFormat: file.fileFormat,
      fileDurationSec: file.fileDurationSec,
      fileSize: file.fileSize,
      fileSizeFormatted: this.formatFileSize(file.fileSize ? Number(file.fileSize) : null),
      previewPath: file.ftpUploadedPath ?? file.filePath,
    };
  }

  // ──────────────── 헬퍼 ────────────────

  private formatFileSize(bytes: number | null): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(1)} ${units[i]}`;
  }
}
