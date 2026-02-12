import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbNfcLog } from '../entities/tb-nfc-log.entity';
import { TbNfcReader } from '../entities/tb-nfc-reader.entity';
import { TbNfcCard } from '../entities/tb-nfc-card.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { NfcLogQueryDto } from '../dto';

interface NfcControlDetailItem {
  spaceDeviceSeq: number;
  deviceName: string;
  commandType: string;
  resultStatus: string;
  resultMessage: string;
}

interface NfcControlSummary {
  totalDevices: number;
  successCount: number;
  failCount: number;
}

@Injectable()
export class NfcLogService {
  constructor(
    @InjectRepository(TbNfcLog)
    private readonly nfcLogRepository: Repository<TbNfcLog>,
    @InjectRepository(TbNfcReader)
    private readonly nfcReaderRepository: Repository<TbNfcReader>,
    @InjectRepository(TbNfcCard)
    private readonly nfcCardRepository: Repository<TbNfcCard>,
    @InjectRepository(TbSpace)
    private readonly spaceRepository: Repository<TbSpace>,
    @InjectRepository(TbBuilding)
    private readonly buildingRepository: Repository<TbBuilding>,
    @InjectRepository(TbUser)
    private readonly userRepository: Repository<TbUser>,
  ) {}

  /**
   * Parse controlDetail JSON string and generate summary
   */
  private parseControlSummary(controlDetail: string | null): NfcControlSummary | null {
    if (!controlDetail) {
      return null;
    }

    try {
      const details: NfcControlDetailItem[] = JSON.parse(controlDetail);
      const totalDevices = details.length;
      const successCount = details.filter(
        (d) => d.resultStatus === 'SUCCESS',
      ).length;
      const failCount = totalDevices - successCount;

      return {
        totalDevices,
        successCount,
        failCount,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Parse controlDetail JSON string into array
   */
  private parseControlDetails(controlDetail: string | null): NfcControlDetailItem[] {
    if (!controlDetail) {
      return [];
    }

    try {
      return JSON.parse(controlDetail);
    } catch (error) {
      return [];
    }
  }

  /**
   * Find all NFC logs with pagination and filters
   */
  async findAll(query: NfcLogQueryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Build query with filters
    const queryBuilder = this.nfcLogRepository
      .createQueryBuilder('nl')
      .leftJoin('tb_nfc_reader', 'r', 'nl.reader_seq = r.reader_seq')
      .leftJoin('tb_space', 's', 'nl.space_seq = s.space_seq')
      .leftJoin('tb_building', 'b', 's.building_seq = b.building_seq')
      .leftJoin('tb_nfc_card', 'c', 'nl.card_seq = c.card_seq')
      .leftJoin('tb_users', 'u', 'nl.tu_seq = u.tu_seq')
      .select([
        'nl.nfc_log_seq AS nfcLogSeq',
        'r.reader_name AS readerName',
        'r.reader_code AS readerCode',
        's.space_name AS spaceName',
        'b.building_name AS buildingName',
        'u.tu_name AS userName',
        'c.card_label AS cardLabel',
        'nl.log_type AS logType',
        'nl.tag_identifier AS tagIdentifier',
        'nl.control_result AS controlResult',
        'nl.control_detail AS controlDetail',
        'nl.tagged_at AS taggedAt',
      ]);

    // Apply filters
    if (query.buildingSeq) {
      queryBuilder.andWhere('b.building_seq = :buildingSeq', {
        buildingSeq: query.buildingSeq,
      });
    }

    if (query.spaceSeq) {
      queryBuilder.andWhere('nl.space_seq = :spaceSeq', {
        spaceSeq: query.spaceSeq,
      });
    }

    if (query.readerSeq) {
      queryBuilder.andWhere('nl.reader_seq = :readerSeq', {
        readerSeq: query.readerSeq,
      });
    }

    if (query.logType) {
      queryBuilder.andWhere('nl.log_type = :logType', {
        logType: query.logType,
      });
    }

    if (query.controlResult) {
      queryBuilder.andWhere('nl.control_result = :controlResult', {
        controlResult: query.controlResult,
      });
    }

    if (query.startDate) {
      queryBuilder.andWhere('nl.tagged_at >= :startDate', {
        startDate: `${query.startDate} 00:00:00`,
      });
    }

    if (query.endDate) {
      queryBuilder.andWhere('nl.tagged_at <= :endDate', {
        endDate: `${query.endDate} 23:59:59`,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(nl.tag_identifier LIKE :search OR u.tu_name LIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }

    if (query.aid) {
      queryBuilder.andWhere('nl.tag_aid LIKE :aid', {
        aid: `%${query.aid}%`,
      });
    }

    // Order by tagged_at DESC
    queryBuilder.orderBy('nl.tagged_at', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const rawResults = await queryBuilder.getRawMany();

    // Transform results with no field and controlSummary
    const items = rawResults.map((row, index) => ({
      no: total - skip - index,
      nfcLogSeq: row.nfcLogSeq,
      readerName: row.readerName || '',
      readerCode: row.readerCode || '',
      spaceName: row.spaceName || '',
      buildingName: row.buildingName || '',
      userName: row.userName || null,
      cardLabel: row.cardLabel || null,
      logType: row.logType,
      tagIdentifier: row.tagIdentifier,
      controlResult: row.controlResult || null,
      controlSummary: this.parseControlSummary(row.controlDetail),
      taggedAt: row.taggedAt,
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Find one NFC log by nfcLogSeq with detailed information
   */
  async findOne(nfcLogSeq: number) {
    const queryBuilder = this.nfcLogRepository
      .createQueryBuilder('nl')
      .leftJoin('tb_nfc_reader', 'r', 'nl.reader_seq = r.reader_seq')
      .leftJoin('tb_space', 's', 'nl.space_seq = s.space_seq')
      .leftJoin('tb_building', 'b', 's.building_seq = b.building_seq')
      .leftJoin('tb_nfc_card', 'c', 'nl.card_seq = c.card_seq')
      .leftJoin('tb_users', 'u', 'nl.tu_seq = u.tu_seq')
      .select([
        'nl.nfc_log_seq AS nfcLogSeq',
        'nl.reader_seq AS readerSeq',
        'r.reader_name AS readerName',
        'r.reader_code AS readerCode',
        'nl.space_seq AS spaceSeq',
        's.space_name AS spaceName',
        'b.building_name AS buildingName',
        'nl.card_seq AS cardSeq',
        'u.tu_name AS userName',
        'c.card_label AS cardLabel',
        'c.card_type AS cardType',
        'nl.log_type AS logType',
        'nl.tag_identifier AS tagIdentifier',
        'nl.tag_aid AS tagAid',
        'nl.control_result AS controlResult',
        'nl.control_detail AS controlDetail',
        'nl.tagged_at AS taggedAt',
      ])
      .where('nl.nfc_log_seq = :nfcLogSeq', { nfcLogSeq });

    const result = await queryBuilder.getRawOne();

    if (!result) {
      throw new NotFoundException(
        `NFC log with ID ${nfcLogSeq} not found`,
      );
    }

    return {
      nfcLogSeq: result.nfcLogSeq,
      readerSeq: result.readerSeq,
      readerName: result.readerName || '',
      readerCode: result.readerCode || '',
      spaceSeq: result.spaceSeq,
      spaceName: result.spaceName || '',
      buildingName: result.buildingName || '',
      cardSeq: result.cardSeq || null,
      userName: result.userName || null,
      cardLabel: result.cardLabel || null,
      cardType: result.cardType || null,
      logType: result.logType,
      tagIdentifier: result.tagIdentifier,
      tagAid: result.tagAid || null,
      controlResult: result.controlResult || null,
      controlDetails: this.parseControlDetails(result.controlDetail),
      taggedAt: result.taggedAt,
    };
  }
}
