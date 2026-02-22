import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PlayersService } from './players.service';
import { TbPlayer } from './entities/tb-player.entity';
import { TbPlayerHeartbeatLog } from './entities/tb-player-heartbeat-log.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbPlayList } from '@modules/playlists/entities/tb-play-list.entity';

describe('PlayersService', () => {
  let service: PlayersService;
  let playerRepository: Repository<TbPlayer>;
  let heartbeatLogRepository: Repository<TbPlayerHeartbeatLog>;
  let buildingRepository: Repository<TbBuilding>;
  let spaceRepository: Repository<TbSpace>;
  let playlistRepository: Repository<TbPlayList>;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getCount: jest.fn(),
  };

  const mockPlayerRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockHeartbeatLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockBuildingRepository = {
    findOne: jest.fn(),
  };

  const mockSpaceRepository = {
    findOne: jest.fn(),
  };

  const mockPlaylistRepository = {
    findOne: jest.fn(),
  };

  const mockPlayer: Partial<TbPlayer> = {
    playerSeq: 1,
    playerName: 'Test Player',
    playerCode: 'PLAYER-001',
    playerDid: 'TEST-DID-001',
    playerMac: '00:11:22:33:44:55',
    buildingSeq: 1,
    spaceSeq: 1,
    playlistSeq: 1,
    playerIp: '192.168.1.100',
    playerPort: 9090,
    playerApiKey: 'player_' + 'a'.repeat(32),
    playerApproval: 'PENDING',
    playerStatus: 'OFFLINE',
    playerIsdel: 'N',
    regDate: new Date(),
    updDate: new Date(),
  };

  const mockBuilding: Partial<TbBuilding> = {
    buildingSeq: 1,
    buildingName: 'Test Building',
    buildingCode: 'BUILD-001',
    buildingIsdel: 'N',
  };

  const mockSpace: Partial<TbSpace> = {
    spaceSeq: 1,
    spaceName: 'Test Space',
    spaceIsdel: 'N',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        { provide: getRepositoryToken(TbPlayer), useValue: mockPlayerRepository },
        { provide: getRepositoryToken(TbPlayerHeartbeatLog), useValue: mockHeartbeatLogRepository },
        { provide: getRepositoryToken(TbBuilding), useValue: mockBuildingRepository },
        { provide: getRepositoryToken(TbSpace), useValue: mockSpaceRepository },
        { provide: getRepositoryToken(TbPlayList), useValue: mockPlaylistRepository },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
    playerRepository = module.get<Repository<TbPlayer>>(getRepositoryToken(TbPlayer));
    heartbeatLogRepository = module.get<Repository<TbPlayerHeartbeatLog>>(
      getRepositoryToken(TbPlayerHeartbeatLog),
    );
    buildingRepository = module.get<Repository<TbBuilding>>(getRepositoryToken(TbBuilding));
    spaceRepository = module.get<Repository<TbSpace>>(getRepositoryToken(TbSpace));
    playlistRepository = module.get<Repository<TbPlayList>>(getRepositoryToken(TbPlayList));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated players list', async () => {
      const mockPlayers = [mockPlayer];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockPlayers, 1]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('player.player_isdel = :isdel', { isdel: 'N' });
    });

    it('should filter by building_seq', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 20, building_seq: 1 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('player.building_seq = :buildingSeq', {
        buildingSeq: 1,
      });
    });

    it('should filter by status', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 20, status: 'ONLINE' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('player.player_status = :status', {
        status: 'ONLINE',
      });
    });

    it('should filter by approval status', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 20, approval: 'APPROVED' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('player.player_approval = :approval', {
        approval: 'APPROVED',
      });
    });

    it('should search by name or code', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 20, search: 'Test' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('player.player_name LIKE :search'),
        { search: '%Test%' },
      );
    });
  });

  describe('findOne', () => {
    it('should return a single player', async () => {
      mockPlayerRepository.findOne.mockResolvedValue(mockPlayer);

      const result = await service.findOne(1);

      expect(result.player_seq).toBe(1);
      expect(result.player_name).toBe('Test Player');
      expect(mockPlayerRepository.findOne).toHaveBeenCalledWith({
        where: { playerSeq: 1, playerIsdel: 'N' },
        relations: ['building', 'space', 'playlist', 'approver'],
      });
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPlayerRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('플레이어를 찾을 수 없습니다.');
    });
  });

  describe('create', () => {
    const createDto = {
      player_name: 'New Player',
      player_code: 'PLAYER-002',
      player_did: 'DID-002',
      player_mac: '11:22:33:44:55:66',
      building_seq: 1,
      space_seq: 1,
      player_ip: '192.168.1.101',
      player_port: 9090,
      player_resolution: '1920x1080',
      player_orientation: 'LANDSCAPE' as const,
      player_description: 'Test description',
    };

    it('should create a new player with auto-generated API key', async () => {
      mockPlayerRepository.findOne.mockResolvedValue(null); // No IP conflicts
      mockBuildingRepository.findOne.mockResolvedValue(mockBuilding);
      mockSpaceRepository.findOne.mockResolvedValue(mockSpace);
      mockPlayerRepository.create.mockReturnValue(mockPlayer);
      mockPlayerRepository.save.mockResolvedValue({
        ...mockPlayer,
        playerApproval: 'PENDING',
        playerStatus: 'OFFLINE',
      });

      const result = await service.create(createDto);

      expect(result.player_approval).toBe('PENDING');
      expect(result.player_api_key).toBeDefined();
      expect(result.player_api_key).toMatch(/^player_[a-f0-9]{32}$/);
      expect(mockPlayerRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          playerApproval: 'PENDING',
          playerStatus: 'OFFLINE',
        }),
      );
    });

    it('should throw ConflictException when IP is already active', async () => {
      const activePlayer = { ...mockPlayer, playerIsdel: 'N' };
      mockPlayerRepository.findOne.mockResolvedValueOnce(activePlayer); // Active IP exists

      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException('이미 사용 중인 IP 주소입니다.')
      );
    });

    it('should re-activate deleted player with same IP', async () => {
      const deletedPlayer: Partial<TbPlayer> = {
        playerSeq: 10,
        playerName: 'Old Player',
        playerCode: 'PLAYER-OLD',
        playerIp: '192.168.1.101',
        playerIsdel: 'Y',
        playerApproval: 'APPROVED',
        approvedBy: 5,
        approvedAt: new Date('2025-01-01'),
        rejectReason: null,
      };

      mockPlayerRepository.findOne
        .mockResolvedValueOnce(null) // No active player with IP
        .mockResolvedValueOnce(deletedPlayer) // Deleted player found
        .mockResolvedValueOnce(null) // Code check passes
        .mockResolvedValueOnce(null); // DID check passes

      mockBuildingRepository.findOne.mockResolvedValue(mockBuilding);
      mockSpaceRepository.findOne.mockResolvedValue(mockSpace);

      const reactivatedPlayer = {
        ...deletedPlayer,
        playerName: createDto.player_name,
        playerCode: createDto.player_code,
        playerDid: createDto.player_did,
        playerMac: createDto.player_mac,
        buildingSeq: createDto.building_seq,
        spaceSeq: createDto.space_seq,
        playerResolution: createDto.player_resolution,
        playerOrientation: createDto.player_orientation,
        playerDescription: createDto.player_description,
        playerApproval: 'PENDING',
        playerStatus: 'OFFLINE',
        playerIsdel: 'N',
        approvedBy: null,
        approvedAt: null,
        rejectReason: null,
        playerApiKey: 'player_' + 'b'.repeat(32),
      };

      mockPlayerRepository.save.mockResolvedValue(reactivatedPlayer as TbPlayer);

      const result = await service.create(createDto);

      expect(result.player_seq).toBe(10); // Same playerSeq as deleted player
      expect(result.player_approval).toBe('PENDING');
      expect(result.player_api_key).toBeDefined();
      expect(result.message).toBe('삭제된 플레이어가 재등록되었습니다.');
      expect(mockPlayerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          playerSeq: 10,
          playerIsdel: 'N',
          playerApproval: 'PENDING',
          playerStatus: 'OFFLINE',
          approvedBy: null,
          approvedAt: null,
          rejectReason: null,
        }),
      );
    });

    it('should create new player when no deleted player with same IP', async () => {
      mockPlayerRepository.findOne
        .mockResolvedValueOnce(null) // No active player
        .mockResolvedValueOnce(null) // No deleted player
        .mockResolvedValueOnce(null) // Code check passes
        .mockResolvedValueOnce(null); // DID check passes

      mockBuildingRepository.findOne.mockResolvedValue(mockBuilding);
      mockSpaceRepository.findOne.mockResolvedValue(mockSpace);
      mockPlayerRepository.create.mockReturnValue(mockPlayer);
      mockPlayerRepository.save.mockResolvedValue({
        ...mockPlayer,
        playerApproval: 'PENDING',
        playerStatus: 'OFFLINE',
      });

      const result = await service.create(createDto);

      expect(result.player_approval).toBe('PENDING');
      expect(result.message).toBeUndefined(); // No re-activation message
      expect(mockPlayerRepository.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if building not found', async () => {
      mockPlayerRepository.findOne
        .mockResolvedValueOnce(null) // No active player
        .mockResolvedValueOnce(null); // No deleted player
      mockBuildingRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('존재하지 않는 건물입니다.');
    });

    it('should throw NotFoundException if space not found', async () => {
      mockPlayerRepository.findOne
        .mockResolvedValueOnce(null) // No active player
        .mockResolvedValueOnce(null); // No deleted player
      mockBuildingRepository.findOne.mockResolvedValue(mockBuilding);
      mockSpaceRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow('존재하지 않는 공간입니다.');
    });

    it('should throw ConflictException if player code already exists', async () => {
      mockPlayerRepository.findOne
        .mockResolvedValueOnce(null) // No active player
        .mockResolvedValueOnce(null) // No deleted player
        .mockResolvedValueOnce(mockPlayer); // Code already exists
      mockBuildingRepository.findOne.mockResolvedValue(mockBuilding);
      mockSpaceRepository.findOne.mockResolvedValue(mockSpace);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if device ID already exists', async () => {
      mockPlayerRepository.findOne
        .mockResolvedValueOnce(null) // No active player
        .mockResolvedValueOnce(null) // No deleted player
        .mockResolvedValueOnce(null) // Code check passes
        .mockResolvedValueOnce(mockPlayer); // DID check fails
      mockBuildingRepository.findOne.mockResolvedValue(mockBuilding);
      mockSpaceRepository.findOne.mockResolvedValue(mockSpace);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const updateDto = {
      player_name: 'Updated Player',
      player_ip: '192.168.1.102',
    };

    it('should update player information', async () => {
      mockPlayerRepository.findOne.mockResolvedValue(mockPlayer);
      mockPlayerRepository.save.mockResolvedValue({ ...mockPlayer, ...updateDto });

      const result = await service.update(1, updateDto);

      expect(result.player_seq).toBe(1);
      expect(mockPlayerRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPlayerRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should validate building if provided', async () => {
      mockPlayerRepository.findOne.mockResolvedValue(mockPlayer);
      mockBuildingRepository.findOne.mockResolvedValue(null);

      await expect(service.update(1, { building_seq: 999 })).rejects.toThrow(NotFoundException);
      await expect(service.update(1, { building_seq: 999 })).rejects.toThrow('존재하지 않는 건물입니다.');
    });

    it('should validate space if provided', async () => {
      mockPlayerRepository.findOne.mockResolvedValue(mockPlayer);
      mockBuildingRepository.findOne.mockResolvedValue(mockBuilding);
      mockSpaceRepository.findOne.mockResolvedValue(null);

      await expect(service.update(1, { building_seq: 1, space_seq: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a player', async () => {
      const playerToDelete = { ...mockPlayer };
      mockPlayerRepository.findOne.mockResolvedValue(playerToDelete);
      mockPlayerRepository.save.mockResolvedValue({ ...playerToDelete, playerIsdel: 'Y' });

      const result = await service.remove(1);

      expect(result.message).toBe('플레이어가 삭제되었습니다.');
      expect(mockPlayerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ playerIsdel: 'Y' }),
      );
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPlayerRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('should approve a pending player', async () => {
      const pendingPlayer = { ...mockPlayer, playerApproval: 'PENDING' };
      mockPlayerRepository.findOne.mockResolvedValue(pendingPlayer);
      mockPlayerRepository.save.mockResolvedValue({
        ...pendingPlayer,
        playerApproval: 'APPROVED',
        approvedBy: 1,
        approvedAt: new Date(),
      });

      const result = await service.approve(1, 1);

      expect(result.player_approval).toBe('APPROVED');
      expect(result.approved_by).toBe(1);
      expect(result.approved_at).toBeDefined();
      expect(mockPlayerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          playerApproval: 'APPROVED',
          approvedBy: 1,
          rejectReason: null,
        }),
      );
    });

    it('should throw BadRequestException if already approved', async () => {
      const approvedPlayer = { ...mockPlayer, playerApproval: 'APPROVED' };
      mockPlayerRepository.findOne.mockResolvedValue(approvedPlayer);

      await expect(service.approve(1, 1)).rejects.toThrow(BadRequestException);
      await expect(service.approve(1, 1)).rejects.toThrow('이미 승인된 플레이어입니다.');
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPlayerRepository.findOne.mockResolvedValue(null);

      await expect(service.approve(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('reject', () => {
    const rejectDto = {
      reject_reason: '부적절한 등록 정보',
    };

    it('should reject a player with reason', async () => {
      mockPlayerRepository.findOne.mockResolvedValue(mockPlayer);
      mockPlayerRepository.save.mockResolvedValue({
        ...mockPlayer,
        playerApproval: 'REJECTED',
        approvedBy: 1,
        approvedAt: new Date(),
        rejectReason: rejectDto.reject_reason,
      });

      const result = await service.reject(1, rejectDto, 1);

      expect(result.player_approval).toBe('REJECTED');
      expect(result.reject_reason).toBe(rejectDto.reject_reason);
      expect(mockPlayerRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          playerApproval: 'REJECTED',
          rejectReason: rejectDto.reject_reason,
        }),
      );
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPlayerRepository.findOne.mockResolvedValue(null);

      await expect(service.reject(999, rejectDto, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('heartbeat', () => {
    const heartbeatDto = {
      player_version: '1.0.0',
      cpu_usage: 45.5,
      memory_usage: 60.2,
      disk_usage: 30.1,
      current_playlist: 1,
      current_content: 'CONTENT-001',
    };

    it('should record heartbeat and update player status to ONLINE', async () => {
      mockHeartbeatLogRepository.create.mockReturnValue({});
      mockHeartbeatLogRepository.save.mockResolvedValue({});
      mockPlayerRepository.save.mockResolvedValue({
        ...mockPlayer,
        playerStatus: 'ONLINE',
        lastHeartbeatAt: new Date(),
      });
      mockPlayerRepository.findOne.mockResolvedValue(null);
      mockPlaylistRepository.findOne.mockResolvedValue(null);

      const result = await service.heartbeat(mockPlayer as TbPlayer, heartbeatDto, '192.168.1.100');

      expect(result.player_status).toBe('ONLINE');
      expect(result.last_heartbeat_at).toBeDefined();
      expect(mockHeartbeatLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          playerSeq: 1,
          playerIp: '192.168.1.100',
          playerVersion: '1.0.0',
        }),
      );
    });

    it('should set status to ERROR if error_message provided', async () => {
      const errorHeartbeat = { ...heartbeatDto, error_message: 'Connection failed' };
      mockHeartbeatLogRepository.create.mockReturnValue({});
      mockHeartbeatLogRepository.save.mockResolvedValue({});
      mockPlayerRepository.save.mockResolvedValue({
        ...mockPlayer,
        playerStatus: 'ERROR',
      });
      mockPlayerRepository.findOne.mockResolvedValue(null);
      mockPlaylistRepository.findOne.mockResolvedValue(null);

      const result = await service.heartbeat(mockPlayer as TbPlayer, errorHeartbeat, '192.168.1.100');

      expect(result.player_status).toBe('ERROR');
    });
  });

  describe('findHeartbeatLogs', () => {
    it('should return paginated heartbeat logs', async () => {
      mockPlayerRepository.findOne.mockResolvedValue(mockPlayer);
      const mockLogs = [
        {
          heartbeatSeq: 1,
          playerSeq: 1,
          heartbeatAt: new Date(),
          playerIp: '192.168.1.100',
          playerVersion: '1.0.0',
          cpuUsage: 45.5,
          memoryUsage: 60.2,
          diskUsage: 30.1,
        },
      ];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockLogs, 1]);

      const result = await service.findHeartbeatLogs(1, { page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('log.player_seq = :playerSeq', {
        playerSeq: 1,
      });
    });

    it('should filter by date range', async () => {
      mockPlayerRepository.findOne.mockResolvedValue(mockPlayer);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const from = '2024-01-01';
      const to = '2024-12-31';

      await service.findHeartbeatLogs(1, { page: 1, limit: 20, from, to });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('log.heartbeat_at >= :from', { from });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('log.heartbeat_at <= :to', { to });
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPlayerRepository.findOne.mockResolvedValue(null);

      await expect(service.findHeartbeatLogs(999, { page: 1, limit: 20 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
