import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ContentsService } from './contents.service';
import { TbContent } from './entities/tb-content.entity';
import { TbPlayListContent } from '@modules/playlists/entities/tb-play-list-content.entity';

describe('ContentsService', () => {
  let service: ContentsService;
  let contentRepository: Repository<TbContent>;
  let playlistContentRepository: Repository<TbPlayListContent>;

  const mockQueryBuilder = {
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockContentRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockPlaylistContentRepository = {
    count: jest.fn(),
  };

  const mockContent: Partial<TbContent> = {
    contentSeq: 1,
    contentName: 'Test Content',
    contentCode: 'CONTENT-001',
    contentType: 'VIDEO',
    contentFilePath: 'uploads/contents/test.mp4',
    contentDuration: 30,
    contentSize: 1024000,
    contentMimeType: 'video/mp4',
    contentIsdel: 'N',
    regDate: new Date(),
    updDate: new Date(),
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
      providers: [
        ContentsService,
        { provide: getRepositoryToken(TbContent), useValue: mockContentRepository },
        { provide: getRepositoryToken(TbPlayListContent), useValue: mockPlaylistContentRepository },
      ],
    }).compile();

    service = module.get<ContentsService>(ContentsService);
    contentRepository = module.get<Repository<TbContent>>(getRepositoryToken(TbContent));
    playlistContentRepository = module.get<Repository<TbPlayListContent>>(
      getRepositoryToken(TbPlayListContent),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated contents list with usage count', async () => {
      const mockContents = [mockContent];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockContents, 1]);
      mockPlaylistContentRepository.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].usage_count).toBe(2);
      expect(result.pagination.total).toBe(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('content.content_isdel = :isdel', {
        isdel: 'N',
      });
    });

    it('should filter by content type', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      mockPlaylistContentRepository.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, type: 'IMAGE' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('content.content_type = :type', {
        type: 'IMAGE',
      });
    });

    it('should search by name or code', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      mockPlaylistContentRepository.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20, search: 'Test' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('content.content_name LIKE :search'),
        { search: '%Test%' },
      );
    });
  });

  describe('findOne', () => {
    it('should return a single content', async () => {
      mockContentRepository.findOne.mockResolvedValue(mockContent);

      const result = await service.findOne(1);

      expect(result.content_seq).toBe(1);
      expect(result.content_name).toBe('Test Content');
      expect(mockContentRepository.findOne).toHaveBeenCalledWith({
        where: { contentSeq: 1, contentIsdel: 'N' },
      });
    });

    it('should throw NotFoundException if content not found', async () => {
      mockContentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('콘텐츠를 찾을 수 없습니다.');
    });
  });

  describe('create', () => {
    const createDto = {
      content_name: 'New Content',
      content_code: 'CONTENT-002',
      content_type: 'VIDEO' as const,
      content_duration: 45,
      content_description: 'Test description',
    };

    it('should create content with file upload', async () => {
      mockContentRepository.findOne.mockResolvedValue(null); // No duplicates
      mockContentRepository.create.mockReturnValue(mockContent);
      mockContentRepository.save.mockResolvedValue(mockContent);

      const result = await service.create(createDto, mockFile);

      expect(result.content_seq).toBe(1);
      expect(result.content_file_path).toBeDefined();
      expect(mockContentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          contentName: createDto.content_name,
          contentCode: createDto.content_code,
          contentType: createDto.content_type,
          contentSize: mockFile.size,
          contentMimeType: mockFile.mimetype,
        }),
      );
    });

    it('should throw ConflictException if code already exists', async () => {
      mockContentRepository.findOne.mockResolvedValue(mockContent);

      await expect(service.create(createDto, mockFile)).rejects.toThrow(ConflictException);
      await expect(service.create(createDto, mockFile)).rejects.toThrow(
        '이미 사용 중인 콘텐츠 코드입니다.',
      );
    });

    it('should throw BadRequestException if VIDEO type without file', async () => {
      mockContentRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow('파일이 필요합니다.');
    });

    it('should throw BadRequestException if STREAM type without URL', async () => {
      const streamDto = {
        content_name: 'Stream Content',
        content_code: 'CONTENT-003',
        content_type: 'STREAM' as const,
      };
      mockContentRepository.findOne.mockResolvedValue(null);

      await expect(service.create(streamDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(streamDto)).rejects.toThrow('STREAM 타입은 content_url이 필요합니다.');
    });

    it('should create STREAM content without file', async () => {
      const streamDto = {
        content_name: 'Stream Content',
        content_code: 'CONTENT-003',
        content_type: 'STREAM' as const,
        content_url: 'https://stream.example.com/video.m3u8',
      };
      mockContentRepository.findOne.mockResolvedValue(null);
      mockContentRepository.create.mockReturnValue({
        ...mockContent,
        contentType: 'STREAM',
        contentUrl: streamDto.content_url,
      });
      mockContentRepository.save.mockResolvedValue({
        ...mockContent,
        contentType: 'STREAM',
        contentUrl: streamDto.content_url,
      });

      const result = await service.create(streamDto);

      expect(result.content_seq).toBe(1);
      expect(mockContentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'STREAM',
          contentUrl: streamDto.content_url,
        }),
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      content_name: 'Updated Content',
      content_duration: 60,
    };

    it('should update content information', async () => {
      mockContentRepository.findOne.mockResolvedValue(mockContent);
      mockContentRepository.save.mockResolvedValue({ ...mockContent, ...updateDto });

      const result = await service.update(1, updateDto);

      expect(result.content_seq).toBe(1);
      expect(mockContentRepository.save).toHaveBeenCalled();
    });

    it('should replace file if provided', async () => {
      const contentWithFile = { ...mockContent };
      mockContentRepository.findOne.mockResolvedValue(contentWithFile);
      mockContentRepository.save.mockResolvedValue({
        ...contentWithFile,
        contentFilePath: 'uploads/contents/new_test.mp4',
      });

      const result = await service.update(1, updateDto, mockFile);

      expect(result.content_seq).toBe(1);
      expect(mockContentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          contentSize: mockFile.size,
          contentMimeType: mockFile.mimetype,
        }),
      );
    });

    it('should throw NotFoundException if content not found', async () => {
      mockContentRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a content', async () => {
      const contentToDelete = { ...mockContent };
      mockContentRepository.findOne.mockResolvedValue(contentToDelete);
      mockContentRepository.save.mockResolvedValue({ ...contentToDelete, contentIsdel: 'Y' });

      const result = await service.remove(1);

      expect(result.message).toBe('콘텐츠가 삭제되었습니다.');
      expect(mockContentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ contentIsdel: 'Y' }),
      );
    });

    it('should throw NotFoundException if content not found', async () => {
      mockContentRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
