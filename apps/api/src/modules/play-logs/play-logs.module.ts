import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayLogsController } from './play-logs.controller';
import { PlayLogsService } from './play-logs.service';
import { TbPlayLog } from './entities/tb-play-log.entity';
import { TbPlayer } from '@modules/players/entities/tb-player.entity';
import { TbContent } from '@modules/contents/entities/tb-content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TbPlayLog, TbPlayer, TbContent])],
  controllers: [PlayLogsController],
  providers: [PlayLogsService],
  exports: [PlayLogsService],
})
export class PlayLogsModule {}
