import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbPlayListContent } from '@modules/playlists/entities/tb-play-list-content.entity';
import { TbContentApprovalLog } from './entities/tb-content-approval-log.entity';
import { ListContentApprovalsDto } from './dto/list-content-approvals.dto';

@Injectable()
export class ContentApprovalsService {
  constructor(
    @InjectRepository(TbPlayListContent)
    private readonly plcRepository: Repository<TbPlayListContent>,
    @InjectRepository(TbContentApprovalLog)
    private readonly logRepository: Repository<TbContentApprovalLog>,
  ) {}

  /**
   * 1. 콘텐츠 승인 목록 + 통계 조회
   */
  async findAll(query: ListContentApprovalsDto) {
    const { building_seq, status, search, start_date, end_date } = query;

    // 통계 쿼리
    const statsQb = this.plcRepository
      .createQueryBuilder('plc')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN plc.approval_status = 'PENDING' THEN 1 ELSE 0 END)", 'pending')
      .addSelect("SUM(CASE WHEN plc.approval_status = 'APPROVED' THEN 1 ELSE 0 END)", 'approved')
      .addSelect("SUM(CASE WHEN plc.approval_status = 'REJECTED' THEN 1 ELSE 0 END)", 'rejected')
      .where('plc.plc_isdel = :isdel', { isdel: 'N' });

    const statsRaw = await statsQb.getRawOne();
    const stats = {
      total: Number(statsRaw.total) || 0,
      pending: Number(statsRaw.pending) || 0,
      approved: Number(statsRaw.approved) || 0,
      rejected: Number(statsRaw.rejected) || 0,
    };

    // 목록 쿼리 (player_name은 playlist를 통해 GROUP_CONCAT으로 집계)
    const listQb = this.plcRepository
      .createQueryBuilder('plc')
      .innerJoin('plc.playlist', 'playlist')
      .innerJoin('plc.content', 'content')
      .leftJoin('plc.requester', 'requester')
      .leftJoin('plc.reviewer', 'reviewer')
      .leftJoin('tb_player', 'player', 'player.playlist_seq = playlist.playlist_seq AND player.player_isdel = :playerIsdel', { playerIsdel: 'N' })
      .leftJoin('tb_building', 'building', 'building.building_seq = player.building_seq')
      .select([
        'plc.plc_seq AS plc_seq',
        "GROUP_CONCAT(DISTINCT building.building_name SEPARATOR ', ') AS building_name",
        "GROUP_CONCAT(DISTINCT player.player_name SEPARATOR ', ') AS player_name",
        'playlist.playlist_name AS playlist_name',
        'content.content_name AS content_name',
        'content.content_type AS content_type',
        'requester.tu_name AS requester_name',
        'plc.reg_date AS reg_date',
        'plc.approval_status AS approval_status',
        'reviewer.tu_name AS reviewer_name',
        'plc.reviewed_date AS reviewed_date',
        'plc.reject_reason AS reject_reason',
      ])
      .where('plc.plc_isdel = :isdel', { isdel: 'N' })
      .groupBy('plc.plc_seq')
      .addGroupBy('playlist.playlist_name')
      .addGroupBy('content.content_name')
      .addGroupBy('content.content_type')
      .addGroupBy('requester.tu_name')
      .addGroupBy('plc.reg_date')
      .addGroupBy('plc.approval_status')
      .addGroupBy('reviewer.tu_name')
      .addGroupBy('plc.reviewed_date')
      .addGroupBy('plc.reject_reason');

    if (building_seq) {
      listQb.andWhere('building.building_seq = :buildingSeq', { buildingSeq: building_seq });
    }

    if (status) {
      listQb.andWhere('plc.approval_status = :status', { status });
    }

    if (search) {
      listQb.andWhere(
        '(content.content_name LIKE :search OR playlist.playlist_name LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (start_date) {
      listQb.andWhere('plc.reg_date >= :startDate', { startDate: start_date });
    }

    if (end_date) {
      listQb.andWhere('plc.reg_date <= :endDate', { endDate: `${end_date} 23:59:59` });
    }

    listQb.orderBy('plc.reg_date', 'DESC');

    const items = await listQb.getRawMany();

    return {
      stats,
      items: items.map((row) => ({
        plc_seq: row.plc_seq,
        building_name: row.building_name || null,
        player_name: row.player_name || null,
        playlist_name: row.playlist_name,
        content_name: row.content_name,
        content_type: row.content_type,
        requester_name: row.requester_name || '시스템',
        reg_date: row.reg_date,
        approval_status: row.approval_status,
        reviewer_name: row.reviewer_name || null,
        reviewed_date: row.reviewed_date || null,
        reject_reason: row.reject_reason || null,
      })),
    };
  }

