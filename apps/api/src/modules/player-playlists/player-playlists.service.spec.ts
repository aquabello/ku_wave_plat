import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PlayerPlaylistsService } from './player-playlists.service';
import { TbPlayerPlaylist } from './entities/tb-player-playlist.entity';
import { TbGroupPlaylist } from './entities/tb-group-playlist.entity';
import { TbPlayer } from '@modules/players/entities/tb-player.entity';
import { TbPlayList } from '@modules/playlists/entities/tb-play-list.entity';
import { TbPlayerGroup } from '@modules/player-groups/entities/tb-player-group.entity';
import { TbPlayerGroupMember } from '@modules/player-groups/entities/tb-player-group-member.entity';

describe('PlayerPlaylistsService', () => {
  let service: PlayerPlaylistsService;
  let playerPlaylistRepo: Repository<TbPlayerPlaylist>;
  let groupPlaylistRepo: Repository<TbGroupPlaylist>;
  let playerRepo: Repository<TbPlayer>;
  let playlistRepo: Repository<TbPlayList>;
  let groupRepo: Repository<TbPlayerGroup>;
  let groupMemberRepo: Repository<TbPlayerGroupMember>;

  const mockPlayerPlaylistRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockGroupPlaylistRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPlayerRepo = {
    findOne: jest.fn(),
  };

  const mockPlaylistRepo = {
    findOne: jest.fn(),
  };

  const mockGroupRepo = {
    findOne: jest.fn(),
  };

  const mockGroupMemberRepo = {
    count: jest.fn(),
  };

  const mockPlayer: Partial<TbPlayer> = {
    playerSeq: 1,
    playerName: 'Test Player',
    playerIsdel: 'N',
  };

  const mockPlaylist: Partial<TbPlayList> = {
    playlistSeq: 1,
    playlistName: 'Test Playlist',
    playlistType: 'NORMAL',
    playlistIsdel: 'N',
  };

  const mockPlayerPlaylist: Partial<TbPlayerPlaylist> = {
    ppSeq: 1,
    playerSeq: 1,
    playlistSeq: 1,
    ppPriority: 10,
    scheduleStartTime: '09:00:00',
    scheduleEndTime: '18:00:00',
    scheduleDays: '1,2,3,4,5',
    ppStatus: 'ACTIVE',
    ppIsdel: 'N',
    regDate: new Date(),
    updDate: new Date(),
    playlist: mockPlaylist as any,
  };

  const mockGroup: Partial<TbPlayerGroup> = {
    groupSeq: 1,
    groupName: 'Test Group',
    groupIsdel: 'N',
  };

  const mockGroupPlaylist: Partial<TbGroupPlaylist> = {
    gpSeq: 1,
    groupSeq: 1,
    playlistSeq: 1,
    gpPriority: 10,
    scheduleStartTime: '09:00:00',
    scheduleEndTime: '18:00:00',
    scheduleDays: '1,2,3,4,5',
    gpStatus: 'ACTIVE',
    gpIsdel: 'N',
    regDate: new Date(),
    updDate: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerPlaylistsService,
        { provide: getRepositoryToken(TbPlayerPlaylist), useValue: mockPlayerPlaylistRepo },
        { provide: getRepositoryToken(TbGroupPlaylist), useValue: mockGroupPlaylistRepo },
        { provide: getRepositoryToken(TbPlayer), useValue: mockPlayerRepo },
        { provide: getRepositoryToken(TbPlayList), useValue: mockPlaylistRepo },
        { provide: getRepositoryToken(TbPlayerGroup), useValue: mockGroupRepo },
        { provide: getRepositoryToken(TbPlayerGroupMember), useValue: mockGroupMemberRepo },
      ],
    }).compile();

    service = module.get<PlayerPlaylistsService>(PlayerPlaylistsService);
    playerPlaylistRepo = module.get<Repository<TbPlayerPlaylist>>(
      getRepositoryToken(TbPlayerPlaylist),
    );
    groupPlaylistRepo = module.get<Repository<TbGroupPlaylist>>(getRepositoryToken(TbGroupPlaylist));
    playerRepo = module.get<Repository<TbPlayer>>(getRepositoryToken(TbPlayer));
    playlistRepo = module.get<Repository<TbPlayList>>(getRepositoryToken(TbPlayList));
    groupRepo = module.get<Repository<TbPlayerGroup>>(getRepositoryToken(TbPlayerGroup));
    groupMemberRepo = module.get<Repository<TbPlayerGroupMember>>(
      getRepositoryToken(TbPlayerGroupMember),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlayerPlaylists', () => {
    it('should return playlists assigned to a player', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(mockPlayer);
      mockPlayerPlaylistRepo.find.mockResolvedValue([mockPlayerPlaylist]);

      const result = await service.getPlayerPlaylists(1);

      expect(result).toHaveLength(1);
      expect(result[0].pp_seq).toBe(1);
      expect(result[0].playlist_name).toBe('Test Playlist');
      expect(mockPlayerPlaylistRepo.find).toHaveBeenCalledWith({
        where: { playerSeq: 1, ppIsdel: 'N' },
        relations: ['playlist'],
        order: { ppPriority: 'DESC', regDate: 'DESC' },
      });
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(null);

      await expect(service.getPlayerPlaylists(999)).rejects.toThrow(NotFoundException);
      await expect(service.getPlayerPlaylists(999)).rejects.toThrow('플레이어를 찾을 수 없습니다.');
    });
  });

  describe('assignPlaylistToPlayer', () => {
    const assignDto = {
      playlist_seq: 1,
      pp_priority: 10,
      schedule_start_time: '09:00:00',
      schedule_end_time: '18:00:00',
      schedule_days: '1,2,3,4,5',
      pp_status: 'ACTIVE' as const,
    };

    it('should assign playlist to player', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(mockPlayer);
      mockPlaylistRepo.findOne.mockResolvedValue(mockPlaylist);
      mockPlayerPlaylistRepo.findOne.mockResolvedValue(null); // No duplicate
      mockPlayerPlaylistRepo.create.mockReturnValue(mockPlayerPlaylist);
      mockPlayerPlaylistRepo.save.mockResolvedValue(mockPlayerPlaylist);

      const result = await service.assignPlaylistToPlayer(1, assignDto);

      expect(result.pp_seq).toBe(1);
      expect(result.reg_date).toBeDefined();
      expect(mockPlayerPlaylistRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          playerSeq: 1,
          playlistSeq: 1,
          ppPriority: 10,
          ppStatus: 'ACTIVE',
        }),
      );
    });

    it('should use default values for optional fields', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(mockPlayer);
      mockPlaylistRepo.findOne.mockResolvedValue(mockPlaylist);
      mockPlayerPlaylistRepo.findOne.mockResolvedValue(null);
      mockPlayerPlaylistRepo.create.mockReturnValue(mockPlayerPlaylist);
      mockPlayerPlaylistRepo.save.mockResolvedValue(mockPlayerPlaylist);

      await service.assignPlaylistToPlayer(1, { playlist_seq: 1 });

      expect(mockPlayerPlaylistRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ppPriority: 0,
          ppStatus: 'ACTIVE',
        }),
      );
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(null);

      await expect(service.assignPlaylistToPlayer(999, assignDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if playlist not found', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(mockPlayer);
      mockPlaylistRepo.findOne.mockResolvedValue(null);

      await expect(service.assignPlaylistToPlayer(1, assignDto)).rejects.toThrow(NotFoundException);
      await expect(service.assignPlaylistToPlayer(1, assignDto)).rejects.toThrow(
        '플레이리스트를 찾을 수 없습니다.',
      );
    });

    it('should throw BadRequestException if already assigned', async () => {
      mockPlayerRepo.findOne.mockResolvedValue(mockPlayer);
      mockPlaylistRepo.findOne.mockResolvedValue(mockPlaylist);
      mockPlayerPlaylistRepo.findOne.mockResolvedValue(mockPlayerPlaylist); // Already exists

      await expect(service.assignPlaylistToPlayer(1, assignDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.assignPlaylistToPlayer(1, assignDto)).rejects.toThrow(
        '이미 할당된 플레이리스트입니다.',
      );
    });
  });

  describe('updatePlayerPlaylist', () => {
    const updateDto = {
      pp_priority: 20,
      pp_status: 'INACTIVE' as const,
    };

    it('should update player playlist assignment', async () => {
      mockPlayerPlaylistRepo.findOne.mockResolvedValue(mockPlayerPlaylist);
      mockPlayerPlaylistRepo.save.mockResolvedValue({ ...mockPlayerPlaylist, ...updateDto });

      const result = await service.updatePlayerPlaylist(1, 1, updateDto);

      expect(result.pp_seq).toBe(1);
      expect(result.upd_date).toBeDefined();
      expect(mockPlayerPlaylistRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if assignment not found', async () => {
      mockPlayerPlaylistRepo.findOne.mockResolvedValue(null);

      await expect(service.updatePlayerPlaylist(1, 999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updatePlayerPlaylist(1, 999, updateDto)).rejects.toThrow(
        '플레이리스트 할당을 찾을 수 없습니다.',
      );
    });
  });

  describe('removePlayerPlaylist', () => {
    it('should soft delete player playlist assignment', async () => {
      const assignmentToDelete = { ...mockPlayerPlaylist };
      mockPlayerPlaylistRepo.findOne.mockResolvedValue(assignmentToDelete);
      mockPlayerPlaylistRepo.save.mockResolvedValue({ ...assignmentToDelete, ppIsdel: 'Y' });

      const result = await service.removePlayerPlaylist(1, 1);

      expect(result.message).toBe('플레이리스트 할당이 해제되었습니다.');
      expect(mockPlayerPlaylistRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ ppIsdel: 'Y' }),
      );
    });

    it('should throw NotFoundException if assignment not found', async () => {
      mockPlayerPlaylistRepo.findOne.mockResolvedValue(null);

      await expect(service.removePlayerPlaylist(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignPlaylistToGroup', () => {
    const assignDto = {
      playlist_seq: 1,
      gp_priority: 10,
      schedule_start_time: '09:00:00',
      schedule_end_time: '18:00:00',
      schedule_days: '1,2,3,4,5',
      gp_status: 'ACTIVE' as const,
    };

    it('should assign playlist to group', async () => {
      mockGroupRepo.findOne.mockResolvedValue(mockGroup);
      mockPlaylistRepo.findOne.mockResolvedValue(mockPlaylist);
      mockGroupPlaylistRepo.findOne.mockResolvedValue(null);
      mockGroupPlaylistRepo.create.mockReturnValue(mockGroupPlaylist);
      mockGroupPlaylistRepo.save.mockResolvedValue(mockGroupPlaylist);
      mockGroupMemberRepo.count.mockResolvedValue(5);

      const result = await service.assignPlaylistToGroup(1, assignDto);

      expect(result.gp_seq).toBe(1);
      expect(result.affected_players).toBe(5);
      expect(result.reg_date).toBeDefined();
    });

    it('should throw NotFoundException if group not found', async () => {
      mockGroupRepo.findOne.mockResolvedValue(null);

      await expect(service.assignPlaylistToGroup(999, assignDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.assignPlaylistToGroup(999, assignDto)).rejects.toThrow(
        '플레이어 그룹을 찾을 수 없습니다.',
      );
    });

    it('should throw BadRequestException if already assigned', async () => {
      mockGroupRepo.findOne.mockResolvedValue(mockGroup);
      mockPlaylistRepo.findOne.mockResolvedValue(mockPlaylist);
      mockGroupPlaylistRepo.findOne.mockResolvedValue(mockGroupPlaylist);

      await expect(service.assignPlaylistToGroup(1, assignDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateGroupPlaylist', () => {
    const updateDto = {
      gp_priority: 20,
      gp_status: 'INACTIVE' as const,
    };

    it('should update group playlist assignment', async () => {
      mockGroupPlaylistRepo.findOne.mockResolvedValue(mockGroupPlaylist);
      mockGroupPlaylistRepo.save.mockResolvedValue({ ...mockGroupPlaylist, ...updateDto });

      const result = await service.updateGroupPlaylist(1, 1, updateDto);

      expect(result.gp_seq).toBe(1);
      expect(result.upd_date).toBeDefined();
    });

    it('should throw NotFoundException if assignment not found', async () => {
      mockGroupPlaylistRepo.findOne.mockResolvedValue(null);

      await expect(service.updateGroupPlaylist(1, 999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateGroupPlaylist(1, 999, updateDto)).rejects.toThrow(
        '그룹 플레이리스트 할당을 찾을 수 없습니다.',
      );
    });
  });

  describe('removeGroupPlaylist', () => {
    it('should soft delete group playlist assignment', async () => {
      const assignmentToDelete = { ...mockGroupPlaylist };
      mockGroupPlaylistRepo.findOne.mockResolvedValue(assignmentToDelete);
      mockGroupPlaylistRepo.save.mockResolvedValue({ ...assignmentToDelete, gpIsdel: 'Y' });

      const result = await service.removeGroupPlaylist(1, 1);

      expect(result.message).toBe('그룹 플레이리스트 할당이 해제되었습니다.');
      expect(mockGroupPlaylistRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ gpIsdel: 'Y' }),
      );
    });

    it('should throw NotFoundException if assignment not found', async () => {
      mockGroupPlaylistRepo.findOne.mockResolvedValue(null);

      await expect(service.removeGroupPlaylist(1, 999)).rejects.toThrow(NotFoundException);
    });
  });
});
