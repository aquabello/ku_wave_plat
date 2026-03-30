import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbSpaceDevice } from '@modules/controller/devices/entities/tb-space-device.entity';
import { TbNfcCard } from '@modules/nfc/entities/tb-nfc-card.entity';
import { TbNfcLog } from '@modules/nfc/entities/tb-nfc-log.entity';
import { TbPlayer } from '@modules/players/entities/tb-player.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { TbRecordingSession } from '@modules/recorders/entities/recording-session.entity';
import { TbActivityLog } from '@modules/activity-logs/entities/tb-activity-log.entity';
import { TbContent } from '@modules/contents/entities/tb-content.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(TbSpaceDevice)
    private readonly spaceDeviceRepo: Repository<TbSpaceDevice>,
    @InjectRepository(TbNfcCard)
    private readonly nfcCardRepo: Repository<TbNfcCard>,
    @InjectRepository(TbNfcLog)
    private readonly nfcLogRepo: Repository<TbNfcLog>,
    @InjectRepository(TbPlayer)
    private readonly playerRepo: Repository<TbPlayer>,
    @InjectRepository(TbUser)
    private readonly userRepo: Repository<TbUser>,
    @InjectRepository(TbRecordingSession)
    private readonly recordingSessionRepo: Repository<TbRecordingSession>,
    @InjectRepository(TbActivityLog)
    private readonly activityLogRepo: Repository<TbActivityLog>,
    @InjectRepository(TbContent)
    private readonly contentRepo: Repository<TbContent>,
  ) {}

  async getOverview() {
    const [
      controllerTotal,
      controllerActive,
      controllerInactive,
      nfcTotalCards,
      nfcTodayTagCount,
      displayTotal,
      displayOnline,
      usersTotal,
      usersActive,
      recordingsByDayRaw,
      recentActivitiesRaw,
      displayContentsRaw,
    ] = await Promise.all([
      // Controller: total non-deleted devices
      this.spaceDeviceRepo.count({
        where: { deviceIsdel: 'N' },
      }),
      // Controller: active devices
      this.spaceDeviceRepo.count({
        where: { deviceIsdel: 'N', deviceStatus: 'ACTIVE' },
      }),
      // Controller: inactive devices
      this.spaceDeviceRepo.count({
        where: { deviceIsdel: 'N', deviceStatus: 'INACTIVE' },
      }),
      // NFC: total non-deleted cards
      this.nfcCardRepo.count({
        where: { cardIsdel: 'N' },
      }),
      // NFC: today's tag count
      this.nfcLogRepo
        .createQueryBuilder('log')
        .where('log.tagged_at >= CURDATE()')
        .andWhere('log.tagged_at < CURDATE() + INTERVAL 1 DAY')
        .getCount(),
      // Display: total non-deleted players
      this.playerRepo.count({
        where: { playerIsdel: 'N' },
      }),
      // Display: online players
      this.playerRepo.count({
        where: { playerIsdel: 'N', playerStatus: 'ONLINE' },
      }),
      // Users: total non-deleted users
      this.userRepo
        .createQueryBuilder('u')
        .where("(u.tu_isdel != 'Y' OR u.tu_isdel IS NULL)")
        .getCount(),
      // Users: active users (tu_isdel != 'Y' and tu_step = '1')
      this.userRepo
        .createQueryBuilder('u')
        .where("(u.tu_isdel != 'Y' OR u.tu_isdel IS NULL)")
        .andWhere("u.tu_step = '1'")
        .getCount(),
      // Recording sessions: grouped by day for last 7 days
      this.recordingSessionRepo
        .createQueryBuilder('session')
        .select('DATE(session.started_at)', 'date')
        .addSelect('COUNT(*)', 'count')
        .where('session.started_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)')
        .groupBy('DATE(session.started_at)')
        .orderBy('date', 'ASC')
        .getRawMany<{ date: string; count: string }>(),
      // Recent activity logs (last 7 non-null action_name entries)
      this.activityLogRepo
        .createQueryBuilder('log')
        .select([
          'log.actionName',
          'log.tuName',
          'log.httpMethod',
          'log.requestUrl',
          'log.statusCode',
          'log.regDate',
        ])
        .where('log.actionName IS NOT NULL')
        .orderBy('log.reg_date', 'DESC')
        .take(7)
        .getMany(),
      // Display contents: latest 5 non-deleted
      this.contentRepo.find({
        where: { contentIsdel: 'N' },
        order: { regDate: 'DESC' },
        take: 5,
        select: ['contentName', 'contentType', 'contentStatus', 'validFrom', 'validTo'],
      }),
    ]);

    // Build a full 7-day array, filling missing dates with count 0
    const recordingsByDay: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      recordingsByDay.push({ date: d.toISOString().slice(0, 10), count: 0 });
    }
    recordingsByDayRaw.forEach((r) => {
      const found = recordingsByDay.find((d) => d.date === r.date);
      if (found) found.count = Number(r.count);
    });

    const recentActivities = recentActivitiesRaw.map((log) => ({
      actionName: log.actionName as string,
      userName: log.tuName,
      httpMethod: log.httpMethod,
      requestUrl: log.requestUrl,
      statusCode: log.statusCode,
      regDate: log.regDate as Date,
    }));

    const displayContents = displayContentsRaw.map((c) => ({
      contentName: c.contentName,
      contentType: c.contentType,
      contentStatus: c.contentStatus,
      validFrom: c.validFrom,
      validTo: c.validTo,
    }));

    return {
      controller: {
        total: controllerTotal,
        active: controllerActive,
        inactive: controllerInactive,
      },
      nfc: {
        totalCards: nfcTotalCards,
        todayTagCount: nfcTodayTagCount,
      },
      display: {
        total: displayTotal,
        online: displayOnline,
        offline: displayTotal - displayOnline,
      },
      users: {
        total: usersTotal,
        active: usersActive,
      },
      recordingsByDay,
      recentActivities,
      displayContents,
    };
  }
}
