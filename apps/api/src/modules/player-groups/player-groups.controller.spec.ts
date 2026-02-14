import { Test, TestingModule } from '@nestjs/testing';
import { PlayerGroupsController } from './player-groups.controller';
import { PlayerGroupsService } from './player-groups.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

describe('PlayerGroupsController', () => {
  let controller: PlayerGroupsController;
  let service: PlayerGroupsService;

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addMembers: jest.fn(),
    removeMember: jest.fn(),
  };

  const mockGroup = {
    group_seq: 1,
    group_name: 'Test Group',
    group_code: 'GROUP-001',
    building_seq: 1,
    building_name: 'Test Building',
    group_description: 'Test description',
    member_count: 2,
    playlist_count: 3,
    reg_date: new Date(),
    upd_date: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayerGroupsController],
      providers: [
        {
          provide: PlayerGroupsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PlayerGroupsController>(PlayerGroupsController);
    service = module.get<PlayerGroupsService>(PlayerGroupsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated groups list', async () => {
      const mockResponse = {
        items: [mockGroup],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      mockService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(1, 20);

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(mockService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        building_seq: undefined,
        search: undefined,
      });
    });

    it('should handle query parameters', async () => {
      mockService.findAll.mockResolvedValue({ items: [], pagination: {} });

      await controller.findAll(2, 10, 1, 'test');

      expect(mockService.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        building_seq: 1,
        search: 'test',
      });
    });
  });

  describe('findOne', () => {
    it('should return a single group', async () => {
      const detailedGroup = {
        ...mockGroup,
        members: [],
        playlists: [],
      };
      mockService.findOne.mockResolvedValue(detailedGroup);

      const result = await controller.findOne(1);

      expect(result.success).toBe(true);
      expect(result.data.group_seq).toBe(1);
      expect(mockService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create a new group', async () => {
      const createDto = {
        group_name: 'New Group',
        group_code: 'GROUP-002',
        building_seq: 1,
      };
      const createdGroup = {
        group_seq: 2,
        group_code: 'GROUP-002',
        member_count: 0,
        reg_date: new Date(),
      };
      mockService.create.mockResolvedValue(createdGroup);

      const result = await controller.create(createDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('플레이어 그룹이 등록되었습니다.');
      expect(result.data.group_seq).toBe(2);
      expect(mockService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update a group', async () => {
      const updateDto = {
        group_name: 'Updated Group',
      };
      const updatedGroup = {
        group_seq: 1,
        upd_date: new Date(),
      };
      mockService.update.mockResolvedValue(updatedGroup);

      const result = await controller.update(1, updateDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('플레이어 그룹이 수정되었습니다.');
      expect(result.data.group_seq).toBe(1);
      expect(mockService.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a group', async () => {
      mockService.remove.mockResolvedValue({ message: '플레이어 그룹이 삭제되었습니다.' });

      const result = await controller.remove(1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('플레이어 그룹이 삭제되었습니다.');
      expect(mockService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('addMembers', () => {
    it('should add members to a group', async () => {
      const addMembersDto = {
        player_seqs: [1, 2, 3],
      };
      const addResult = {
        added_count: 3,
        member_count: 3,
      };
      mockService.addMembers.mockResolvedValue(addResult);

      const result = await controller.addMembers(1, addMembersDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('그룹 멤버가 추가되었습니다.');
      expect(result.data.added_count).toBe(3);
      expect(mockService.addMembers).toHaveBeenCalledWith(1, addMembersDto);
    });
  });

  describe('removeMember', () => {
    it('should remove a member from a group', async () => {
      mockService.removeMember.mockResolvedValue({ message: '그룹 멤버가 삭제되었습니다.' });

      const result = await controller.removeMember(1, 5);

      expect(result.success).toBe(true);
      expect(result.message).toBe('그룹 멤버가 삭제되었습니다.');
      expect(mockService.removeMember).toHaveBeenCalledWith(1, 5);
    });
  });
});
