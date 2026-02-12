import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbNfcReader } from '../entities/tb-nfc-reader.entity';
import { TbNfcCard } from '../entities/tb-nfc-card.entity';
import { TbNfcLog } from '../entities/tb-nfc-log.entity';

interface ActiveSpace {
  spaceSeq: number;
  spaceName: string;
  currentUser: string;
  enteredAt: string;
}

@Injectable()
export class NfcStatsService {
  constructor(
    @InjectRepository(TbNfcReader)
    private readonly nfcReaderRepository: Repository<TbNfcReader>,
    @InjectRepository(TbNfcCard)
    private readonly nfcCardRepository: Repository<TbNfcCard>,
    @InjectRepository(TbNfcLog)
    private readonly nfcLogRepository: Repository<TbNfcLog>,
  ) {}

  /**
   * Get comprehensive NFC statistics for dashboard
   */
  async getStats() {
    // Get reader statistics
    const readerStats = await this.getReaderStats();

    // Get card statistics
    const cardStats = await this.getCardStats();

    // Get today's log statistics
    const todayStats = await this.getTodayStats();

    // Get active spaces (current occupants)
    const activeSpaces = await this.getActiveSpaces();

    return {
      readers: readerStats,
      cards: cardStats,
      today: todayStats,
      activeSpaces,
    };
  }

  /**
   * Get reader statistics
   */
  private async getReaderStats() {
    const total = await this.nfcReaderRepository
      .createQueryBuilder('r')
      .where('r.reader_isdel = :isdel', { isdel: 'N' })
      .getCount();

    const active = await this.nfcReaderRepository
      .createQueryBuilder('r')
      .where('r.reader_status = :status', { status: 'ACTIVE' })
      .andWhere('r.reader_isdel = :isdel', { isdel: 'N' })
      .getCount();

    const inactive = total - active;

    return {
      total,
      active,
      inactive,
    };
  }

  /**
   * Get card statistics
   */
  private async getCardStats() {
    const total = await this.nfcCardRepository
      .createQueryBuilder('c')
      .where('c.card_isdel = :isdel', { isdel: 'N' })
      .getCount();

    const active = await this.nfcCardRepository
      .createQueryBuilder('c')
      .where('c.card_status = :status', { status: 'ACTIVE' })
      .andWhere('c.card_isdel = :isdel', { isdel: 'N' })
      .getCount();

    const blocked = await this.nfcCardRepository
      .createQueryBuilder('c')
      .where('c.card_status = :status', { status: 'BLOCKED' })
      .andWhere('c.card_isdel = :isdel', { isdel: 'N' })
      .getCount();

    const inactive = await this.nfcCardRepository
      .createQueryBuilder('c')
      .where('c.card_status = :status', { status: 'INACTIVE' })
      .andWhere('c.card_isdel = :isdel', { isdel: 'N' })
      .getCount();

    const cardTypeCount = await this.nfcCardRepository
      .createQueryBuilder('c')
      .where('c.card_type = :type', { type: 'CARD' })
      .andWhere('c.card_isdel = :isdel', { isdel: 'N' })
      .getCount();

    const phoneTypeCount = await this.nfcCardRepository
      .createQueryBuilder('c')
      .where('c.card_type = :type', { type: 'PHONE' })
      .andWhere('c.card_isdel = :isdel', { isdel: 'N' })
      .getCount();

    return {
      total,
      active,
      blocked,
      inactive,
      byType: {
        CARD: cardTypeCount,
        PHONE: phoneTypeCount,
      },
    };
  }

  /**
   * Get today's log statistics
   */
  private async getTodayStats() {
    const totalTags = await this.nfcLogRepository
      .createQueryBuilder('nl')
      .where('DATE(nl.tagged_at) = CURDATE()')
      .getCount();

    const enters = await this.nfcLogRepository
      .createQueryBuilder('nl')
      .where('DATE(nl.tagged_at) = CURDATE()')
      .andWhere('nl.log_type = :logType', { logType: 'ENTER' })
      .getCount();

    const exits = await this.nfcLogRepository
      .createQueryBuilder('nl')
      .where('DATE(nl.tagged_at) = CURDATE()')
      .andWhere('nl.log_type = :logType', { logType: 'EXIT' })
      .getCount();

    const denied = await this.nfcLogRepository
      .createQueryBuilder('nl')
      .where('DATE(nl.tagged_at) = CURDATE()')
      .andWhere('nl.log_type = :logType', { logType: 'DENIED' })
      .getCount();

    const unknown = await this.nfcLogRepository
      .createQueryBuilder('nl')
      .where('DATE(nl.tagged_at) = CURDATE()')
      .andWhere('nl.log_type = :logType', { logType: 'UNKNOWN' })
      .getCount();

    return {
      totalTags,
      enters,
      exits,
      denied,
      unknown,
    };
  }

  /**
   * Get active spaces (current occupants)
   * Find logs where the latest log for a card_seq + reader_seq combination is ENTER
   */
  private async getActiveSpaces(): Promise<ActiveSpace[]> {
    // Subquery to get the latest log per (card_seq, reader_seq) combination
    const latestLogsSubquery = this.nfcLogRepository
      .createQueryBuilder('nl_sub')
      .select('nl_sub.card_seq', 'card_seq')
      .addSelect('nl_sub.reader_seq', 'reader_seq')
      .addSelect('MAX(nl_sub.tagged_at)', 'max_tagged_at')
      .where('nl_sub.card_seq IS NOT NULL')
      .groupBy('nl_sub.card_seq')
      .addGroupBy('nl_sub.reader_seq');

    // Main query to get active spaces
    const activeSpaceResults = await this.nfcLogRepository
      .createQueryBuilder('nl')
      .innerJoin(
        `(${latestLogsSubquery.getQuery()})`,
        'latest',
        'nl.card_seq = latest.card_seq AND nl.reader_seq = latest.reader_seq AND nl.tagged_at = latest.max_tagged_at',
      )
      .leftJoin('tb_space', 's', 'nl.space_seq = s.space_seq')
      .leftJoin('tb_users', 'u', 'nl.tu_seq = u.tu_seq')
      .select([
        'nl.space_seq AS spaceSeq',
        's.space_name AS spaceName',
        'u.tu_name AS currentUser',
        'nl.tagged_at AS enteredAt',
      ])
      .where('nl.log_type = :logType', { logType: 'ENTER' })
      .orderBy('nl.tagged_at', 'DESC')
      .limit(50)
      .setParameters(latestLogsSubquery.getParameters())
      .getRawMany();

    return activeSpaceResults.map((row) => ({
      spaceSeq: row.spaceSeq,
      spaceName: row.spaceName || '',
      currentUser: row.currentUser || 'Unknown',
      enteredAt: row.enteredAt,
    }));
  }
}
