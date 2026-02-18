import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PlayLogsService } from './play-logs.service';
import { TbPlayLog } from './entities/tb-play-log.entity';
import { TbPlayer } from '@modules/players/entities/tb-player.entity';
import { TbContent } from '@modules/contents/entities/tb-content.entity';

describe('PlayLogsService', () => {
  let service: PlayLogsService;
  let playLogRepo: Repository<TbPlayLog>;
  let playerRepo: Repository<TbPlayer>;
  let contentRepo: Repository<TbContent>;

  const mockQueryBuilder = {
    createQueryBuilder: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
  };

  const mockPlayLogRepo = {
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockPlayerRepo = {
    findOne: jest.fn(),
  };

  const mockContentRepo = {
    findOne: jest.fn(),
  };

  const mockPlayer: Partial<TbPlayer> = {
    playerSeq: 1,
    playerName: 'Test Player',
    playerIsdel: 'N',
  };

  const mockContent: Partial<TbContent> = {
    contentSeq: 1,
    contentName: 'Test Content',
    contentIsdel: 'N',
  };

  const mockPlayLog: Partial<TbPlayLog> = {
    logSeq: '1',
    playerSeq: 1,
    playlistSeq: 1,
    contentSeq: 1,
    zoneNumber: 1,
    playStartedAt: new Date('2026-02-14T09:00:00Z'),
    playEndedAt: new Date('2026-02-14T09:05:00Z'),
    playDuration: 300,
    playStatus: 'COMPLETED',
    errorMessage: null,
    playlist: {
      playlistName: 'Test Playlist',
    } as any,
    content: {
      contentName: 'Test Content',
    } as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayLogsService,
        { provide: getRepositoryToken(TbPlayLog), useValue: mockPlayLogRepo },
        { provide: getRepositoryToken(TbPlayer), useValue: mockPlayerRepo },
        { provide: getRepositoryToken(TbContent), useValue: mockContentRepo },
      ],
    }).compile();

    service = module.get<PlayLogsService>(PlayLogsService);
    playLogRepo = module.get<Repository<TbPlayLog>>(getRepositoryToken(TbPlayLog));
    playerRepo = module.get<Repository<TbPlayer>>(getRepositoryToken(TbPlayer));
    contentRepo = module.get<Repository<TbContent>>(getRepositoryToken(TbContent));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlayerLogs', () => {
    it('should return paginated play logs for a player', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(mockPlayer);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockPlayLog], 1]);

      const result = await service.getPlayerLogs(1, { page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].log_seq).toBe('1');
      expect(result.items[0].player_seq).toBe(1);
      expect(result.items[0].play_status).toBe('COMPLETED');
      expect(result.pagination.total).toBe(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('log.player_seq = :playerSeq', {
        playerSeq: 1,
      });
    });

    it('should filter by date range (from and to)', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(mockPlayer);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const from = '2026-02-01T00:00:00Z';
      const to = '2026-02-28T23:59:59Z';

      await service.getPlayerLogs(1, { page: 1, limit: 20, from, to });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'log.play_started_at BETWEEN :from AND :to',
        {
          from: new Date(from),
          to: new Date(to),
        },
      );
    });

    it('should filter by date from only', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(mockPlayer);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const from = '2026-02-01T00:00:00Z';

      await service.getPlayerLogs(1, { page: 1, limit: 20, from });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('log.play_started_at >= :from', {
        from: new Date(from),
      });
    });

    it('should filter by date to only', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(mockPlayer);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const to = '2026-02-28T23:59:59Z';

      await service.getPlayerLogs(1, { page: 1, limit: 20, to });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('log.play_started_at <= :to', {
        to: new Date(to),
      });
    });

    it('should filter by status', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(mockPlayer);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getPlayerLogs(1, { page: 1, limit: 20, status: 'ERROR' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('log.play_status = :status', {
        status: 'ERROR',
      });
    });

    it('should filter by playlist_seq', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(mockPlayer);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getPlayerLogs(1, { page: 1, limit: 20, playlist_seq: 5 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('log.playlist_seq = :playlistSeq', {
        playlistSeq: 5,
      });
    });

    it('should filter by content_seq', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(mockPlayer);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getPlayerLogs(1, { page: 1, limit: 20, content_seq: 3 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('log.content_seq = :contentSeq', {
        contentSeq: 3,
      });
    });

    it('should use default pagination values', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(mockPlayer);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getPlayerLogs(1, {});

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(null);

      await expect(service.getPlayerLogs(999, { page: 1, limit: 20 })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getPlayerLogs(999, { page: 1, limit: 20 })).rejects.toThrow(
        '플레이어를 찾을 수 없습니다.',
      );
    });
  });

  describe('getContentStats', () => {
    it('should return content play statistics', async () => {
      mockContentRepo.findOne.mockResolvedValue(mockContent);

      const mockStats = {
        totalPlayCount: '100',
        completedCount: '80',
        skippedCount: '15',
        errorCount: '5',
        totalPlayTime: '30000',
        averagePlayTime: '300',
        uniquePlayers: '10',
      };

      const mockDailyStats = [
        {
          date: '2026-02-14',
          playCount: '50',
          completedCount: '40',
        },
        {
          date: '2026-02-15',
          playCount: '50',
          completedCount: '40',
        },
      ];

      mockQueryBuilder.getRawOne.mockResolvedValue(mockStats);
      mockQueryBuilder.getRawMany.mockResolvedValue(mockDailyStats);

      const result = await service.getContentStats(1, {});

      expect(result.content_seq).toBe(1);
      expect(result.content_name).toBe('Test Content');
      expect(result.total_play_count).toBe(100);
      expect(result.completed_count).toBe(80);
      expect(result.skipped_count).toBe(15);
      expect(result.error_count).toBe(5);
      expect(result.total_play_time).toBe(30000);
      expect(result.average_play_time).toBe(300);
      expect(result.unique_players).toBe(10);
      expect(result.play_by_date).toHaveLength(2);
    });

    it('should handle zero stats gracefully', async () => {
      mockContentRepo.findOne.mockResolvedValue(mockContent);

      const mockStats = {
        totalPlayCount: '0',
        completedCount: '0',
        skippedCount: '0',
        errorCount: '0',
        totalPlayTime: null,
        averagePlayTime: null,
        uniquePlayers: '0',
      };

      mockQueryBuilder.getRawOne.mockResolvedValue(mockStats);
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const result = await service.getContentStats(1, {});

      expect(result.total_play_count).toBe(0);
      expect(result.total_play_time).toBe(0);
      expect(result.average_play_time).toBe(0);
    });

    it('should filter by date range', async () => {
      mockContentRepo.findOne.mockResolvedValue(mockContent);
      mockQueryBuilder.getRawOne.mockResolvedValue({});
      mockQueryBuilder.getRawMany.mockResolvedValue([]);

      const from = '2026-02-01T00:00:00Z';
      const to = '2026-02-28T23:59:59Z';

      await service.getContentStats(1, { from, to });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'log.play_started_at BETWEEN :from AND :to',
        {
          from: new Date(from),
          to: new Date(to),
        },
      );
    });

    it('should throw NotFoundException if content not found', async () => {
      mockContentRepo.findOne.mockResolvedValue(null);

      await expect(service.getContentStats(999, {})).rejects.toThrow(NotFoundException);
      await expect(service.getContentStats(999, {})).rejects.toThrow(
        '콘텐츠를 찾을 수 없습니다.',
      );
    });
  });
});
