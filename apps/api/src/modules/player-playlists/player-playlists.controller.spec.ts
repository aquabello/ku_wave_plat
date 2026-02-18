import { Test, TestingModule } from '@nestjs/testing';
import { PlayerPlaylistsController } from './player-playlists.controller';
import { PlayerPlaylistsService } from './player-playlists.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

describe('PlayerPlaylistsController', () => {
  let controller: PlayerPlaylistsController;
  let service: PlayerPlaylistsService;

  const mockService = {
    getPlayerPlaylists: jest.fn(),
    assignPlaylistToPlayer: jest.fn(),
    updatePlayerPlaylist: jest.fn(),
    removePlayerPlaylist: jest.fn(),
    assignPlaylistToGroup: jest.fn(),
    updateGroupPlaylist: jest.fn(),
    removeGroupPlaylist: jest.fn(),
  };

  const mockPlayerPlaylist = {
    pp_seq: 1,
    playlist_seq: 1,
    playlist_name: 'Test Playlist',
    playlist_type: 'NORMAL',
    pp_priority: 10,
    schedule_start_time: '09:00:00',
    schedule_end_time: '18:00:00',
    schedule_days: '1,2,3,4,5',
    pp_status: 'ACTIVE',
    reg_date: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayerPlaylistsController],
      providers: [
        {
          provide: PlayerPlaylistsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PlayerPlaylistsController>(PlayerPlaylistsController);
    service = module.get<PlayerPlaylistsService>(PlayerPlaylistsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlayerPlaylists', () => {
    it('should return player playlists', async () => {
      mockService.getPlayerPlaylists.mockResolvedValue([mockPlayerPlaylist]);

      const result = await controller.getPlayerPlaylists(1);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(mockService.getPlayerPlaylists).toHaveBeenCalledWith(1);
    });
  });

  describe('assignPlaylistToPlayer', () => {
    it('should assign playlist to player', async () => {
      const assignDto = {
        playlist_seq: 1,
        pp_priority: 10,
      };
      const assignResult = {
        pp_seq: 1,
        reg_date: new Date(),
      };
      mockService.assignPlaylistToPlayer.mockResolvedValue(assignResult);

      const result = await controller.assignPlaylistToPlayer(1, assignDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('플레이리스트가 할당되었습니다.');
      expect(result.data.pp_seq).toBe(1);
      expect(mockService.assignPlaylistToPlayer).toHaveBeenCalledWith(1, assignDto);
    });
  });

  describe('updatePlayerPlaylist', () => {
    it('should update player playlist assignment', async () => {
      const updateDto = {
        pp_priority: 20,
      };
      const updateResult = {
        pp_seq: 1,
        upd_date: new Date(),
      };
      mockService.updatePlayerPlaylist.mockResolvedValue(updateResult);

      const result = await controller.updatePlayerPlaylist(1, 1, updateDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('플레이리스트 할당이 수정되었습니다.');
      expect(mockService.updatePlayerPlaylist).toHaveBeenCalledWith(1, 1, updateDto);
    });
  });

  describe('removePlayerPlaylist', () => {
    it('should remove player playlist assignment', async () => {
      mockService.removePlayerPlaylist.mockResolvedValue({
        message: '플레이리스트 할당이 해제되었습니다.',
      });

      const result = await controller.removePlayerPlaylist(1, 1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('플레이리스트 할당이 해제되었습니다.');
      expect(mockService.removePlayerPlaylist).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('assignPlaylistToGroup', () => {
    it('should assign playlist to group', async () => {
      const assignDto = {
        playlist_seq: 1,
        gp_priority: 10,
      };
      const assignResult = {
        gp_seq: 1,
        affected_players: 5,
        reg_date: new Date(),
      };
      mockService.assignPlaylistToGroup.mockResolvedValue(assignResult);

      const result = await controller.assignPlaylistToGroup(1, assignDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('그룹에 플레이리스트가 할당되었습니다.');
      expect(result.data.gp_seq).toBe(1);
      expect(result.data.affected_players).toBe(5);
      expect(mockService.assignPlaylistToGroup).toHaveBeenCalledWith(1, assignDto);
    });
  });

  describe('updateGroupPlaylist', () => {
    it('should update group playlist assignment', async () => {
      const updateDto = {
        gp_priority: 20,
      };
      const updateResult = {
        gp_seq: 1,
        upd_date: new Date(),
      };
      mockService.updateGroupPlaylist.mockResolvedValue(updateResult);

      const result = await controller.updateGroupPlaylist(1, 1, updateDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('그룹 플레이리스트 할당이 수정되었습니다.');
      expect(mockService.updateGroupPlaylist).toHaveBeenCalledWith(1, 1, updateDto);
    });
  });

  describe('removeGroupPlaylist', () => {
    it('should remove group playlist assignment', async () => {
      mockService.removeGroupPlaylist.mockResolvedValue({
        message: '그룹 플레이리스트 할당이 해제되었습니다.',
      });

      const result = await controller.removeGroupPlaylist(1, 1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('그룹 플레이리스트 할당이 해제되었습니다.');
      expect(mockService.removeGroupPlaylist).toHaveBeenCalledWith(1, 1);
    });
  });
});
