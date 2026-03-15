import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client as FtpClient } from 'basic-ftp';
import SftpClient from 'ssh2-sftp-client';
import { TbFtpConfig } from './entities/ftp-config.entity';
import { TbRecordingFile } from '@modules/recorders/entities/recording-file.entity';
import { CreateFtpConfigDto } from './dto/create-ftp-config.dto';
import { UpdateFtpConfigDto } from './dto/update-ftp-config.dto';

@Injectable()
export class FtpService {
  private readonly logger = new Logger(FtpService.name);

  constructor(
    @InjectRepository(TbFtpConfig)
    private readonly ftpConfigRepo: Repository<TbFtpConfig>,
    @InjectRepository(TbRecordingFile)
    private readonly recordingFileRepo: Repository<TbRecordingFile>,
  ) {}

  async findAll() {
    const items = await this.ftpConfigRepo.find({
      where: { ftpIsdel: 'N' },
      relations: ['recorder'],
      order: { isDefault: 'DESC', ftpConfigSeq: 'ASC' },
    });

    return {
      items: items.map((c) => ({
        ftpConfigSeq: c.ftpConfigSeq,
        ftpName: c.ftpName,
        ftpHost: c.ftpHost,
        ftpPort: c.ftpPort,
        ftpProtocol: c.ftpProtocol,
        ftpPath: c.ftpPath,
        ftpPassiveMode: c.ftpPassiveMode,
        isDefault: c.isDefault,
        recorderSeq: c.recorderSeq,
        recorderName: c.recorder?.recorderName ?? null,
        regDate: c.regDate,
      })),
    };
  }

  async findOne(ftpConfigSeq: number) {
    const config = await this.ftpConfigRepo.findOne({
      where: { ftpConfigSeq, ftpIsdel: 'N' },
      relations: ['recorder'],
    });
    if (!config) {
      throw new NotFoundException('해당 FTP 설정을 찾을 수 없습니다.');
    }
    return config;
  }

  async create(dto: CreateFtpConfigDto) {
    // 기본 설정으로 등록할 경우, 기존 기본 설정 해제
    if (dto.isDefault === 'Y') {
      await this.ftpConfigRepo.update(
        { isDefault: 'Y', ftpIsdel: 'N' },
        { isDefault: 'N' },
      );
    }

    const config = this.ftpConfigRepo.create({
      ftpName: dto.ftpName,
      ftpHost: dto.ftpHost,
      ftpPort: dto.ftpPort ?? 21,
      ftpUsername: dto.ftpUsername,
      ftpPassword: dto.ftpPassword,
      ftpPath: dto.ftpPath ?? '/',
      ftpProtocol: dto.ftpProtocol ?? 'FTP',
      ftpPassiveMode: dto.ftpPassiveMode ?? 'Y',
      isDefault: dto.isDefault ?? 'N',
      recorderSeq: dto.recorderSeq ?? null,
    });

    const saved = await this.ftpConfigRepo.save(config);
    return {
      ftpConfigSeq: saved.ftpConfigSeq,
      ftpName: saved.ftpName,
      ftpHost: saved.ftpHost,
      ftpPort: saved.ftpPort,
      ftpProtocol: saved.ftpProtocol,
      ftpPath: saved.ftpPath,
      isDefault: saved.isDefault,
      regDate: saved.regDate,
    };
  }

