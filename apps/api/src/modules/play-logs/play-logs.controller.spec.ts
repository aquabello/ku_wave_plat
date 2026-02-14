import { Test, TestingModule } from '@nestjs/testing';
import { PlayLogsController } from './play-logs.controller';
import { PlayLogsService } from './play-logs.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

describe('PlayLogsController', () => {
  let controller: PlayLogsController;
  let service: PlayLogsService;

  const mockService = {
    getPlayerLogs: jest.fn(),
    getContentStats: jest.fn(),
  };

  const mockPlayLog = {
    log_seq: '1',
    player_seq: 1,
    playlist_seq: 1,
    playlist_name: 'Test Playlist',
    content_seq: 1,
    content_name: 'Test Content',
    zone_number: 1,
    play_started_at: new Date('2026-02-14T09:00:00Z'),
    play_ended_at: new Date('2026-02-14T09:05:00Z'),
    play_duration: 300,
    play_status: 'COMPLETED',
    error_message: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayLogsController],
      providers: [
        {
          provide: PlayLogsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PlayLogsController>(PlayLogsController);
    service = module.get<PlayLogsService>(PlayLogsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlayerLogs', () => {
    it('should return play logs for a player', async () => {
      const mockResponse = {
        items: [mockPlayLog],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      mockService.getPlayerLogs.mockResolvedValue(mockResponse);

      const result = await controller.getPlayerLogs(1, 1, 20);

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(mockService.getPlayerLogs).toHaveBeenCalledWith(1, {
        page: 1,
        limit: 20,
        from: undefined,
        to: undefined,
        status: undefined,
        playlist_seq: undefined,
        content_seq: undefined,
      });
    });

    it('should handle all query parameters', async () => {
      mockService.getPlayerLogs.mockResolvedValue({ items: [], pagination: {} });

      await controller.getPlayerLogs(
        1,
        2,
        10,
        '2026-02-01T00:00:00Z',
        '2026-02-28T23:59:59Z',
        'COMPLETED',
        5,
        3,
      );

      expect(mockService.getPlayerLogs).toHaveBeenCalledWith(1, {
        page: 2,
        limit: 10,
        from: '2026-02-01T00:00:00Z',
        to: '2026-02-28T23:59:59Z',
        status: 'COMPLETED',
        playlist_seq: 5,
        content_seq: 3,
      });
    });

    it('should handle ERROR status filter', async () => {
      mockService.getPlayerLogs.mockResolvedValue({ items: [], pagination: {} });

      await controller.getPlayerLogs(1, 1, 20, undefined, undefined, 'ERROR');

      expect(mockService.getPlayerLogs).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'ERROR',
        }),
      );
    });

    it('should handle SKIPPED status filter', async () => {
      mockService.getPlayerLogs.mockResolvedValue({ items: [], pagination: {} });

      await controller.getPlayerLogs(1, 1, 20, undefined, undefined, 'SKIPPED');

      expect(mockService.getPlayerLogs).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'SKIPPED',
        }),
      );
    });
  });

  describe('getContentStats', () => {
    it('should return content play statistics', async () => {
      const mockStats = {
        content_seq: 1,
        content_name: 'Test Content',
        total_play_count: 100,
        completed_count: 80,
        skipped_count: 15,
        error_count: 5,
        total_play_time: 30000,
        average_play_time: 300,
        unique_players: 10,
        play_by_date: [
          {
            date: '2026-02-14',
            play_count: 50,
            completed_count: 40,
          },
        ],
      };
      mockService.getContentStats.mockResolvedValue(mockStats);

      const result = await controller.getContentStats(1);

      expect(result.success).toBe(true);
      expect(result.data.content_seq).toBe(1);
      expect(result.data.total_play_count).toBe(100);
      expect(result.data.play_by_date).toHaveLength(1);
      expect(mockService.getContentStats).toHaveBeenCalledWith(1, {
        from: undefined,
        to: undefined,
      });
    });

    it('should handle date range parameters', async () => {
      mockService.getContentStats.mockResolvedValue({
        content_seq: 1,
        content_name: 'Test',
        play_by_date: [],
      } as any);

      const from = '2026-02-01T00:00:00Z';
      const to = '2026-02-28T23:59:59Z';

      await controller.getContentStats(1, from, to);

      expect(mockService.getContentStats).toHaveBeenCalledWith(1, {
        from,
        to,
      });
    });
  });
});
