import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { TbSetting } from './entities/tb-setting.entity';

describe('SettingsService', () => {
  let service: SettingsService;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    },
  } as unknown as QueryRunner;

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  const mockSetting: TbSetting = {
    seq: 1,
    apiTime: '05',
    playerTime: '01',
    screenStart: '08:00',
    screenEnd: '20:00',
    playerVer: '1.0.0',
    playerLink: 'KUDIDPlayer.exe',
    watcherVer: '1.0.0',
    watcherLink: 'konkuk_did_watcher.exe',
    noticeLink: 'campus_map.jpg',
    introLink: 'intro.png',
    defaultImage: '1.png',
    regDate: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getRepositoryToken(TbSetting), useValue: mockRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSystemSettings', () => {
    it('should return existing settings', async () => {
      mockRepository.findOne.mockResolvedValue(mockSetting);
      const result = await service.getSystemSettings();
      expect(result.seq).toBe(1);
      expect(result.apiTime).toBe('05');
      expect(result.screenStart).toBe('08:00');
    });

    it('should throw NotFoundException if no settings exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.getSystemSettings()).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSystemSettings', () => {
    const validDto = {
      apiTime: '10',
      playerTime: '05',
      screenStart: '09:00',
      screenEnd: '18:00',
    };

    it('should update settings atomically', async () => {
      const updated = { ...mockSetting, ...validDto };
      (mockQueryRunner.manager.findOne as jest.Mock).mockResolvedValue({ ...mockSetting });
      (mockQueryRunner.manager.save as jest.Mock).mockResolvedValue(updated);

      const result = await service.updateSystemSettings(validDto);

      expect(result.apiTime).toBe('10');
      expect(result.screenStart).toBe('09:00');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if no settings exist', async () => {
      (mockQueryRunner.manager.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.updateSystemSettings(validDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should rollback on DB error', async () => {
      (mockQueryRunner.manager.findOne as jest.Mock).mockRejectedValue(
        new Error('DB error'),
      );
      await expect(service.updateSystemSettings(validDto)).rejects.toThrow();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should reject invalid image file type', async () => {
      const mockFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from(''),
      } as Express.Multer.File;

      await expect(
        service.updateSystemSettings(validDto, mockFile),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject image exceeding 5MB', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 6 * 1024 * 1024,
        buffer: Buffer.from(''),
      } as Express.Multer.File;

      await expect(
        service.updateSystemSettings(validDto, mockFile),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
