import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TbRecordingFile } from '@modules/recorders/entities/recording-file.entity';
import { FtpStatus } from '@modules/recorders/enums/ftp-status.enum';
import { FtpService } from './ftp.service';

@Injectable()
export class FtpUploadJobService implements OnModuleInit {
  private readonly logger = new Logger(FtpUploadJobService.name);
  private readonly POLL_INTERVAL_MS = 30000;
  private readonly MAX_RETRY_COUNT = 3;
  private isProcessing = false;

  constructor(
    @InjectRepository(TbRecordingFile)
    private readonly fileRepo: Repository<TbRecordingFile>,
    private readonly ftpService: FtpService,
  ) {}

  async onModuleInit() {
    const stuckResult = await this.fileRepo.update(
      { ftpStatus: FtpStatus.UPLOADING },
      { ftpStatus: FtpStatus.RETRY },
    );
    if (stuckResult.affected && stuckResult.affected > 0) {
      this.logger.warn(`Recovered ${stuckResult.affected} stuck UPLOADING files → RETRY`);
    }

    setInterval(() => this.processQueue(), this.POLL_INTERVAL_MS);
    this.logger.log('FTP Upload Job started (30s polling)');
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pendingFiles = await this.fileRepo.find({
        where: [
          { ftpStatus: FtpStatus.PENDING, fileIsdel: 'N' },
          { ftpStatus: FtpStatus.RETRY, fileIsdel: 'N' },
        ],
        order: { regDate: 'ASC' },
      });

      for (const file of pendingFiles) {
        if (file.ftpRetryCount >= this.MAX_RETRY_COUNT) {
          await this.fileRepo.update(file.recFileSeq, {
            ftpStatus: FtpStatus.FAILED,
            ftpErrorMessage: '최대 재시도 횟수 초과 (3회)',
          });
          continue;
        }
        await this.processFile(file);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async processFile(file: TbRecordingFile): Promise<void> {
    if (!file.ftpConfigSeq) {
      await this.fileRepo.update(file.recFileSeq, {
        ftpStatus: FtpStatus.FAILED,
        ftpErrorMessage: 'FTP 설정이 매핑되지 않았습니다. 녹화기 FTP 설정을 확인하세요.',
      });
      this.logger.warn(`No FTP config for file ${file.recFileSeq} — skipped`);
      return;
    }

    await this.fileRepo.update(file.recFileSeq, {
      ftpStatus: FtpStatus.UPLOADING,
    });

    try {
      const ftpConfig = await this.ftpService.findOne(file.ftpConfigSeq);

      const uploadedPath = await this.ftpService.downloadAndUpload(
        ftpConfig,
        file.filePath ?? '/',
        file.fileName,
      );

      await this.fileRepo.update(file.recFileSeq, {
        ftpStatus: FtpStatus.COMPLETED,
        ftpUploadedPath: uploadedPath,
        ftpUploadedAt: new Date(),
        ftpErrorMessage: null as unknown as string,
      });

      this.logger.log(`FTP upload completed: ${file.fileName}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      const newRetryCount = file.ftpRetryCount + 1;

      await this.fileRepo.update(file.recFileSeq, {
        ftpStatus: newRetryCount < this.MAX_RETRY_COUNT ? FtpStatus.RETRY : FtpStatus.FAILED,
        ftpRetryCount: newRetryCount,
        ftpErrorMessage: err?.message ?? '알 수 없는 오류',
      });

      this.logger.warn(
        `FTP upload failed (${newRetryCount}/${this.MAX_RETRY_COUNT}): ${file.fileName} — ${err?.message}`,
      );
    }
  }
}
