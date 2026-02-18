import { Test, TestingModule } from '@nestjs/testing';
import { ContentsController } from './contents.controller';
import { ContentsService } from './contents.service';

describe('ContentsController', () => {
  let controller: ContentsController;
  let service: ContentsService;

  const mockContentsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockContent = {
    content_seq: 1,
    content_name: 'Test Content',
    content_code: 'CONTENT-001',
    content_type: 'VIDEO',
    content_file_path: 'uploads/contents/test.mp4',
    content_duration: 30,
    usage_count: 2,
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.mp4',
    encoding: '7bit',
    mimetype: 'video/mp4',
    size: 1024000,
    buffer: Buffer.from('test file content'),
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentsController],
      providers: [
        {
          provide: ContentsService,
          useValue: mockContentsService,
        },
      ],
    }).compile();

    controller = module.get<ContentsController>(ContentsController);
    service = module.get<ContentsService>(ContentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated contents list', async () => {
      const mockResult = {
        items: [mockContent],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      mockContentsService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll({ page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(mockContentsService.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });

    it('should filter by content type', async () => {
      const mockResult = {
        items: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0 },
      };
      mockContentsService.findAll.mockResolvedValue(mockResult);

      await controller.findAll({ page: 1, limit: 20, type: 'IMAGE' });

      expect(mockContentsService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        type: 'IMAGE',
      });
    });
  });

  describe('findOne', () => {
    it('should return a single content', async () => {
      mockContentsService.findOne.mockResolvedValue(mockContent);

      const result = await controller.findOne(1);

      expect(result.success).toBe(true);
      expect(result.data.content_seq).toBe(1);
      expect(mockContentsService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create content with file upload', async () => {
      const createDto = {
        content_name: 'New Content',
        content_code: 'CONTENT-002',
        content_type: 'VIDEO' as const,
        content_duration: 45,
      };
      const mockResult = {
        content_seq: 2,
        content_code: 'CONTENT-002',
        content_file_path: 'uploads/contents/new_test.mp4',
        reg_date: new Date(),
      };
      mockContentsService.create.mockResolvedValue(mockResult);

      const result = await controller.create(createDto as any, mockFile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('콘텐츠가 등록되었습니다.');
      expect(result.data.content_file_path).toBeDefined();
      expect(mockContentsService.create).toHaveBeenCalledWith(createDto, mockFile);
    });

    it('should create content without file for STREAM type', async () => {
      const streamDto = {
        content_name: 'Stream Content',
        content_code: 'CONTENT-003',
        content_type: 'STREAM' as const,
        content_url: 'https://stream.example.com/video.m3u8',
      };
      const mockResult = {
        content_seq: 3,
        content_code: 'CONTENT-003',
        content_file_path: null,
        reg_date: new Date(),
      };
      mockContentsService.create.mockResolvedValue(mockResult);

      const result = await controller.create(streamDto as any, undefined);

      expect(result.success).toBe(true);
      expect(mockContentsService.create).toHaveBeenCalledWith(streamDto, undefined);
    });
  });

  describe('update', () => {
    it('should update content information', async () => {
      const updateDto = {
        content_name: 'Updated Content',
        content_duration: 60,
      };
      const mockResult = { content_seq: 1, upd_date: new Date() };
      mockContentsService.update.mockResolvedValue(mockResult);

      const result = await controller.update(1, updateDto as any, undefined);

      expect(result.success).toBe(true);
      expect(result.message).toBe('콘텐츠가 수정되었습니다.');
      expect(mockContentsService.update).toHaveBeenCalledWith(1, updateDto, undefined);
    });

    it('should update content with file replacement', async () => {
      const updateDto = {
        content_name: 'Updated Content',
      };
      const mockResult = { content_seq: 1, upd_date: new Date() };
      mockContentsService.update.mockResolvedValue(mockResult);

      const result = await controller.update(1, updateDto as any, mockFile);

      expect(result.success).toBe(true);
      expect(mockContentsService.update).toHaveBeenCalledWith(1, updateDto, mockFile);
    });
  });

  describe('remove', () => {
    it('should soft delete a content', async () => {
      mockContentsService.remove.mockResolvedValue({ message: '콘텐츠가 삭제되었습니다.' });

      const result = await controller.remove(1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('콘텐츠가 삭제되었습니다.');
      expect(mockContentsService.remove).toHaveBeenCalledWith(1);
    });
  });
});
