import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TbSetting } from './entities/tb-setting.entity';
import { UpdateSettingDto, SettingResponseDto } from './dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class SettingsService {
  private readonly uploadDir = 'uploads/system';

  constructor(
    @InjectRepository(TbSetting)
    private readonly settingRepository: Repository<TbSetting>,
    private readonly dataSource: DataSource,
  ) {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  async getSystemSettings(): Promise<SettingResponseDto> {
    try {
      const setting = await this.settingRepository.findOne({
        where: {},
        order: { seq: 'ASC' },
      });

      if (!setting) {
        throw new NotFoundException('시스템 설정이 존재하지 않습니다');
      }

      return this.mapToResponseDto(setting);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('시스템 설정을 조회하는 중 오류가 발생했습니다');
    }
  }

  async updateSystemSettings(
    updateDto: UpdateSettingDto,
    file?: Express.Multer.File,
  ): Promise<SettingResponseDto> {
    if (file) {
      this.validateImageFile(file);
    }

    let newFilePath: string | null = null;

    if (file) {
      try {
        newFilePath = await this.saveFile(file);
      } catch (error) {
        throw new InternalServerErrorException('이미지 파일 저장 중 오류가 발생했습니다');
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const setting = await queryRunner.manager.findOne(TbSetting, {
        where: {},
        order: { seq: 'ASC' },
      });

      if (!setting) {
        throw new NotFoundException('시스템 설정이 존재하지 않습니다');
      }

      const oldImage = setting.defaultImage;

      Object.assign(setting, updateDto);
      if (newFilePath) {
        setting.defaultImage = newFilePath;
      }

      const saved = await queryRunner.manager.save(setting);
      await queryRunner.commitTransaction();

      if (newFilePath && oldImage && oldImage !== newFilePath) {
        await this.deleteFile(oldImage);
      }

      return this.mapToResponseDto(saved);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (newFilePath) {
        await this.deleteFile(newFilePath);
      }

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('시스템 설정을 수정하는 중 오류가 발생했습니다');
    } finally {
      await queryRunner.release();
    }
  }

  private async saveFile(file: Express.Multer.File): Promise<string> {
    const timestamp = Date.now();
    const sanitized = this.sanitizeFilename(file.originalname);
    const filename = `${timestamp}-${sanitized}`;
    const filepath = path.join(this.uploadDir, filename);

    await fs.writeFile(filepath, file.buffer);
    return filepath;
  }

  private async deleteFile(filePath: string): Promise<void> {
    if (!filePath) return;
    try {
      await fs.unlink(path.resolve(filePath));
    } catch (error) {
      console.error('Failed to delete file:', filePath, error);
    }
  }

  private validateImageFile(file: Express.Multer.File): void {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedMimeTypes = ['image/jpeg', 'image/png'];

    if (file.size > maxSize) {
      throw new BadRequestException('파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다');
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        '지원하지 않는 파일 형식입니다. JPEG 또는 PNG 파일만 업로드 가능합니다',
      );
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  private mapToResponseDto(setting: TbSetting): SettingResponseDto {
    return {
      seq: setting.seq,
      apiTime: setting.apiTime,
      playerTime: setting.playerTime,
      screenStart: setting.screenStart,
      screenEnd: setting.screenEnd,
      playerVer: setting.playerVer,
      playerLink: setting.playerLink,
      watcherVer: setting.watcherVer,
      watcherLink: setting.watcherLink,
      noticeLink: setting.noticeLink,
      introLink: setting.introLink,
      defaultImage: setting.defaultImage,
      regDate: setting.regDate,
    };
  }
}
