import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { TbPlayLog } from './entities/tb-play-log.entity';
import { TbPlayer } from '@modules/players/entities/tb-player.entity';
import { TbContent } from '@modules/contents/entities/tb-content.entity';
import { QueryPlayLogsDto } from './dto/query-play-logs.dto';
import { QueryStatsDto } from './dto/query-stats.dto';

@Injectable()
export class PlayLogsService {
  constructor(
    @InjectRepository(TbPlayLog)
    private playLogRepo: Repository<TbPlayLog>,
    @InjectRepository(TbPlayer)
    private playerRepo: Repository<TbPlayer>,
    @InjectRepository(TbContent)
    private contentRepo: Repository<TbContent>,
  ) {}

  async getPlayerLogs(playerSeq: number, query: QueryPlayLogsDto) {
    const player = await this.playerRepo.findOne({
      where: { playerSeq, playerIsdel: 'N' },
    });

    if (!player) {
      throw new NotFoundException('플레이어를 찾을 수 없습니다.');
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.playLogRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.playlist', 'playlist')
      .leftJoinAndSelect('log.content', 'content')
      .where('log.player_seq = :playerSeq', { playerSeq });

    // Date range filter
    if (query.from && query.to) {
      qb.andWhere('log.play_started_at BETWEEN :from AND :to', {
        from: new Date(query.from),
        to: new Date(query.to),
      });
    } else if (query.from) {
      qb.andWhere('log.play_started_at >= :from', { from: new Date(query.from) });
    } else if (query.to) {
      qb.andWhere('log.play_started_at <= :to', { to: new Date(query.to) });
    }

    // Status filter
    if (query.status) {
      qb.andWhere('log.play_status = :status', { status: query.status });
    }

    // Playlist filter
    if (query.playlist_seq) {
      qb.andWhere('log.playlist_seq = :playlistSeq', { playlistSeq: query.playlist_seq });
    }

    // Content filter
    if (query.content_seq) {
      qb.andWhere('log.content_seq = :contentSeq', { contentSeq: query.content_seq });
    }

    qb.orderBy('log.playStartedAt', 'DESC').skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((log) => ({
        log_seq: log.logSeq,
        player_seq: log.playerSeq,
        playlist_seq: log.playlistSeq,
        playlist_name: log.playlist?.playlistName || null,
        content_seq: log.contentSeq,
        content_name: log.content?.contentName || null,
        zone_number: log.zoneNumber,
        play_started_at: log.playStartedAt,
        play_ended_at: log.playEndedAt,
        play_duration: log.playDuration,
        play_status: log.playStatus,
        error_message: log.errorMessage,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getContentStats(contentSeq: number, query: QueryStatsDto) {
    const content = await this.contentRepo.findOne({
      where: { contentSeq, contentIsdel: 'N' },
    });

    if (!content) {
      throw new NotFoundException('콘텐츠를 찾을 수 없습니다.');
    }

    const qb = this.playLogRepo
      .createQueryBuilder('log')
      .where('log.content_seq = :contentSeq', { contentSeq });

    // Date range filter
    if (query.from && query.to) {
      qb.andWhere('log.play_started_at BETWEEN :from AND :to', {
        from: new Date(query.from),
        to: new Date(query.to),
      });
    } else if (query.from) {
      qb.andWhere('log.play_started_at >= :from', { from: new Date(query.from) });
    } else if (query.to) {
      qb.andWhere('log.play_started_at <= :to', { to: new Date(query.to) });
    }

    // Overall stats
    const stats = await qb
      .select('COUNT(*)', 'totalPlayCount')
      .addSelect(
        "SUM(CASE WHEN log.play_status = 'COMPLETED' THEN 1 ELSE 0 END)",
        'completedCount',
      )
      .addSelect("SUM(CASE WHEN log.play_status = 'SKIPPED' THEN 1 ELSE 0 END)", 'skippedCount')
      .addSelect("SUM(CASE WHEN log.play_status = 'ERROR' THEN 1 ELSE 0 END)", 'errorCount')
      .addSelect('SUM(log.play_duration)', 'totalPlayTime')
      .addSelect('AVG(log.play_duration)', 'averagePlayTime')
      .addSelect('COUNT(DISTINCT log.player_seq)', 'uniquePlayers')
      .getRawOne();

    // Daily stats
    const dailyStats = await qb
      .select('DATE(log.play_started_at)', 'date')
      .addSelect('COUNT(*)', 'playCount')
      .addSelect(
        "SUM(CASE WHEN log.play_status = 'COMPLETED' THEN 1 ELSE 0 END)",
        'completedCount',
      )
      .groupBy('DATE(log.play_started_at)')
      .orderBy('DATE(log.playStartedAt)', 'ASC')
      .getRawMany();

    return {
      content_seq: contentSeq,
      content_name: content.contentName,
      total_play_count: parseInt(stats.totalPlayCount) || 0,
      completed_count: parseInt(stats.completedCount) || 0,
      skipped_count: parseInt(stats.skippedCount) || 0,
      error_count: parseInt(stats.errorCount) || 0,
      total_play_time: parseInt(stats.totalPlayTime) || 0,
      average_play_time: parseFloat(stats.averagePlayTime) || 0,
      unique_players: parseInt(stats.uniquePlayers) || 0,
      play_by_date: dailyStats.map((day) => ({
        date: day.date,
        play_count: parseInt(day.playCount),
        completed_count: parseInt(day.completedCount),
      })),
    };
  }
}