  /**
   * 2. 콘텐츠 승인
   */
  async approve(plcSeq: number, userId: number) {
    const plc = await this.findPlcOrFail(plcSeq);

    if (plc.approvalStatus !== 'PENDING') {
      throw new BadRequestException(
        `현재 상태(${plc.approvalStatus})에서는 승인할 수 없습니다. PENDING 상태만 승인 가능합니다.`,
      );
    }

    plc.approvalStatus = 'APPROVED';
    plc.reviewerSeq = userId;
    plc.reviewedDate = new Date();
    plc.rejectReason = null;
    await this.plcRepository.save(plc);

    // 이력 저장
    await this.logRepository.save(
      this.logRepository.create({
        plcSeq,
        action: 'APPROVED',
        actorSeq: userId,
      }),
    );

    return {
      plc_seq: plc.plcSeq,
      approval_status: plc.approvalStatus,
      reviewer_seq: plc.reviewerSeq,
      reviewed_date: plc.reviewedDate,
    };
  }

  /**
   * 3. 콘텐츠 반려
   */
  async reject(plcSeq: number, reason: string, userId: number) {
    const plc = await this.findPlcOrFail(plcSeq);

    if (plc.approvalStatus !== 'PENDING') {
      throw new BadRequestException(
        `현재 상태(${plc.approvalStatus})에서는 반려할 수 없습니다. PENDING 상태만 반려 가능합니다.`,
      );
    }

    plc.approvalStatus = 'REJECTED';
    plc.reviewerSeq = userId;
    plc.reviewedDate = new Date();
    plc.rejectReason = reason;
    await this.plcRepository.save(plc);

    // 이력 저장
    await this.logRepository.save(
      this.logRepository.create({
        plcSeq,
        action: 'REJECTED',
        actorSeq: userId,
        reason,
      }),
    );

    return {
      plc_seq: plc.plcSeq,
      approval_status: plc.approvalStatus,
      reviewer_seq: plc.reviewerSeq,
      reviewed_date: plc.reviewedDate,
      reject_reason: plc.rejectReason,
    };
  }

  /**
   * 4. 콘텐츠 승인 취소 (APPROVED/REJECTED → PENDING)
   */
  async cancel(plcSeq: number, userId: number) {
    const plc = await this.findPlcOrFail(plcSeq);

    if (plc.approvalStatus === 'PENDING') {
      throw new BadRequestException('이미 대기 상태입니다.');
    }

    const previousStatus = plc.approvalStatus;

    plc.approvalStatus = 'PENDING';
    plc.reviewerSeq = null;
    plc.reviewedDate = null;
    plc.rejectReason = null;
    await this.plcRepository.save(plc);

    // 이력 저장
    await this.logRepository.save(
      this.logRepository.create({
        plcSeq,
        action: 'CANCELLED',
        actorSeq: userId,
        reason: `${previousStatus} → PENDING 취소`,
      }),
    );

    return {
      plc_seq: plc.plcSeq,
      approval_status: plc.approvalStatus,
    };
  }

  /**
   * 5. 승인 이력 조회
   */
  async findHistory(plcSeq: number) {
    // plc 존재 확인
    await this.findPlcOrFail(plcSeq);

    const logs = await this.logRepository
      .createQueryBuilder('log')
      .leftJoin('log.actor', 'actor')
      .select([
        'log.log_seq AS history_seq',
        'log.action AS action',
        'actor.tu_name AS actor_name',
        'log.reason AS reason',
        'log.created_at AS created_at',
      ])
      .where('log.plc_seq = :plcSeq', { plcSeq })
      .orderBy('log.created_at', 'DESC')
      .getRawMany();

    return logs.map((row) => ({
      history_seq: row.history_seq,
      action: row.action,
      actor_name: row.actor_name || '시스템',
      reason: row.reason || null,
      created_at: row.created_at,
    }));
  }

  /**
   * plc 조회 헬퍼
   */
  private async findPlcOrFail(plcSeq: number): Promise<TbPlayListContent> {
    const plc = await this.plcRepository.findOne({
      where: { plcSeq, plcIsdel: 'N' },
    });

    if (!plc) {
      throw new NotFoundException('콘텐츠 매핑을 찾을 수 없습니다.');
    }

    return plc;
  }
}
