import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { TbPlayList } from './entities/tb-play-list.entity';
import { TbPlayListContent } from './entities/tb-play-list-content.entity';
import { TbContent } from '@modules/contents/entities/tb-content.entity';

describe('PlaylistsService', () => {
  let service: PlaylistsService;
  let playlistRepository: Repository<TbPlayList>;
  let playlistContentRepository: Repository<TbPlayListContent>;
  let contentRepository: Repository<TbContent>;

  const mockQueryBuilder = {
    createQueryBuilder: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getCount: jest.fn(),
  };

  const mockPlaylistRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockPlaylistContentRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  const mockContentRepository = {
    find: jest.fn(),
  };

  const mockPlaylist: Partial<TbPlayList> = {
    playlistSeq: 1,
    playlistName: 'Test Playlist',
    playlistCode: 'PLAYLIST-001',
    playlistType: 'NORMAL',
    playlistDuration: 120,
    playlistLoop: 'Y',
    playlistDescription: 'Test Description',
    playlistIsdel: 'N',
    regDate: new Date(),
    updDate: new Date(),
  };

  const mockContent: Partial<TbContent> = {
    contentSeq: 1,
    contentName: 'Test Content',
    contentCode: 'CONTENT-001',
    contentType: 'VIDEO',
    contentDuration: 30,
    contentIsdel: 'N',
  };

  const mockPlaylistContent: Partial<TbPlayListContent> = {
    plcSeq: 1,
    playlistSeq: 1,
    contentSeq: 1,
    playOrder: 1,
    playDuration: 30,
    transitionEffect: 'FADE',
    plcIsdel: 'N',
    content: mockContent as TbContent,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaylistsService,
        { provide: getRepositoryToken(TbPlayList), useValue: mockPlaylistRepository },
        { provide: getRepositoryToken(TbPlayListContent), useValue: mockPlaylistContentRepository },
        { provide: getRepositoryToken(TbContent), useValue: mockContentRepository },
      ],
    }).compile();

    service = module.get<PlaylistsService>(PlaylistsService);
    playlistRepository = module.get<Repository<TbPlayList>>(getRepositoryToken(TbPlayList));
    playlistContentRepository = module.get<Repository<TbPlayListContent>>(
      getRepositoryToken(TbPlayListContent),
    );
    contentRepository = module.get<Repository<TbContent>>(getRepositoryToken(TbContent));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated playlists with counts', async () => {
      const mockPlaylists = [mockPlaylist];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockPlaylists, 1]);
      mockPlaylistContentRepository.count.mockResolvedValue(3);
      mockQueryBuilder.getCount.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.items[0].content_count).toBe(3);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('playlist.playlist_isdel = :isdel', {
        isdel: 'N',
      });
    });

    it('should filter by playlist type', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      mockPlaylistContentRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, type: 'EMERGENCY' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('playlist.playlist_type = :type', {
        type: 'EMERGENCY',
      });
    });

    it('should search by name or code', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      mockPlaylistContentRepository.count.mockResolvedValue(0);
      mockQueryBuilder.getCount.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, search: 'Test' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('playlist.playlist_name LIKE :search'),
        { search: '%Test%' },
      );
    });
  });

  describe('findOne', () => {
    it('should return playlist with contents', async () => {
      mockPlaylistRepository.findOne.mockResolvedValue(mockPlaylist);
      mockPlaylistContentRepository.find.mockResolvedValue([mockPlaylistContent]);

      const result = await service.findOne(1);

      expect(result.playlist_seq).toBe(1);
      expect(result.playlist_name).toBe('Test Playlist');
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].content_seq).toBe(1);
      expect(mockPlaylistContentRepository.find).toHaveBeenCalledWith({
        where: { playlistSeq: 1, plcIsdel: 'N' },
        relations: ['content'],
        order: { playOrder: 'ASC' },
      });
    });

    it('should throw NotFoundException if playlist not found', async () => {
      mockPlaylistRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('플레이리스트를 찾을 수 없습니다.');
    });
  });

  describe('create', () => {
    const createDto = {
      playlist_name: 'New Playlist',
      playlist_code: 'PLAYLIST-002',
      playlist_type: 'NORMAL' as const,
      playlist_loop: 'Y' as const,
      playlist_description: 'Test',
      contents: [
        {
          content_seq: 1,
          play_order: 1,
          play_duration: 30,
          transition_effect: 'FADE' as const,
        },
        {
          content_seq: 2,
          play_order: 2,
          play_duration: 45,
          transition_effect: 'SLIDE' as const,
        },
      ],
    };

    it('should create playlist with content mappings atomically', async () => {
      mockPlaylistRepository.findOne.mockResolvedValue(null); // No duplicates
      mockContentRepository.find.mockResolvedValue([mockContent, { ...mockContent, contentSeq: 2 }]);
      mockPlaylistRepository.create.mockReturnValue(mockPlaylist);
      mockPlaylistRepository.save.mockResolvedValue(mockPlaylist);
      mockPlaylistContentRepository.create.mockImplementation((data) => data);
      mockPlaylistContentRepository.save.mockResolvedValue([]);
      mockPlaylistRepository.update.mockResolvedValue({} as any);

      const result = await service.create(createDto);

      expect(result.playlist_seq).toBe(1);
      expect(result.playlist_code).toBe('PLAYLIST-001');
      expect(mockPlaylistContentRepository.save).toHaveBeenCalled();
      expect(mockPlaylistRepository.update).toHaveBeenCalled(); // Duration update
    });

    it('should throw ConflictException if code already exists', async () => {
      mockPlaylistRepository.findOne.mockResolvedValue(mockPlaylist);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto)).rejects.toThrow('이미 사용 중인 플레이리스트 코드입니다.');
    });

    it('should throw NotFoundException if content not found', async () => {
      mockPlaylistRepository.findOne.mockResolvedValue(null);
      mockContentRepository.find.mockResolvedValue([mockContent]); // Only 1 found instead of 2

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow(
        '존재하지 않는 콘텐츠가 포함되어 있습니다.',
      );
    });

    it('should create playlist without contents', async () => {
      const dtoWithoutContents = {
        playlist_name: 'Empty Playlist',
        playlist_code: 'PLAYLIST-003',
        playlist_type: 'NORMAL' as const,
      };
      mockPlaylistRepository.findOne.mockResolvedValue(null);
      mockPlaylistRepository.create.mockReturnValue(mockPlaylist);
      mockPlaylistRepository.save.mockResolvedValue(mockPlaylist);

      const result = await service.create(dtoWithoutContents);

      expect(result.playlist_seq).toBe(1);
      expect(mockPlaylistContentRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto = {
      playlist_name: 'Updated Playlist',
      contents: [
        {
          content_seq: 2,
          play_order: 1,
          play_duration: 60,
          transition_effect: 'NONE' as const,
        },
      ],
    };

    it('should update playlist and replace content mappings', async () => {
      mockPlaylistRepository.findOne.mockResolvedValue(mockPlaylist);
      mockContentRepository.find.mockResolvedValue([{ ...mockContent, contentSeq: 2 }]);
      mockPlaylistContentRepository.update.mockResolvedValue({} as any);
      mockPlaylistContentRepository.create.mockImplementation((data) => data);
      mockPlaylistContentRepository.save.mockResolvedValue([]);
      mockPlaylistRepository.save.mockResolvedValue({ ...mockPlaylist, ...updateDto });
      mockPlaylistRepository.update.mockResolvedValue({} as any);

      const result = await service.update(1, updateDto);

      expect(result.playlist_seq).toBe(1);
      expect(mockPlaylistContentRepository.update).toHaveBeenCalledWith(
        { playlistSeq: 1 },
        { plcIsdel: 'Y' },
      );
      expect(mockPlaylistContentRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if playlist not found', async () => {
      mockPlaylistRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should update playlist info without changing contents', async () => {
      const simpleUpdate = { playlist_name: 'Just Name Update' };
      mockPlaylistRepository.findOne.mockResolvedValue(mockPlaylist);
      mockPlaylistRepository.save.mockResolvedValue({ ...mockPlaylist, ...simpleUpdate });

      const result = await service.update(1, simpleUpdate);

      expect(result.playlist_seq).toBe(1);
      expect(mockPlaylistContentRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete a playlist', async () => {
      const playlistToDelete = { ...mockPlaylist };
      mockPlaylistRepository.findOne.mockResolvedValue(playlistToDelete);
      mockPlaylistRepository.save.mockResolvedValue({ ...playlistToDelete, playlistIsdel: 'Y' });

      const result = await service.remove(1);

      expect(result.message).toBe('플레이리스트가 삭제되었습니다.');
      expect(mockPlaylistRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ playlistIsdel: 'Y' }),
      );
    });

    it('should throw NotFoundException if playlist not found', async () => {
      mockPlaylistRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
