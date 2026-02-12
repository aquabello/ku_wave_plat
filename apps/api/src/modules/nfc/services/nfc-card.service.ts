import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbNfcCard } from '../entities/tb-nfc-card.entity';
import { TbNfcLog } from '../entities/tb-nfc-log.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { TbUserBuilding } from '@modules/permissions/entities/tb-user-building.entity';
import {
  CreateNfcCardDto,
  UpdateNfcCardDto,
  NfcCardQueryDto,
  NfcUnregisteredQueryDto,
} from '../dto';

export interface NfcCardListItem {
  no: number;
  cardSeq: number;
  tuSeq: number;
  userName: string;
  cardIdentifier: string;
  cardAid: string | null;
  cardLabel: string | null;
  cardType: 'CARD' | 'PHONE';
  cardStatus: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  lastTaggedAt: Date | null;
  regDate: Date | null;
}

export interface NfcCardListResponse {
  items: NfcCardListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NfcCardDetail extends TbNfcCard {
  tagCount: number;
}

export interface NfcUnregisteredItem {
  tagIdentifier: string;
  tagAid: string | null;
  firstTaggedAt: Date;
  lastTaggedAt: Date;
  tagCount: number;
  lastReaderName: string | null;
  lastSpaceName: string | null;
}

export interface NfcUnregisteredListResponse {
  items: NfcUnregisteredItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class NfcCardService {
  constructor(
    @InjectRepository(TbNfcCard)
    private readonly nfcCardRepository: Repository<TbNfcCard>,
    @InjectRepository(TbNfcLog)
    private readonly nfcLogRepository: Repository<TbNfcLog>,
    @InjectRepository(TbUser)
    private readonly userRepository: Repository<TbUser>,
    @InjectRepository(TbUserBuilding)
    private readonly userBuildingRepository: Repository<TbUserBuilding>,
  ) {}

  /**
   * NFC 카드 목록 조회 (페이징, 검색, 필터)
   */
  async findAll(query: NfcCardQueryDto): Promise<NfcCardListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.nfcCardRepository
      .createQueryBuilder('card')
      .leftJoin('card.user', 'user')
      .where('card.card_isdel = :isdel', { isdel: 'N' });

    // 검색어 필터 (카드 식별값, 라벨, 사용자명)
    if (query.search) {
      qb.andWhere(
        '(card.card_identifier LIKE :search OR card.card_label LIKE :search OR user.name LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // 카드 유형 필터
    if (query.type) {
      qb.andWhere('card.card_type = :type', { type: query.type });
    }

    // 카드 상태 필터
    if (query.status) {
      qb.andWhere('card.card_status = :status', { status: query.status });
    }

    // AID 필터
    if (query.aid) {
      qb.andWhere('card.card_aid LIKE :aid', { aid: `%${query.aid}%` });
    }

    // 총 개수 조회
    const total = await qb.getCount();

    // 데이터 조회 (getRawMany로 조인 데이터 포함)
    const cards = await qb
      .select([
        'card.card_seq AS cardSeq',
        'card.tu_seq AS tuSeq',
        'card.card_identifier AS cardIdentifier',
        'card.card_aid AS cardAid',
        'card.card_label AS cardLabel',
        'card.card_type AS cardType',
        'card.card_status AS cardStatus',
        'card.reg_date AS regDate',
        'user.tu_name AS userName',
      ])
      .orderBy('card.reg_date', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    // 각 카드의 마지막 태그 시각 조회
    const cardSeqs = cards.map((c) => c.cardSeq);
    const lastTaggedData: Array<{ cardSeq: number; lastTaggedAt: Date }> = [];

    if (cardSeqs.length > 0) {
      const rawLastTagged = await this.nfcLogRepository
        .createQueryBuilder('log')
        .select('log.card_seq', 'cardSeq')
        .addSelect('MAX(log.tagged_at)', 'lastTaggedAt')
        .where('log.card_seq IN (:...cardSeqs)', { cardSeqs })
        .groupBy('log.card_seq')
        .getRawMany();

      lastTaggedData.push(
        ...rawLastTagged.map((row) => ({
          cardSeq: row.cardSeq,
          lastTaggedAt: row.lastTaggedAt,
        })),
      );
    }

    const items: NfcCardListItem[] = cards.map((row, index) => {
      const lastTagged = lastTaggedData.find((d) => d.cardSeq === row.cardSeq);

      return {
        no: total - skip - index,
        cardSeq: row.cardSeq,
        tuSeq: row.tuSeq,
        userName: row.userName ?? '',
        cardIdentifier: row.cardIdentifier,
        cardAid: row.cardAid,
        cardLabel: row.cardLabel,
        cardType: row.cardType,
        cardStatus: row.cardStatus,
        lastTaggedAt: lastTagged?.lastTaggedAt ?? null,
        regDate: row.regDate,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * NFC 카드 상세 조회
   */
  async findOne(cardSeq: number): Promise<NfcCardDetail> {
    const card = await this.nfcCardRepository
      .createQueryBuilder('card')
      .leftJoinAndSelect('card.user', 'user')
      .where('card.card_seq = :cardSeq', { cardSeq })
      .andWhere('card.card_isdel = :isdel', { isdel: 'N' })
      .getOne();

    if (!card) {
      throw new NotFoundException('해당 NFC 카드를 찾을 수 없습니다');
    }

    // 태그 횟수 조회
    const tagCount = await this.nfcLogRepository.count({
      where: { cardSeq },
    });

    return {
      ...card,
      tagCount,
    };
  }

  /**
   * 카드 식별자 중복 확인
   */
  private async checkCardIdentifierExists(
    cardIdentifier: string,
  ): Promise<boolean> {
    const exists = await this.nfcCardRepository.findOne({
      where: { cardIdentifier },
    });

    return exists !== null && exists.cardIsdel !== 'Y';
  }

  /**
   * 사용자 존재 여부 확인
   */
  private async validateUser(tuSeq: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { seq: tuSeq },
    });

    if (!user || user.isDel === 'Y') {
      throw new NotFoundException('해당 사용자를 찾을 수 없습니다');
    }
  }

  /**
   * NFC 카드 생성 (승인 워크플로우 포함)
   */
  async create(dto: CreateNfcCardDto): Promise<TbNfcCard> {
    // 카드 식별자 중복 확인
    const exists = await this.checkCardIdentifierExists(dto.cardIdentifier);
    if (exists) {
      throw new ConflictException('이미 등록된 카드 식별자입니다');
    }

    // 사용자 존재 확인
    await this.validateUser(dto.tuSeq);

    // 카드 생성
    const card = this.nfcCardRepository.create({
      tuSeq: dto.tuSeq,
      cardIdentifier: dto.cardIdentifier,
      cardAid: dto.cardAid ?? null,
      cardLabel: dto.cardLabel ?? null,
      cardType: dto.cardType ?? 'CARD',
      cardStatus: 'ACTIVE',
      cardIsdel: 'N',
    });

    const savedCard = await this.nfcCardRepository.save(card);

    // 건물 권한 부여 (buildingSeqs 제공 시)
    if (dto.buildingSeqs && dto.buildingSeqs.length > 0) {
      // 기존 권한 조회
      const existingBuildings = await this.userBuildingRepository.find({
        where: {
          tuSeq: dto.tuSeq,
        },
        select: ['buildingSeq'],
      });

      const existingBuildingSeqs = existingBuildings.map(
        (ub) => ub.buildingSeq,
      );

      // 새로 추가할 건물만 필터링
      const newBuildingSeqs = dto.buildingSeqs.filter(
        (buildingSeq) => !existingBuildingSeqs.includes(buildingSeq),
      );

      // 새 권한 추가
      if (newBuildingSeqs.length > 0) {
        const userBuildings = newBuildingSeqs.map((buildingSeq) =>
          this.userBuildingRepository.create({
            tuSeq: dto.tuSeq,
            buildingSeq,
          }),
        );

        await this.userBuildingRepository.save(userBuildings);
      }
    }

    return savedCard;
  }

  /**
   * NFC 카드 수정
   */
  async update(cardSeq: number, dto: UpdateNfcCardDto): Promise<TbNfcCard> {
    const card = await this.findOne(cardSeq);

    // 사용자 변경 시 존재 확인
    if (dto.tuSeq !== undefined) {
      await this.validateUser(dto.tuSeq);
      card.tuSeq = dto.tuSeq;
    }

    if (dto.cardAid !== undefined) {
      card.cardAid = dto.cardAid;
    }

    if (dto.cardLabel !== undefined) {
      card.cardLabel = dto.cardLabel;
    }

    if (dto.cardType !== undefined) {
      card.cardType = dto.cardType;
    }

    if (dto.cardStatus !== undefined) {
      card.cardStatus = dto.cardStatus;
    }

    return this.nfcCardRepository.save(card);
  }

  /**
   * NFC 카드 삭제 (소프트 삭제)
   */
  async remove(cardSeq: number): Promise<void> {
    const card = await this.findOne(cardSeq);

    await this.nfcCardRepository.update(card.cardSeq, {
      cardIsdel: 'Y',
    });
  }

  /**
   * 미등록 태그 목록 조회
   */
  async findUnregistered(
    query: NfcUnregisteredQueryDto,
  ): Promise<NfcUnregisteredListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    // 등록된 카드 식별자 조회
    const registeredIdentifiers = await this.nfcCardRepository
      .createQueryBuilder('card')
      .select('card.card_identifier')
      .where('card.card_isdel = :isdel', { isdel: 'N' })
      .getRawMany();

    const registeredSet = new Set(
      registeredIdentifiers.map((r) => r.card_identifier),
    );

    // card_seq가 NULL인 로그 중 등록되지 않은 태그만 조회
    const qb = this.nfcLogRepository
      .createQueryBuilder('log')
      .select('log.tag_identifier', 'tagIdentifier')
      .addSelect('MAX(log.tag_aid)', 'tagAid')
      .addSelect('MIN(log.tagged_at)', 'firstTaggedAt')
      .addSelect('MAX(log.tagged_at)', 'lastTaggedAt')
      .addSelect('COUNT(*)', 'tagCount')
      .where('log.card_seq IS NULL');

    // 등록된 식별자 제외
    if (registeredSet.size > 0) {
      qb.andWhere('log.tag_identifier NOT IN (:...registered)', {
        registered: Array.from(registeredSet),
      });
    }

    qb.groupBy('log.tag_identifier');

    // 총 개수 조회
    const countQuery = qb.clone();
    const countResult = await countQuery.getRawMany();
    const total = countResult.length;

    // 데이터 조회
    const rawData = await qb
      .orderBy('MAX(log.tagged_at)', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    // 각 태그의 마지막 리더기명 및 공간명 조회 (Batch query로 N+1 문제 해결)
    const tagIdentifiers = rawData.map((row) => row.tagIdentifier);

    // Batch fetch last log for all unregistered tags
    const lastLogMap = new Map<
      string,
      { readerName: string | null; spaceName: string | null }
    >();

    if (tagIdentifiers.length > 0) {
      // Get the latest log for each tag_identifier using a subquery
      const lastLogs = await this.nfcLogRepository
        .createQueryBuilder('log')
        .leftJoin('log.reader', 'reader')
        .leftJoin('log.space', 'space')
        .select([
          'log.tag_identifier AS tagIdentifier',
          'reader.reader_name AS readerName',
          'space.space_name AS spaceName',
          'log.tagged_at AS taggedAt',
        ])
        .where('log.tag_identifier IN (:...tagIdentifiers)', { tagIdentifiers })
        .andWhere('log.card_seq IS NULL')
        .orderBy('log.tagged_at', 'DESC')
        .getRawMany();

      // Keep only the first (latest) entry per tagIdentifier
      for (const row of lastLogs) {
        if (!lastLogMap.has(row.tagIdentifier)) {
          lastLogMap.set(row.tagIdentifier, {
            readerName: row.readerName ?? null,
            spaceName: row.spaceName ?? null,
          });
        }
      }
    }

    const items: NfcUnregisteredItem[] = rawData.map((row) => {
      const lastLogInfo = lastLogMap.get(row.tagIdentifier);
      return {
        tagIdentifier: row.tagIdentifier,
        tagAid: row.tagAid,
        firstTaggedAt: row.firstTaggedAt,
        lastTaggedAt: row.lastTaggedAt,
        tagCount: parseInt(row.tagCount, 10),
        lastReaderName: lastLogInfo?.readerName ?? null,
        lastSpaceName: lastLogInfo?.spaceName ?? null,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * AID로 카드 + 최근 태깅 로그 통합 조회
   */
  async lookupByAid(aid: string) {
    // 1. AID로 등록된 카드 검색
    const cards = await this.nfcCardRepository
      .createQueryBuilder('card')
      .leftJoinAndSelect('card.user', 'user')
      .where('card.card_aid LIKE :aid', { aid: `%${aid}%` })
      .andWhere('card.card_isdel = :isdel', { isdel: 'N' })
      .getMany();

    const registeredCards = cards.map((card) => ({
      cardSeq: card.cardSeq,
      tuSeq: card.tuSeq,
      userName: card.user?.name ?? null,
      cardIdentifier: card.cardIdentifier,
      cardAid: card.cardAid,
      cardLabel: card.cardLabel,
      cardType: card.cardType,
      cardStatus: card.cardStatus,
      regDate: card.regDate,
    }));

    // 2. AID로 최근 태깅 로그 검색 (최근 20건)
    const recentLogs = await this.nfcLogRepository
      .createQueryBuilder('log')
      .leftJoin('log.reader', 'reader')
      .leftJoin('log.space', 'space')
      .select([
        'log.nfcLogSeq AS nfcLogSeq',
        'log.log_type AS logType',
        'log.tag_identifier AS tagIdentifier',
        'log.tag_aid AS tagAid',
        'log.control_result AS controlResult',
        'log.tagged_at AS taggedAt',
        'reader.reader_name AS readerName',
        'space.space_name AS spaceName',
      ])
      .where('log.tag_aid LIKE :aid', { aid: `%${aid}%` })
      .orderBy('log.tagged_at', 'DESC')
      .limit(20)
      .getRawMany();

    return {
      isRegistered: registeredCards.length > 0,
      cardCount: registeredCards.length,
      cards: registeredCards,
      recentLogs: recentLogs.map((log) => ({
        nfcLogSeq: log.nfcLogSeq,
        logType: log.logType,
        tagIdentifier: log.tagIdentifier,
        tagAid: log.tagAid,
        controlResult: log.controlResult ?? null,
        taggedAt: log.taggedAt,
        readerName: log.readerName ?? null,
        spaceName: log.spaceName ?? null,
      })),
      logCount: recentLogs.length,
    };
  }
}
