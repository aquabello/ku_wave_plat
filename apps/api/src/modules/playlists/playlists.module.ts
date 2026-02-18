import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';
import { TbPlayList } from './entities/tb-play-list.entity';
import { TbPlayListContent } from './entities/tb-play-list-content.entity';
import { TbContent } from '@modules/contents/entities/tb-content.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TbPlayList,
      TbPlayListContent,
      TbContent,
    ]),
  ],
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}
