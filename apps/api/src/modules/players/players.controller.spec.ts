import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { PlayerApiKeyGuard } from './guards/player-api-key.guard';
import { TbPlayer } from './entities/tb-player.entity';

describe('PlayersController', () => {
  let controller: PlayersController;
  let service: PlayersService;

  const mockPlayersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    heartbeat: jest.fn(),
    findHeartbeatLogs: jest.fn(),
  };

  const mockPlayerRepository = {
    findOne: jest.fn(),
  };

  const mockPlayer = {
    player_seq: 1,
    player_name: 'Test Player',
    player_code: 'PLAYER-001',
    player_status: 'ONLINE',
    player_approval: 'APPROVED',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayersController],
      providers: [
        {
          provide: PlayersService,
          useValue: mockPlayersService,
        },
        {
          provide: getRepositoryToken(TbPlayer),
          useValue: mockPlayerRepository,
        },
        PlayerApiKeyGuard,
      ],
    })
      .overrideGuard(PlayerApiKeyGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PlayersController>(PlayersController);
    service = module.get<PlayersService>(PlayersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated players list', async () => {
      const mockResult = {
        items: [mockPlayer],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      mockPlayersService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll({ page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(mockPlayersService.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });
  });

  describe('findOne', () => {
    it('should return a single player', async () => {
      mockPlayersService.findOne.mockResolvedValue(mockPlayer);

      const result = await controller.findOne(1);

      expect(result.success).toBe(true);
      expect(result.data.player_seq).toBe(1);
      expect(mockPlayersService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create a new player', async () => {
      const createDto = {
        player_name: 'New Player',
        player_code: 'PLAYER-002',
        building_seq: 1,
        player_ip: '192.168.1.100',
      };
      const mockResult = {
        player_seq: 2,
        player_code: 'PLAYER-002',
        player_api_key: 'player_test123',
        player_approval: 'PENDING',
      };
      mockPlayersService.create.mockResolvedValue(mockResult);

      const result = await controller.create(createDto as any);

      expect(result.success).toBe(true);
      expect(result.message).toBe('플레이어가 등록되었습니다. 관리자 승인 대기 중입니다.');
      expect(result.data.player_api_key).toBeDefined();
      expect(mockPlayersService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update player information', async () => {
      const updateDto = { player_name: 'Updated Player' };
      const mockResult = { player_seq: 1, upd_date: new Date() };
      mockPlayersService.update.mockResolvedValue(mockResult);

      const result = await controller.update(1, updateDto as any);

      expect(result.success).toBe(true);
      expect(result.message).toBe('플레이어 정보가 수정되었습니다.');
      expect(mockPlayersService.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove', () => {
    it('should soft delete a player', async () => {
      mockPlayersService.remove.mockResolvedValue({ message: '플레이어가 삭제되었습니다.' });

      const result = await controller.remove(1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('플레이어가 삭제되었습니다.');
      expect(mockPlayersService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('approve', () => {
    it('should approve a player', async () => {
      const mockResult = {
        player_seq: 1,
        player_approval: 'APPROVED',
        approved_by: 1,
        approved_at: new Date(),
      };
      mockPlayersService.approve.mockResolvedValue(mockResult);
      const mockRequest = { user: { seq: 1 } };

      const result = await controller.approve(1, mockRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe('플레이어가 승인되었습니다.');
      expect(mockPlayersService.approve).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('reject', () => {
    it('should reject a player', async () => {
      const rejectDto = { reject_reason: '부적절한 등록 정보' };
      const mockResult = {
        player_seq: 1,
        player_approval: 'REJECTED',
        approved_by: 1,
        approved_at: new Date(),
        reject_reason: rejectDto.reject_reason,
      };
      mockPlayersService.reject.mockResolvedValue(mockResult);
      const mockRequest = { user: { seq: 1 } };

      const result = await controller.reject(1, rejectDto as any, mockRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe('플레이어가 반려되었습니다.');
      expect(mockPlayersService.reject).toHaveBeenCalledWith(1, rejectDto, 1);
    });
  });

  describe('heartbeat', () => {
    it('should process heartbeat from player', async () => {
      const heartbeatDto = {
        player_version: '1.0.0',
        cpu_usage: 45.5,
        memory_usage: 60.2,
        disk_usage: 30.1,
      };
      const mockPlayerEntity = { playerSeq: 1 };
      const mockReq = { player: mockPlayerEntity };
      const mockResult = {
        player_seq: 1,
        player_status: 'ONLINE',
        last_heartbeat_at: new Date(),
        should_update_playlist: false,
      };
      mockPlayersService.heartbeat.mockResolvedValue(mockResult);

      const result = await controller.heartbeat(heartbeatDto as any, mockReq, '192.168.1.100');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Heartbeat received');
      expect(result.data.player_status).toBe('ONLINE');
      expect(mockPlayersService.heartbeat).toHaveBeenCalledWith(mockPlayerEntity, heartbeatDto, '192.168.1.100');
    });
  });

  describe('findHeartbeatLogs', () => {
    it('should return heartbeat logs for a player', async () => {
      const mockLogs = {
        items: [
          {
            heartbeat_seq: 1,
            player_seq: 1,
            heartbeat_at: new Date(),
            player_ip: '192.168.1.100',
          },
        ],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      mockPlayersService.findHeartbeatLogs.mockResolvedValue(mockLogs);

      const result = await controller.findHeartbeatLogs(1, { page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(mockPlayersService.findHeartbeatLogs).toHaveBeenCalledWith(1, { page: 1, limit: 20 });
    });
  });
});
