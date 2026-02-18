import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ContentsController } from './contents.controller';
import { ContentsService } from './contents.service';
import { TbContent } from './entities/tb-content.entity';
import { TbPlayListContent } from '@modules/playlists/entities/tb-play-list-content.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TbContent,
      TbPlayListContent,
    ]),
    MulterModule.register({
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  ],
  controllers: [ContentsController],
  providers: [ContentsService],
  exports: [ContentsService],
})
export class ContentsModule {}