  async update(ftpConfigSeq: number, dto: UpdateFtpConfigDto) {
    const config = await this.findOne(ftpConfigSeq);

    if (dto.isDefault === 'Y') {
      await this.ftpConfigRepo.update(
        { isDefault: 'Y', ftpIsdel: 'N' },
        { isDefault: 'N' },
      );
    }

    const updateData: Partial<TbFtpConfig> = {};
    if (dto.ftpName !== undefined) updateData.ftpName = dto.ftpName;
    if (dto.ftpHost !== undefined) updateData.ftpHost = dto.ftpHost;
    if (dto.ftpPort !== undefined) updateData.ftpPort = dto.ftpPort;
    if (dto.ftpUsername !== undefined) updateData.ftpUsername = dto.ftpUsername;
    if (dto.ftpPassword !== undefined && dto.ftpPassword !== '') {
      updateData.ftpPassword = dto.ftpPassword;
    }
    if (dto.ftpPath !== undefined) updateData.ftpPath = dto.ftpPath;
    if (dto.ftpProtocol !== undefined) updateData.ftpProtocol = dto.ftpProtocol;
    if (dto.ftpPassiveMode !== undefined) updateData.ftpPassiveMode = dto.ftpPassiveMode;
    if (dto.isDefault !== undefined) updateData.isDefault = dto.isDefault;
    if (dto.recorderSeq !== undefined) updateData.recorderSeq = dto.recorderSeq;

    await this.ftpConfigRepo.update(ftpConfigSeq, updateData);

    return {
      ftpConfigSeq,
      message: 'FTP 설정이 수정되었습니다',
    };
  }

  async remove(ftpConfigSeq: number) {
    await this.findOne(ftpConfigSeq);

    // 사용 중인 파일 확인
    const inUse = await this.recordingFileRepo.count({
      where: { ftpConfigSeq, fileIsdel: 'N' },
    });
    if (inUse > 0) {
      throw new ConflictException('이 FTP 설정을 사용 중인 파일이 있어 삭제할 수 없습니다.');
    }

    await this.ftpConfigRepo.update(ftpConfigSeq, { ftpIsdel: 'Y' });
    return { message: 'FTP 설정이 삭제되었습니다' };
  }

  async testConnection(ftpConfigSeq: number) {
    const config = await this.findOne(ftpConfigSeq);

    if (config.ftpProtocol === 'SFTP') {
      return this.testSftpConnection(config);
    }
    return this.testFtpConnection(config);
  }

