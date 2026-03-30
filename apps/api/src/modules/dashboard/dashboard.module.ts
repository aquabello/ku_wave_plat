import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { TbSpaceDevice } from '@modules/controller/devices/entities/tb-space-device.entity';
import { TbNfcCard } from '@modules/nfc/entities/tb-nfc-card.entity';
import { TbNfcLog } from '@modules/nfc/entities/tb-nfc-log.entity';
import { TbPlayer } from '@modules/players/entities/tb-player.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { TbRecordingSession } from '@modules/recorders/entities/recording-session.entity';
import { TbActivityLog } from '@modules/activity-logs/entities/tb-activity-log.entity';
import { TbContent } from '@modules/contents/entities/tb-content.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TbSpaceDevice,
      TbNfcCard,
      TbNfcLog,
      TbPlayer,
      TbUser,
      TbRecordingSession,
      TbActivityLog,
      TbContent,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
