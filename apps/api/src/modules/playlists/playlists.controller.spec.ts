import { Test, TestingModule } from '@nestjs/testing';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';

describe('PlaylistsController', () => {
  let controller: PlaylistsController;
  let service: PlaylistsService;

  const mockPlaylistsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockPlaylist = {
    playlist_seq: 1,
    playlist_name: 'Test Playlist',
    playlist_code: 'PLAYLIST-001',
    playlist_type: 'NORMAL',
    content_count: 3,
    player_count: 2,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaylistsController],
      providers: [
        {
          provide: PlaylistsService,
          useValue: mockPlaylistsService,
        },
      ],
    }).compile();

    controller = module.get<PlaylistsController>(PlaylistsController);
    service = module.get<PlaylistsService>(PlaylistsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated playlists list', async () => {
      const mockResult = {
        items: [mockPlaylist],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      mockPlaylistsService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll({ page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(mockPlaylistsService.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });

    it('should filter by type', async () => {
      const mockResult = {
        items: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };
      mockPlaylistsService.findAll.mockResolvedValue(mockResult);

      await controller.findAll({ page: 1, limit: 20, type: 'EMERGENCY' });

      expect(mockPlaylistsService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        type: 'EMERGENCY',
      });
    });
  });

  describe('findOne', () => {
    it('should return playlist with contents', async () => {
      const mockDetailedPlaylist = {
        ...mockPlaylist,
        contents: [
          {
            content_seq: 1,
            content_name: 'Content 1',
            play_order: 1,
          },
        ],
      };
      mockPlaylistsService.findOne.mockResolvedValue(mockDetailedPlaylist);

      const result = await controller.findOne(1);

      expect(result.success).toBe(true);
      expect(result.data.playlist_seq).toBe(1);
      expect(result.data.contents).toHaveLength(1);
      expect(mockPlaylistsService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create a new playlist with content mappings', async () => {
      const createDto = {
        playlist_name: 'New Playlist',
        playlist_code: 'PLAYLIST-002',
        playlist_type: 'NORMAL' as const,
        contents: [
          {
            content_seq: 1,
            play_order: 1,
            play_duration: 30,
          },
        ],
      };
      const mockResult = {
        playlist_seq: 2,
        playlist_code: 'PLAYLIST-002',
        reg_date: new Date(),
      };
      mockPlaylistsService.create.mockResolvedValue(mockResult);

      const result = await controller.create(createDto as any);

      expect(result.success).toBe(true);
      expect(result.message).toBe('플레이리스트가 등록되었습니다.');
      expect(result.data.playlist_seq).toBe(2);
      expect(mockPlaylistsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update playlist information', async () => {
      const updateDto = {
        playlist_name: 'Updated Playlist',
        contents: [
          {
            content_seq: 2,
            play_order: 1,
            play_duration: 45,
          },
        ],
      };
      const mockResult = { playlist_seq: 1, upd_date: new Date() };
      mockPlaylistsService.update.mockResolvedValue(mockResult);

      const result = await controller.update(1, updateDto as any);

      expect(result.success).toBe(true);
      expect(result.message).toBe('플레이리스트가 수정되었습니다.');
      expect(mockPlaylistsService.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove', () => {
    it('should soft delete a playlist', async () => {
      mockPlaylistsService.remove.mockResolvedValue({ message: '플레이리스트가 삭제되었습니다.' });

      const result = await controller.remove(1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('플레이리스트가 삭제되었습니다.');
      expect(mockPlaylistsService.remove).toHaveBeenCalledWith(1);
    });
  });
});