  private async testFtpConnection(config: TbFtpConfig) {
    const client = new FtpClient(5000);
    client.ftp.verbose = false;

    try {
      const accessResponse = await client.access({
        host: config.ftpHost,
        port: config.ftpPort ?? 21,
        user: config.ftpUsername,
        password: config.ftpPassword,
        secure: config.ftpProtocol === 'FTPS',
        secureOptions: config.ftpProtocol === 'FTPS' ? { rejectUnauthorized: false } : undefined,
      });

      // passive mode
      client.ftp.socket.setKeepAlive(true);
      if (config.ftpPassiveMode === 'N') {
        client.ftp.socket.setNoDelay(true);
      }

      const serverInfo = accessResponse.message ?? `${config.ftpProtocol} server at ${config.ftpHost}:${config.ftpPort}`;

      // verify path exists
      const targetPath = config.ftpPath ?? '/';
      await client.list(targetPath);

      this.logger.log(`FTP connection test SUCCESS: ${config.ftpHost}:${config.ftpPort} (${config.ftpProtocol})`);

      return {
        result: 'SUCCESS' as const,
        message: `${config.ftpProtocol} 연결 성공 — 경로 "${targetPath}" 확인 완료`,
        serverInfo,
        testedAt: new Date(),
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.logger.warn(`FTP connection test FAIL: ${config.ftpHost} — ${err?.message}`);
      return {
        result: 'FAIL' as const,
        message: `FTP 연결 실패: ${err?.message ?? '알 수 없는 오류'}`,
        testedAt: new Date(),
      };
    } finally {
      client.close();
    }
  }

  private async testSftpConnection(config: TbFtpConfig) {
    const sftp = new SftpClient();

    try {
      await sftp.connect({
        host: config.ftpHost,
        port: config.ftpPort ?? 22,
        username: config.ftpUsername,
        password: config.ftpPassword,
        readyTimeout: 5000,
      });

      // verify path exists
      const targetPath = config.ftpPath ?? '/';
      await sftp.list(targetPath);

      const serverVersion: string = (sftp as unknown as { _sftp?: { server?: { identRaw?: string } } })
        ?._sftp?.server?.identRaw ?? `SFTP server at ${config.ftpHost}:${config.ftpPort}`;

      this.logger.log(`SFTP connection test SUCCESS: ${config.ftpHost}:${config.ftpPort}`);

      return {
        result: 'SUCCESS' as const,
        message: `SFTP 연결 성공 — 경로 "${targetPath}" 확인 완료`,
        serverInfo: serverVersion,
        testedAt: new Date(),
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.logger.warn(`SFTP connection test FAIL: ${config.ftpHost} — ${err?.message}`);
      return {
        result: 'FAIL' as const,
        message: `SFTP 연결 실패: ${err?.message ?? '알 수 없는 오류'}`,
        testedAt: new Date(),
      };
    } finally {
      await sftp.end();
    }
  }

  // ──────────────── FTP 전송 로직 ────────────────

  async getConfigForRecorder(recorderSeq: number): Promise<TbFtpConfig | null> {
    const dedicated = await this.ftpConfigRepo.findOne({
      where: { recorderSeq, ftpIsdel: 'N' },
    });
    if (dedicated) return dedicated;

    const defaultConfig = await this.ftpConfigRepo.findOne({
      where: { isDefault: 'Y', ftpIsdel: 'N' },
    });
    return defaultConfig ?? null;
  }

  async downloadAndUpload(
    config: TbFtpConfig,
    recorderFilePath: string,
    fileName: string,
  ): Promise<string> {
    const fs = await import('fs');
    const path = await import('path');

    const tmpDir = '/tmp/recordings';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const localTmpPath = path.join(tmpDir, `${Date.now()}_${fileName}`);

    await this.downloadFile(config, recorderFilePath, fileName, localTmpPath);

    try {
      const uploadPath = `${config.ftpPath ?? '/'}/${fileName}`;
      await this.uploadFile(config, localTmpPath, uploadPath);
      return uploadPath;
    } finally {
      try {
        if (fs.existsSync(localTmpPath)) fs.unlinkSync(localTmpPath);
      } catch {
        this.logger.warn(`Failed to cleanup tmp file: ${localTmpPath}`);
      }
    }
  }

  private async downloadFile(
    config: TbFtpConfig,
    remotePath: string,
    fileName: string,
    localPath: string,
  ): Promise<void> {
    const fs = await import('fs');
    const remoteFilePath = `${remotePath}${fileName}`;

    if (config.ftpProtocol === 'SFTP') {
      const sftp = new SftpClient();
      try {
        await sftp.connect({
          host: config.ftpHost,
          port: config.ftpPort ?? 22,
          username: config.ftpUsername,
          password: config.ftpPassword,
          readyTimeout: 10000,
        });
        await sftp.fastGet(remoteFilePath, localPath);
      } finally {
        await sftp.end();
      }
    } else {
      const client = new FtpClient(30000);
      try {
        await client.access({
          host: config.ftpHost,
          port: config.ftpPort ?? 21,
          user: config.ftpUsername,
          password: config.ftpPassword,
          secure: config.ftpProtocol === 'FTPS',
          secureOptions: config.ftpProtocol === 'FTPS' ? { rejectUnauthorized: false } : undefined,
        });
        const writeStream = fs.createWriteStream(localPath);
        await client.downloadTo(writeStream, remoteFilePath);
      } finally {
        client.close();
      }
    }
  }

  private async uploadFile(
    config: TbFtpConfig,
    localPath: string,
    remotePath: string,
  ): Promise<void> {
    const fs = await import('fs');

    if (config.ftpProtocol === 'SFTP') {
      const sftp = new SftpClient();
      try {
        await sftp.connect({
          host: config.ftpHost,
          port: config.ftpPort ?? 22,
          username: config.ftpUsername,
          password: config.ftpPassword,
          readyTimeout: 10000,
        });
        await sftp.fastPut(localPath, remotePath);
      } finally {
        await sftp.end();
      }
    } else {
      const client = new FtpClient(30000);
      try {
        await client.access({
          host: config.ftpHost,
          port: config.ftpPort ?? 21,
          user: config.ftpUsername,
          password: config.ftpPassword,
          secure: config.ftpProtocol === 'FTPS',
          secureOptions: config.ftpProtocol === 'FTPS' ? { rejectUnauthorized: false } : undefined,
        });
        const readStream = fs.createReadStream(localPath);
        await client.uploadFrom(readStream, remotePath);
      } finally {
        client.close();
      }
    }
  }
}
