import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerPlaylistsController } from './player-playlists.controller';
import { PlayerPlaylistsService } from './player-playlists.service';
import { TbPlayerPlaylist } from './entities/tb-player-playlist.entity';
import { TbGroupPlaylist } from './entities/tb-group-playlist.entity';
import { TbPlayer } from '@modules/players/entities/tb-player.entity';
import { TbPlayList } from '@modules/playlists/entities/tb-play-list.entity';
import { TbPlayerGroup } from '@modules/player-groups/entities/tb-player-group.entity';
import { TbPlayerGroupMember } from '@modules/player-groups/entities/tb-player-group-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TbPlayerPlaylist,
      TbGroupPlaylist,
      TbPlayer,
      TbPlayList,
      TbPlayerGroup,
      TbPlayerGroupMember,
    ]),
  ],
  controllers: [PlayerPlaylistsController],
  providers: [PlayerPlaylistsService],
  exports: [PlayerPlaylistsService],
})
export class PlayerPlaylistsModule {}
