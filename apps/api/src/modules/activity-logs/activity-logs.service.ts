import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbActivityLog } from './entities/tb-activity-log.entity';
import { ActivityLogQueryDto } from './dto';
import {
  ActivityLogListItemDto,
  ActivityLogDetailDto,
  ActivityLogListResponseDto,
} from './dto';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectRepository(TbActivityLog)
    private readonly activityLogRepository: Repository<TbActivityLog>,
  ) {}

  /**
   * 활동로그 리스트 조회 (페이징 + 검색 + 필터)
   * - SUPER: 전체 로그 조회
   * - 일반 사용자: 본인 로그만 조회
   */
  async findAll(
    query: ActivityLogQueryDto,
    currentUser: { seq: number; userType: string },
  ): Promise<ActivityLogListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.activityLogRepository
      .createQueryBuilder('log')
      .select([
        'log.logSeq',
        'log.tuId',
        'log.tuName',
        'log.actionName',
        'log.httpMethod',
        'log.requestUrl',
        'log.statusCode',
        'log.durationMs',
        'log.regDate',
      ]);

    // 일반 사용자: 본인 로그만 조회
    if (currentUser.userType !== 'SUPER') {
      qb.andWhere('log.tu_seq = :userSeq', { userSeq: currentUser.seq });
    }

    // 통합 검색 (사용자ID, 이름)
    if (query.search) {
      qb.andWhere(
        '(log.tu_id LIKE :search OR log.tu_name LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // HTTP 메서드 필터
    if (query.httpMethod) {
      qb.andWhere('log.http_method = :httpMethod', {
        httpMethod: query.httpMethod,
      });
    }

    // 행위명 필터
    if (query.actionName) {
      qb.andWhere('log.action_name LIKE :actionName', {
        actionName: `%${query.actionName}%`,
      });
    }

    // 날짜 범위 필터
    if (query.startDate) {
      qb.andWhere('log.reg_date >= :startDate', {
        startDate: `${query.startDate} 00:00:00`,
      });
    }
    if (query.endDate) {
      qb.andWhere('log.reg_date <= :endDate', {
        endDate: `${query.endDate} 23:59:59`,
      });
    }

    const [logs, total] = await qb
      .orderBy('log.log_seq', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const items: ActivityLogListItemDto[] = logs.map((log, index) => ({
      no: total - skip - index,
      logSeq: log.logSeq,
      tuId: log.tuId,
      tuName: log.tuName,
      actionName: log.actionName,
      httpMethod: log.httpMethod,
      requestUrl: log.requestUrl,
      statusCode: log.statusCode,
      durationMs: log.durationMs,
      regDate: log.regDate,
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
   * 활동로그 상세 조회
   * - SUPER: 전체 로그 조회 가능
   * - 일반 사용자: 본인 로그만 조회 가능
   */
  async findOne(
    logSeq: number,
    currentUser: { seq: number; userType: string },
  ): Promise<ActivityLogDetailDto> {
    const where: any = { logSeq };

    // 일반 사용자: 본인 로그만 조회 가능
    if (currentUser.userType !== 'SUPER') {
      where.tuSeq = currentUser.seq;
    }

    const log = await this.activityLogRepository.findOne({ where });

    if (!log) {
      throw new NotFoundException('해당 활동로그를 찾을 수 없습니다');
    }

    return {
      no: 0,
      logSeq: log.logSeq,
      tuId: log.tuId,
      tuName: log.tuName,
      actionName: log.actionName,
      httpMethod: log.httpMethod,
      requestUrl: log.requestUrl,
      statusCode: log.statusCode,
      durationMs: log.durationMs,
      regDate: log.regDate,
      tuSeq: log.tuSeq,
      requestBody: log.requestBody,
      responseBody: log.responseBody,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
    };
  }

  /**
   * 활동로그 저장 (Interceptor에서 호출)
   */
  async create(logData: Partial<TbActivityLog>): Promise<void> {
    const log = this.activityLogRepository.create(logData);
    await this.activityLogRepository.save(log);
  }
}
