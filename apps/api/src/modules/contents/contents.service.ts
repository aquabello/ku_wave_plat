import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbContent } from './entities/tb-content.entity';
import { TbPlayListContent } from '@modules/playlists/entities/tb-play-list-content.entity';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ListContentsDto } from './dto/list-contents.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class ContentsService {
  private readonly uploadDir = 'uploads/contents';

  constructor(
    @InjectRepository(TbContent)
    private readonly contentRepository: Repository<TbContent>,
    @InjectRepository(TbPlayListContent)
    private readonly playlistContentRepository: Repository<TbPlayListContent>,
  ) {
    // 업로드 디렉토리 생성
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async findAll(query: ListContentsDto) {
    const { page = 1, limit = 20, type, search } = query;

    const queryBuilder = this.contentRepository
      .createQueryBuilder('content')
      .leftJoin('content.playlistContents', 'plc', 'plc.plc_isdel = :isdel', { isdel: 'N' })
      .where('content.content_isdel = :isdel', { isdel: 'N' });

    if (type) {
      queryBuilder.andWhere('content.content_type = :type', { type });
    }

    if (search) {
      queryBuilder.andWhere(
        '(content.content_name LIKE :search OR content.content_code LIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('content.contentOrder', 'ASC');

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: await Promise.all(
        items.map(async (content) => {
          const usageCount = await this.playlistContentRepository.count({
            where: { contentSeq: content.contentSeq, plcIsdel: 'N' },
          });

          return {
            content_seq: content.contentSeq,
            content_name: content.contentName,
            content_code: content.contentCode,
            content_type: content.contentType,
            content_file_path: content.contentFilePath,
            content_url: content.contentUrl,
            content_duration: content.contentDuration,
            content_width: content.contentWidth,
            content_height: content.contentHeight,
            content_size: content.contentSize,
            content_mime_type: content.contentMimeType,
            content_thumbnail: content.contentThumbnail,
            content_description: content.contentDescription,
            usage_count: usageCount,
            reg_date: content.regDate,
            upd_date: content.updDate,
          };
        }),
      ),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(contentSeq: number) {
    const content = await this.contentRepository.findOne({
      where: { contentSeq, contentIsdel: 'N' },
    });

    if (!content) {
      throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');
    }

    return {
      content_seq: content.contentSeq,
      content_name: content.contentName,
      content_code: content.contentCode,
      content_type: content.contentType,
      content_file_path: content.contentFilePath,
      content_url: content.contentUrl,
      content_duration: content.contentDuration,
      content_width: content.contentWidth,
      content_height: content.contentHeight,
      content_size: content.contentSize,
      content_mime_type: content.contentMimeType,
      content_thumbnail: content.contentThumbnail,
      content_description: content.contentDescription,
      content_order: content.contentOrder,
      content_isdel: content.contentIsdel,
      reg_date: content.regDate,
      upd_date: content.updDate,
    };
  }

  private generateContentCode(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CONTENT-${timestamp}-${random}`;
  }

  async create(createContentDto: CreateContentDto, file?: Express.Multer.File) {
    // 콘텐츠 코드 자동 생성 (미입력 시)
    const contentCode = createContentDto.content_code || this.generateContentCode();

    // 콘텐츠 코드 중복 확인
    const existing = await this.contentRepository.findOne({
      where: { contentCode },
    });

    if (existing) {
      throw new ConflictException('이미 사용 중인 콘텐츠 코드입니다.');
    }

    // 파일 필요 여부 확인
    if (['VIDEO', 'IMAGE', 'HTML'].includes(createContentDto.content_type) && !file) {
      throw new BadRequestException('파일이 필요합니다.');
    }

    if (createContentDto.content_type === 'STREAM' && !createContentDto.content_url) {
      throw new BadRequestException('STREAM 타입은 content_url이 필요합니다.');
    }

    let filePath: string | null = null;
    let fileSize: number | null = null;
    let mimeType: string | null = null;

    // 파일 저장
    if (file) {
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.originalname}`;
      filePath = path.join(this.uploadDir, filename);

      await fs.writeFile(filePath, file.buffer);

      fileSize = file.size;
      mimeType = file.mimetype;
    }

    // 콘텐츠 생성
    const content = this.contentRepository.create({
      contentName: createContentDto.content_name,
      contentCode: contentCode,
      contentType: createContentDto.content_type,
      contentFilePath: filePath,
      contentUrl: createContentDto.content_url,
      contentDuration: createContentDto.content_duration,
      contentSize: fileSize,
      contentMimeType: mimeType,
      contentDescription: createContentDto.content_description,
    });

    const savedContent = await this.contentRepository.save(content);

    return {
      content_seq: savedContent.contentSeq,
      content_code: savedContent.contentCode,
      content_file_path: savedContent.contentFilePath,
      content_thumbnail: savedContent.contentThumbnail,
      reg_date: savedContent.regDate,
    };
  }

  async update(contentSeq: number, updateContentDto: UpdateContentDto, file?: Express.Multer.File) {
    const content = await this.contentRepository.findOne({
      where: { contentSeq, contentIsdel: 'N' },
    });

    if (!content) {
      throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');
    }

    // 파일 교체
    if (file) {
      // 기존 파일 삭제
      if (content.contentFilePath) {
        try {
          await fs.unlink(content.contentFilePath);
        } catch (error) {
          // 파일이 없어도 무시
        }
      }

      // 새 파일 저장
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.originalname}`;
      const filePath = path.join(this.uploadDir, filename);

      await fs.writeFile(filePath, file.buffer);

      content.contentFilePath = filePath;
      content.contentSize = file.size;
      content.contentMimeType = file.mimetype;
    }

    // 콘텐츠 정보 업데이트
    Object.assign(content, {
      contentName: updateContentDto.content_name ?? content.contentName,
      contentType: updateContentDto.content_type ?? content.contentType,
      contentUrl: updateContentDto.content_url ?? content.contentUrl,
      contentDuration: updateContentDto.content_duration ?? content.contentDuration,
      contentDescription: updateContentDto.content_description ?? content.contentDescription,
      contentOrder: updateContentDto.content_order ?? content.contentOrder,
    });

    const savedContent = await this.contentRepository.save(content);

    return {
      content_seq: savedContent.contentSeq,
      upd_date: savedContent.updDate,
    };
  }

  async remove(contentSeq: number) {
    const content = await this.contentRepository.findOne({
      where: { contentSeq, contentIsdel: 'N' },
    });

    if (!content) {
      throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');
    }

    content.contentIsdel = 'Y';
    await this.contentRepository.save(content);

    return { message: '콘텐츠가 삭제되었습니다.' };
  }
}
