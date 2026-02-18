import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { TbNfcReader } from '../entities/tb-nfc-reader.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';
import {
  CreateNfcReaderDto,
  UpdateNfcReaderDto,
  NfcReaderQueryDto,
} from '../dto';

export interface NfcReaderListItem {
  no: number;
  readerSeq: number;
  readerName: string;
  readerCode: string;
  readerSerial: string | null;
  readerStatus: 'ACTIVE' | 'INACTIVE';
  spaceSeq: number;
  spaceName: string;
  buildingName: string;
  regDate: Date | null;
}

export interface NfcReaderListResponse {
  items: NfcReaderListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class NfcReaderService {
  constructor(
    @InjectRepository(TbNfcReader)
    private readonly nfcReaderRepository: Repository<TbNfcReader>,
    @InjectRepository(TbSpace)
    private readonly spaceRepository: Repository<TbSpace>,
  ) {}

  /**
   * NFC 리더기 목록 조회 (페이징, 검색, 필터)
   */
  async findAll(query: NfcReaderQueryDto): Promise<NfcReaderListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.nfcReaderRepository
      .createQueryBuilder('reader')
      .leftJoin('reader.space', 'space')
      .leftJoin('space.building', 'building')
      .where('reader.reader_isdel = :isdel', { isdel: 'N' });

    // 검색어 필터 (리더기명, 코드, 시리얼번호)
    if (query.search) {
      qb.andWhere(
        '(reader.reader_name LIKE :search OR reader.reader_code LIKE :search OR reader.reader_serial LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // 건물 필터
    if (query.buildingSeq) {
      qb.andWhere('space.building_seq = :buildingSeq', {
        buildingSeq: query.buildingSeq,
      });
    }

    // 공간 필터
    if (query.spaceSeq) {
      qb.andWhere('reader.space_seq = :spaceSeq', {
        spaceSeq: query.spaceSeq,
      });
    }

    // 상태 필터
    if (query.status) {
      qb.andWhere('reader.reader_status = :status', { status: query.status });
    }

    // 총 개수 조회
    const total = await qb.getCount();

    // 데이터 조회 (getRawMany로 조인 데이터 포함)
    const rawResults = await qb
      .select([
        'reader.reader_seq AS readerSeq',
        'reader.reader_name AS readerName',
        'reader.reader_code AS readerCode',
        'reader.reader_serial AS readerSerial',
        'reader.reader_status AS readerStatus',
        'reader.space_seq AS spaceSeq',
        'reader.reg_date AS regDate',
        'space.space_name AS spaceName',
        'building.building_name AS buildingName',
      ])
      .orderBy('reader.reg_date', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    const items: NfcReaderListItem[] = rawResults.map((row, index) => ({
      no: total - skip - index,
      readerSeq: row.readerSeq,
      readerName: row.readerName,
      readerCode: row.readerCode,
      readerSerial: row.readerSerial,
      readerStatus: row.readerStatus,
      spaceSeq: row.spaceSeq,
      spaceName: row.spaceName ?? '',
      buildingName: row.buildingName ?? '',
      regDate: row.regDate,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * NFC 리더기 상세 조회 (API Key 포함)
   */
  async findOne(readerSeq: number): Promise<TbNfcReader> {
    const reader = await this.nfcReaderRepository
      .createQueryBuilder('reader')
      .leftJoinAndSelect('reader.space', 'space')
      .leftJoinAndSelect('space.building', 'building')
      .where('reader.reader_seq = :readerSeq', { readerSeq })
      .andWhere('reader.reader_isdel = :isdel', { isdel: 'N' })
      .getOne();

    if (!reader) {
      throw new NotFoundException('해당 NFC 리더기를 찾을 수 없습니다');
    }

    return reader;
  }

  /**
   * 리더기 코드 자동 생성 (RDR-001 ~ RDR-999)
   */
  private async generateReaderCode(): Promise<string> {
    const result = await this.nfcReaderRepository
      .createQueryBuilder('reader')
      .select('MAX(reader.reader_code)', 'maxCode')
      .where("reader.reader_code LIKE 'RDR-%'")
      .andWhere('reader.reader_isdel = :isdel', { isdel: 'N' })
      .getRawOne();

    let nextNumber = 1;
    if (result?.maxCode) {
      const currentNumber = parseInt(result.maxCode.replace('RDR-', ''), 10);
      if (!isNaN(currentNumber)) {
        nextNumber = currentNumber + 1;
      }
    }

    if (nextNumber > 999) {
      throw new ConflictException(
        '리더기 코드가 최대치(RDR-999)를 초과했습니다',
      );
    }

    return `RDR-${String(nextNumber).padStart(3, '0')}`;
  }

  /**
   * 리더기 API 키 생성
   */
  private generateApiKey(): string {
    return `rdr_${randomUUID()}`;
  }

  /**
   * 공간 존재 여부 확인
   */
  private async validateSpace(spaceSeq: number): Promise<void> {
    const space = await this.spaceRepository.findOne({
      where: { spaceSeq },
    });

    if (!space || space.spaceIsdel === 'Y') {
      throw new NotFoundException('해당 공간을 찾을 수 없습니다');
    }
  }

  /**
   * NFC 리더기 생성
   */
  async create(dto: CreateNfcReaderDto): Promise<TbNfcReader> {
    // 공간 존재 확인
    await this.validateSpace(dto.spaceSeq);

    // 리더기 코드 및 API 키 자동 생성
    const readerCode = await this.generateReaderCode();
    const readerApiKey = this.generateApiKey();

    const reader = this.nfcReaderRepository.create({
      spaceSeq: dto.spaceSeq,
      readerName: dto.readerName,
      readerCode,
      readerSerial: dto.readerSerial ?? null,
      readerApiKey,
      readerStatus: 'ACTIVE',
      readerIsdel: 'N',
    });

    return this.nfcReaderRepository.save(reader);
  }

  /**
   * NFC 리더기 수정
   */
  async update(
    readerSeq: number,
    dto: UpdateNfcReaderDto,
  ): Promise<TbNfcReader> {
    const reader = await this.findOne(readerSeq);

    // 공간 변경 시 존재 확인
    if (dto.spaceSeq !== undefined) {
      await this.validateSpace(dto.spaceSeq);
      reader.spaceSeq = dto.spaceSeq;
    }

    if (dto.readerName !== undefined) {
      reader.readerName = dto.readerName;
    }

    if (dto.readerSerial !== undefined) {
      reader.readerSerial = dto.readerSerial;
    }

    if (dto.readerStatus !== undefined) {
      reader.readerStatus = dto.readerStatus;
    }

    return this.nfcReaderRepository.save(reader);
  }

  /**
   * NFC 리더기 삭제 (소프트 삭제)
   */
  async remove(readerSeq: number): Promise<void> {
    const reader = await this.findOne(readerSeq);

    await this.nfcReaderRepository.update(reader.readerSeq, {
      readerIsdel: 'Y',
    });
  }

  /**
   * 리더기 API 키 재생성
   */
  async regenerateKey(
    readerSeq: number,
  ): Promise<{ readerSeq: number; readerApiKey: string }> {
    const reader = await this.findOne(readerSeq);

    let newApiKey: string;
    let attempts = 0;
    do {
      newApiKey = this.generateApiKey();
      const existing = await this.nfcReaderRepository.findOne({
        where: { readerApiKey: newApiKey },
      });
      if (!existing) break;
      attempts++;
    } while (attempts < 3);

    if (attempts >= 3) {
      throw new ConflictException('API Key 생성 실패. 다시 시도해주세요.');
    }

    reader.readerApiKey = newApiKey;
    await this.nfcReaderRepository.save(reader);

    return {
      readerSeq: reader.readerSeq,
      readerApiKey: newApiKey,
    };
  }
}
