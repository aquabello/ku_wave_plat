import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLogsController } from './activity-logs.controller';
import { ActivityLogsService } from './activity-logs.service';
import { TbActivityLog } from './entities/tb-activity-log.entity';
import { ActivityLogInterceptor } from './interceptors/activity-log.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([TbActivityLog])],
  controllers: [ActivityLogsController],
  providers: [ActivityLogsService, ActivityLogInterceptor],
  exports: [ActivityLogsService, ActivityLogInterceptor],
})
export class ActivityLogsModule {}
