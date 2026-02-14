import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PlayerGroupsService } from './player-groups.service';
import { TbPlayerGroup } from './entities/tb-player-group.entity';
import { TbPlayerGroupMember } from './entities/tb-player-group-member.entity';
import { TbPlayer } from '@modules/players/entities/tb-player.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';

describe('PlayerGroupsService', () => {
  let service: PlayerGroupsService;
  let playerGroupRepo: Repository<TbPlayerGroup>;
  let memberRepo: Repository<TbPlayerGroupMember>;
  let playerRepo: Repository<TbPlayer>;
  let buildingRepo: Repository<TbBuilding>;

  const mockQueryBuilder = {
    createQueryBuilder: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockPlayerGroupRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockMemberRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPlayerRepo = {
    find: jest.fn(),
  };

  const mockBuildingRepo = {
    findOne: jest.fn(),
  };

  const mockGroup: Partial<TbPlayerGroup> = {
    groupSeq: 1,
    groupName: 'Test Group',
    groupCode: 'GROUP-001',
    buildingSeq: 1,
    groupDescription: 'Test description',
    groupOrder: 0,
    groupIsdel: 'N',
    regDate: new Date(),
    updDate: new Date(),
    building: {
      buildingSeq: 1,
      buildingName: 'Test Building',
    } as any,
    members: [],
    playlists: [],
  };

  const mockBuilding: Partial<TbBuilding> = {
    buildingSeq: 1,
    buildingName: 'Test Building',
    buildingCode: 'BUILD-001',
    buildingIsdel: 'N',
  };

  const mockPlayer: Partial<TbPlayer> = {
    playerSeq: 1,
    playerName: 'Test Player',
    playerCode: 'PLAYER-001',
    playerIsdel: 'N',
  };

  const mockMember: Partial<TbPlayerGroupMember> = {
    pgmSeq: 1,
    groupSeq: 1,
    playerSeq: 1,
    pgmIsdel: 'N',
    regDate: new Date(),
    player: mockPlayer as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerGroupsService,
        { provide: getRepositoryToken(TbPlayerGroup), useValue: mockPlayerGroupRepo },
        { provide: getRepositoryToken(TbPlayerGroupMember), useValue: mockMemberRepo },
        { provide: getRepositoryToken(TbPlayer), useValue: mockPlayerRepo },
        { provide: getRepositoryToken(TbBuilding), useValue: mockBuildingRepo },
      ],
    }).compile();

    service = module.get<PlayerGroupsService>(PlayerGroupsService);
    playerGroupRepo = module.get<Repository<TbPlayerGroup>>(getRepositoryToken(TbPlayerGroup));
    memberRepo = module.get<Repository<TbPlayerGroupMember>>(getRepositoryToken(TbPlayerGroupMember));
    playerRepo = module.get<Repository<TbPlayer>>(getRepositoryToken(TbPlayer));
    buildingRepo = module.get<Repository<TbBuilding>>(getRepositoryToken(TbBuilding));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated groups list', async () => {
      const mockGroups = [
        {
          ...mockGroup,
          memberCount: '2',
          playlistCount: '3',
        },
      ];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockGroups, 1]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].group_seq).toBe(1);
      expect(result.items[0].member_count).toBe(2);
      expect(result.items[0].playlist_count).toBe(3);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('g.group_isdel = :isdel', { isdel: 'N' });
    });

    it('should filter by building_seq', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 20, building_seq: 1 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('g.building_seq = :buildingSeq', {
        buildingSeq: 1,
      });
    });

    it('should search by name or code', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 20, search: 'Test' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(g.group_name LIKE :search OR g.group_code LIKE :search)',
        { search: '%Test%' },
      );
    });

    it('should use default pagination values', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({});

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });
  });

  describe('findOne', () => {
    it('should return a single group with members and playlists', async () => {
      const groupWithRelations = {
        ...mockGroup,
        members: [{ ...mockMember, pgmIsdel: 'N' }],
        playlists: [
          {
            gpSeq: 1,
            playlistSeq: 1,
            gpPriority: 10,
            gpIsdel: 'N',
            playlist: { playlistName: 'Test Playlist' },
          },
        ],
      };
      mockPlayerGroupRepo.findOne.mockResolvedValue(groupWithRelations);

      const result = await service.findOne(1);

      expect(result.group_seq).toBe(1);
      expect(result.group_name).toBe('Test Group');
      expect(result.members).toHaveLength(1);
      expect(result.playlists).toHaveLength(1);
      expect(mockPlayerGroupRepo.findOne).toHaveBeenCalledWith({
        where: { groupSeq: 1, groupIsdel: 'N' },
        relations: ['building', 'members', 'members.player', 'playlists', 'playlists.playlist'],
      });
    });

    it('should filter out deleted members', async () => {
      const groupWithDeletedMember = {
        ...mockGroup,
        members: [
          { ...mockMember, pgmIsdel: 'N' },
          { ...mockMember, pgmSeq: 2, pgmIsdel: 'Y' },
        ],
        playlists: [],
      };
      mockPlayerGroupRepo.findOne.mockResolvedValue(groupWithDeletedMember);

      const result = await service.findOne(1);

      expect(result.members).toHaveLength(1);
    });

    it('should filter out deleted playlists', async () => {
      const groupWithDeletedPlaylist = {
        ...mockGroup,
        members: [],
        playlists: [
          { gpSeq: 1, gpIsdel: 'N', playlist: { playlistName: 'Active' } },
          { gpSeq: 2, gpIsdel: 'Y', playlist: { playlistName: 'Deleted' } },
        ],
      };
      mockPlayerGroupRepo.findOne.mockResolvedValue(groupWithDeletedPlaylist);

      const result = await service.findOne(1);

      expect(result.playlists).toHaveLength(1);
    });

    it('should throw NotFoundException if group not found', async () => {
      mockPlayerGroupRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('플레이어 그룹을 찾을 수 없습니다.');
    });
  });

  describe('create', () => {
    const createDto = {
      group_name: 'New Group',
      group_code: 'GROUP-002',
      building_seq: 1,
      group_description: 'New group description',
      member_player_seqs: [1, 2],
    };

    it('should create a new group without initial members', async () => {
      mockBuildingRepo.findOne.mockResolvedValue(mockBuilding);
      mockPlayerGroupRepo.findOne.mockResolvedValue(null); // No duplicate code
      mockPlayerGroupRepo.create.mockReturnValue(mockGroup);
      mockPlayerGroupRepo.save.mockResolvedValue(mockGroup);

      const result = await service.create({
        group_name: 'New Group',
        group_code: 'GROUP-002',
      });

      expect(result.group_seq).toBe(1);
      expect(result.group_code).toBe('GROUP-001');
      expect(result.member_count).toBe(0);
      expect(mockPlayerGroupRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          groupName: 'New Group',
          groupCode: 'GROUP-002',
        }),
      );
    });

    it('should create a group with initial members', async () => {
      mockBuildingRepo.findOne.mockResolvedValue(mockBuilding);
      mockPlayerGroupRepo.findOne
        .mockResolvedValueOnce(null) // First call: check duplicate code
        .mockResolvedValueOnce(mockGroup); // Second call: addMembers needs the group
      mockPlayerGroupRepo.create.mockReturnValue(mockGroup);
      mockPlayerGroupRepo.save.mockResolvedValue(mockGroup);

      // Mock addMembers
      mockPlayerRepo.find.mockResolvedValue([mockPlayer, { ...mockPlayer, playerSeq: 2 }]);
      mockMemberRepo.find.mockResolvedValue([]);
      mockMemberRepo.create.mockImplementation((data) => data);
      mockMemberRepo.save.mockResolvedValue([]);

      const result = await service.create(createDto);

      expect(result.member_count).toBe(2);
    });

    it('should throw NotFoundException if building not found', async () => {
      mockBuildingRepo.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('존재하지 않는 건물입니다.');
    });

    it('should throw BadRequestException if group code already exists', async () => {
      mockBuildingRepo.findOne.mockResolvedValue(mockBuilding);
      mockPlayerGroupRepo.findOne.mockResolvedValue(mockGroup); // Code exists

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow('이미 사용 중인 그룹 코드입니다.');
    });

    it('should handle null building_seq', async () => {
      mockPlayerGroupRepo.findOne.mockResolvedValue(null);
      mockPlayerGroupRepo.create.mockReturnValue(mockGroup);
      mockPlayerGroupRepo.save.mockResolvedValue(mockGroup);

      await service.create({
        group_name: 'New Group',
        group_code: 'GROUP-002',
      });

      expect(mockPlayerGroupRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          buildingSeq: null,
        }),
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      group_name: 'Updated Group',
      group_description: 'Updated description',
    };

    it('should update group information', async () => {
      mockPlayerGroupRepo.findOne.mockResolvedValue(mockGroup);
      mockPlayerGroupRepo.save.mockResolvedValue({ ...mockGroup, ...updateDto });

      const result = await service.update(1, updateDto);

      expect(result.group_seq).toBe(1);
      expect(mockPlayerGroupRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if group not found', async () => {
      mockPlayerGroupRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should validate building if provided', async () => {
      mockPlayerGroupRepo.findOne.mockResolvedValue(mockGroup);
      mockBuildingRepo.findOne.mockResolvedValue(null);

      await expect(service.update(1, { building_seq: 999 })).rejects.toThrow(NotFoundException);
      await expect(service.update(1, { building_seq: 999 })).rejects.toThrow(
        '존재하지 않는 건물입니다.',
      );
    });

    it('should update group_order', async () => {
      mockPlayerGroupRepo.findOne.mockResolvedValue(mockGroup);
      mockPlayerGroupRepo.save.mockResolvedValue(mockGroup);

      await service.update(1, { group_order: 10 });

      expect(mockPlayerGroupRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          groupOrder: 10,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a group', async () => {
      const groupToDelete = { ...mockGroup };
      mockPlayerGroupRepo.findOne.mockResolvedValue(groupToDelete);
      mockPlayerGroupRepo.save.mockResolvedValue({ ...groupToDelete, groupIsdel: 'Y' });

      const result = await service.remove(1);

      expect(result.message).toBe('플레이어 그룹이 삭제되었습니다.');
      expect(mockPlayerGroupRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ groupIsdel: 'Y' }),
      );
    });

    it('should throw NotFoundException if group not found', async () => {
      mockPlayerGroupRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('addMembers', () => {
    const addMembersDto = {
      player_seqs: [1, 2],
    };

    it('should add new members to group', async () => {
      mockPlayerGroupRepo.findOne.mockResolvedValue(mockGroup);
      mockPlayerRepo.find.mockResolvedValue([mockPlayer, { ...mockPlayer, playerSeq: 2 }]);
      mockMemberRepo.find.mockResolvedValue([]);
      mockMemberRepo.create.mockImplementation((data) => data);
      mockMemberRepo.save.mockResolvedValue([]);

      const result = await service.addMembers(1, addMembersDto);

      expect(result.added_count).toBe(2);
      expect(result.member_count).toBe(2);
      expect(mockMemberRepo.save).toHaveBeenCalled();
    });

    it('should skip already added members', async () => {
      mockPlayerGroupRepo.findOne.mockResolvedValue(mockGroup);
      mockPlayerRepo.find.mockResolvedValue([mockPlayer, { ...mockPlayer, playerSeq: 2 }]);
      mockMemberRepo.find.mockResolvedValue([mockMember]); // Player 1 already exists
      mockMemberRepo.create.mockImplementation((data) => data);
      mockMemberRepo.save.mockResolvedValue([]);

      const result = await service.addMembers(1, addMembersDto);

      expect(result.added_count).toBe(1); // Only player 2 added
      expect(result.member_count).toBe(2); // Total 2 members
    });

    it('should throw NotFoundException if group not found', async () => {
      mockPlayerGroupRepo.findOne.mockResolvedValue(null);

      await expect(service.addMembers(999, addMembersDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if some players not found', async () => {
      mockPlayerGroupRepo.findOne.mockResolvedValue(mockGroup);
      mockPlayerRepo.find.mockResolvedValue([mockPlayer]); // Only 1 player found, not 2

      await expect(service.addMembers(1, addMembersDto)).rejects.toThrow(BadRequestException);
      await expect(service.addMembers(1, addMembersDto)).rejects.toThrow(
        '일부 플레이어를 찾을 수 없습니다.',
      );
    });

    it('should throw BadRequestException if all players already added', async () => {
      mockPlayerGroupRepo.findOne.mockResolvedValue(mockGroup);
      mockPlayerRepo.find.mockResolvedValue([mockPlayer, { ...mockPlayer, playerSeq: 2 }]);
      mockMemberRepo.find.mockResolvedValue([
        mockMember,
        { ...mockMember, pgmSeq: 2, playerSeq: 2 },
      ]);

      await expect(service.addMembers(1, addMembersDto)).rejects.toThrow(BadRequestException);
      await expect(service.addMembers(1, addMembersDto)).rejects.toThrow(
        '모든 플레이어가 이미 그룹에 속해 있습니다.',
      );
    });
  });

  describe('removeMember', () => {
    it('should soft delete a member', async () => {
      const memberToDelete = { ...mockMember };
      mockMemberRepo.findOne.mockResolvedValue(memberToDelete);
      mockMemberRepo.save.mockResolvedValue({ ...memberToDelete, pgmIsdel: 'Y' });

      const result = await service.removeMember(1, 1);

      expect(result.message).toBe('그룹 멤버가 삭제되었습니다.');
      expect(mockMemberRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ pgmIsdel: 'Y' }),
      );
    });

    it('should throw NotFoundException if member not found', async () => {
      mockMemberRepo.findOne.mockResolvedValue(null);

      await expect(service.removeMember(1, 999)).rejects.toThrow(NotFoundException);
      await expect(service.removeMember(1, 999)).rejects.toThrow('그룹 멤버를 찾을 수 없습니다.');
    });
  });
});
