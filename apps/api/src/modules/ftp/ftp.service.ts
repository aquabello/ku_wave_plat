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
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
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
      relations: ['recorder', 'recorder.space', 'recorder.space.building'],
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
        buildingName: (c.recorder?.space as any)?.building?.buildingName ?? null,
        spaceName: (c.recorder?.space as any)?.spaceName ?? null,
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

  // ──────────────── 디스크 캐시 (최근 10건) ────────────────

  private readonly CACHE_DIR = path.join(os.tmpdir(), 'ku-recordings', 'cache');
  private readonly MAX_CACHE_FILES = 10;

  private ensureCacheDir() {
    if (!fs.existsSync(this.CACHE_DIR)) {
      fs.mkdirSync(this.CACHE_DIR, { recursive: true });
    }
  }

  getCachedPath(recFileSeq: number): string | null {
    const cached = path.join(this.CACHE_DIR, `${recFileSeq}.mp4`);
    return fs.existsSync(cached) ? cached : null;
  }

  /**
   * 캐시에서 파일 반환, 없으면 FTP 다운로드 후 캐시 저장
   */
  async getFileWithCache(recFileSeq: number, windowsFilePath: string): Promise<string> {
    const cached = this.getCachedPath(recFileSeq);
    if (cached) {
      this.logger.debug(`Cache HIT: recFileSeq=${recFileSeq}`);
      return cached;
    }

    this.logger.debug(`Cache MISS: recFileSeq=${recFileSeq}, downloading from FTP...`);
    const localPath = await this.downloadToCache(recFileSeq, windowsFilePath);
    this.cleanupCache();
    return localPath;
  }

  /**
   * FTP에서 다운로드하여 캐시에 저장
   */
  async downloadToCache(recFileSeq: number, windowsFilePath: string): Promise<string> {
    this.ensureCacheDir();
    const config = await this.ftpConfigRepo.findOne({
      where: { isDefault: 'Y', ftpIsdel: 'N' },
    });
    if (!config) {
      throw new NotFoundException('기본 FTP 설정이 없습니다.');
    }

    const { remotePath, fileName } = this.convertWindowsPathToFtp(windowsFilePath);
    const cachePath = path.join(this.CACHE_DIR, `${recFileSeq}.mp4`);

    await this.downloadFile(config, remotePath, fileName, cachePath);
    this.logger.log(`Cached: recFileSeq=${recFileSeq} → ${cachePath}`);
    return cachePath;
  }

  /**
   * 캐시 정리: MAX_CACHE_FILES 초과 시 오래된 것부터 삭제
   */
  private cleanupCache() {
    this.ensureCacheDir();
    const files = fs.readdirSync(this.CACHE_DIR)
      .filter((f) => f.endsWith('.mp4'))
      .map((f) => ({
        name: f,
        path: path.join(this.CACHE_DIR, f),
        mtime: fs.statSync(path.join(this.CACHE_DIR, f)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime); // 최신순

    if (files.length > this.MAX_CACHE_FILES) {
      const toDelete = files.slice(this.MAX_CACHE_FILES);
      for (const f of toDelete) {
        fs.unlinkSync(f.path);
        this.logger.debug(`Cache cleanup: deleted ${f.name}`);
      }
    }
  }

  /**
   * FTP에서 최신 녹화 폴더의 파일 경로 조회
   */
  async getLatestRecordingPath(): Promise<{ remotePath: string; fileName: string; fileSize: number } | null> {
    const config = await this.ftpConfigRepo.findOne({
      where: { isDefault: 'Y', ftpIsdel: 'N' },
    });
    if (!config) return null;

    const client = new FtpClient(10000);
    try {
      await client.access({
        host: config.ftpHost,
        port: config.ftpPort ?? 21,
        user: config.ftpUsername,
        password: config.ftpPassword,
      });

      const folders = await client.list('/');
      const recFolders = folders
        .filter((f) => f.isDirectory && f.name.startsWith('녹화_'))
        .sort((a, b) => (b.modifiedAt?.getTime() ?? 0) - (a.modifiedAt?.getTime() ?? 0));

      if (recFolders.length === 0) return null;

      const latestFolder = recFolders[0].name;
      const files = await client.list(`/${latestFolder}`);
      const mp4 = files.find((f) => !f.isDirectory && f.name.endsWith('.mp4'));

      if (!mp4) return null;

      return {
        remotePath: `/${latestFolder}/`,
        fileName: mp4.name,
        fileSize: mp4.size,
      };
    } catch (err) {
      this.logger.warn(`FTP latest folder scan failed: ${(err as Error).message}`);
      return null;
    } finally {
      client.close();
    }
  }

  /**
   * Windows 로컬 경로를 FTP 경로로 변환
   * D:\녹화\녹화_260321_0007\\출력.mp4 → /녹화_260321_0007/출력.mp4
   */
  convertWindowsPathToFtp(windowsPath: string): { remotePath: string; fileName: string } {
    const normalized = windowsPath.replace(/\\\\/g, '\\').replace(/\\/g, '/');
    // D:/녹화/녹화_260321_0007/출력.mp4 → 녹화_260321_0007/출력.mp4
    const parts = normalized.split('/');
    const fileName = parts.pop() ?? '';
    // FTP 루트가 D:\녹화\ 이므로 "녹화" 폴더 이후 경로 추출
    const recIdx = parts.findIndex((p) => p.startsWith('녹화_'));
    const remotePath = recIdx >= 0
      ? '/' + parts.slice(recIdx).join('/') + '/'
      : '/' + parts.slice(-1).join('/') + '/';
    return { remotePath, fileName };
  }

  /**
   * FTP에서 파일 다운로드하여 로컬 임시 파일로 저장
   */
  async downloadToLocal(ftpConfigSeq: number, windowsFilePath: string): Promise<string> {
    const config = await this.findOne(ftpConfigSeq);
    const { remotePath, fileName } = this.convertWindowsPathToFtp(windowsFilePath);

    const tmpDir = path.join(os.tmpdir(), 'ku-recordings');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const localPath = path.join(tmpDir, `${Date.now()}_${fileName}`);

    await this.downloadFile(config, remotePath, fileName, localPath);
    return localPath;
  }

  /**
   * FTP에서 파일 다운로드 (기본 FTP 설정 사용)
   */
  async downloadToLocalByDefault(windowsFilePath: string): Promise<string> {
    const config = await this.ftpConfigRepo.findOne({
      where: { isDefault: 'Y', ftpIsdel: 'N' },
    });
    if (!config) {
      throw new NotFoundException('기본 FTP 설정이 없습니다.');
    }
    const { remotePath, fileName } = this.convertWindowsPathToFtp(windowsFilePath);

    const tmpDir = path.join(os.tmpdir(), 'ku-recordings');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const localPath = path.join(tmpDir, `${Date.now()}_${fileName}`);

    await this.downloadFile(config, remotePath, fileName, localPath);
    return localPath;
  }

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
