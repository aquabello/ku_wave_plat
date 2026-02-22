import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { TbPlayer } from './entities/tb-player.entity';
import { TbPlayerHeartbeatLog } from './entities/tb-player-heartbeat-log.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbPlayList } from '@modules/playlists/entities/tb-play-list.entity';
import { TbPlayListContent } from '@modules/playlists/entities/tb-play-list-content.entity';
import { TbContent } from '@modules/contents/entities/tb-content.entity';
import { TbSetting } from '@modules/settings/entities/tb-setting.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TbPlayer,
      TbPlayerHeartbeatLog,
      TbBuilding,
      TbSpace,
      TbPlayList,
      TbPlayListContent,
      TbContent,
      TbSetting,
    ]),
  ],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
