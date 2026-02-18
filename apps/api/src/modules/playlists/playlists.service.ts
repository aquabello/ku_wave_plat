import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TbPlayList } from './entities/tb-play-list.entity';
import { TbPlayListContent } from './entities/tb-play-list-content.entity';
import { TbContent } from '@modules/contents/entities/tb-content.entity';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { ListPlaylistsDto } from './dto/list-playlists.dto';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectRepository(TbPlayList)
    private readonly playlistRepository: Repository<TbPlayList>,
    @InjectRepository(TbPlayListContent)
    private readonly playlistContentRepository: Repository<TbPlayListContent>,
    @InjectRepository(TbContent)
    private readonly contentRepository: Repository<TbContent>,
  ) {}

  async findAll(query: ListPlaylistsDto) {
    const { page = 1, limit = 20, type, search } = query;

    const queryBuilder = this.playlistRepository
      .createQueryBuilder('playlist')
      .leftJoinAndSelect('playlist.playlistContents', 'plc', 'plc.plc_isdel = :isdel', { isdel: 'N' })
      .leftJoin('playlist.players', 'player', 'player.player_isdel = :isdel', { isdel: 'N' })
      .where('playlist.playlist_isdel = :isdel', { isdel: 'N' });

    if (type) {
      queryBuilder.andWhere('playlist.playlist_type = :type', { type });
    }

    if (search) {
      queryBuilder.andWhere(
        '(playlist.playlist_name LIKE :search OR playlist.playlist_code LIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .addSelect('COUNT(DISTINCT plc.plc_seq)', 'content_count')
      .addSelect('COUNT(DISTINCT player.player_seq)', 'player_count')
      .groupBy('playlist.playlist_seq')
      .orderBy('playlist.playlistOrder', 'ASC');

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: await Promise.all(
        items.map(async (playlist) => {
          const contentCount = await this.playlistContentRepository.count({
            where: { playlistSeq: playlist.playlistSeq, plcIsdel: 'N' },
          });

          const playerCount = await this.playlistRepository
            .createQueryBuilder('pl')
            .leftJoin('pl.players', 'player')
            .where('pl.playlist_seq = :seq', { seq: playlist.playlistSeq })
            .andWhere('player.player_isdel = :isdel', { isdel: 'N' })
            .getCount();

          return {
            playlist_seq: playlist.playlistSeq,
            playlist_name: playlist.playlistName,
            playlist_code: playlist.playlistCode,
            playlist_type: playlist.playlistType,
            playlist_priority: playlist.playlistPriority,
            playlist_duration: playlist.playlistDuration,
            playlist_loop: playlist.playlistLoop,
            playlist_random: playlist.playlistRandom,
            playlist_screen_layout: playlist.playlistScreenLayout,
            playlist_status: playlist.playlistStatus,
            playlist_description: playlist.playlistDescription,
            content_count: contentCount,
            player_count: playerCount,
            reg_date: playlist.regDate,
            upd_date: playlist.updDate,
          };
        }),
      ),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(playlistSeq: number) {
    const playlist = await this.playlistRepository.findOne({
      where: { playlistSeq, playlistIsdel: 'N' },
    });

    if (!playlist) {
      throw new NotFoundException('플레이리스트를 찾을 수 없습니다.');
    }

    // 콘텐츠 매핑 조회
    const playlistContents = await this.playlistContentRepository.find({
      where: { playlistSeq, plcIsdel: 'N' },
      relations: ['content'],
      order: { playOrder: 'ASC' },
    });

    return {
      playlist_seq: playlist.playlistSeq,
      playlist_name: playlist.playlistName,
      playlist_code: playlist.playlistCode,
      playlist_type: playlist.playlistType,
      playlist_priority: playlist.playlistPriority,
      playlist_duration: playlist.playlistDuration,
      playlist_loop: playlist.playlistLoop,
      playlist_random: playlist.playlistRandom,
      playlist_screen_layout: playlist.playlistScreenLayout,
      playlist_status: playlist.playlistStatus,
      playlist_description: playlist.playlistDescription,
      playlist_order: playlist.playlistOrder,
      playlist_isdel: playlist.playlistIsdel,
      reg_date: playlist.regDate,
      upd_date: playlist.updDate,
      contents: playlistContents.map((plc) => ({
        plc_seq: plc.plcSeq,
        content_seq: plc.contentSeq,
        content_name: plc.content.contentName,
        content_code: plc.content.contentCode,
        content_type: plc.content.contentType,
        content_file_path: plc.content.contentFilePath,
        content_url: plc.content.contentUrl,
        content_duration: plc.content.contentDuration,
        play_order: plc.playOrder,
        play_duration: plc.playDuration,
        transition_effect: plc.transitionEffect,
        transition_duration: plc.transitionDuration,
        zone_number: plc.zoneNumber,
        zone_width: plc.zoneWidth,
        zone_height: plc.zoneHeight,
        zone_x_position: plc.zoneXPosition,
        zone_y_position: plc.zoneYPosition,
      })),
    };
  }

  async create(createPlaylistDto: CreatePlaylistDto) {
    // 플레이리스트 코드 중복 확인
    const existing = await this.playlistRepository.findOne({
      where: { playlistCode: createPlaylistDto.playlist_code },
    });

    if (existing) {
      throw new ConflictException('이미 사용 중인 플레이리스트 코드입니다.');
    }

    // 콘텐츠 존재 확인
    if (createPlaylistDto.contents && createPlaylistDto.contents.length > 0) {
      const contentSeqs = createPlaylistDto.contents.map((c) => c.content_seq);
      const contents = await this.contentRepository.find({
        where: { contentSeq: In(contentSeqs), contentIsdel: 'N' },
      });

      if (contents.length !== contentSeqs.length) {
        throw new NotFoundException('존재하지 않는 콘텐츠가 포함되어 있습니다.');
      }
    }

    // 플레이리스트 생성
    const playlist = this.playlistRepository.create({
      playlistName: createPlaylistDto.playlist_name,
      playlistCode: createPlaylistDto.playlist_code,
      playlistType: createPlaylistDto.playlist_type || 'NORMAL',
      playlistPriority: createPlaylistDto.playlist_priority ?? 0,
      playlistLoop: createPlaylistDto.playlist_loop || 'Y',
      playlistRandom: createPlaylistDto.playlist_random || 'N',
      playlistScreenLayout: createPlaylistDto.playlist_screen_layout || '1x1',
      playlistStatus: createPlaylistDto.playlist_status || 'ACTIVE',
      playlistDescription: createPlaylistDto.playlist_description,
    });

    const savedPlaylist = await this.playlistRepository.save(playlist);

    // 콘텐츠 매핑 생성
    if (createPlaylistDto.contents && createPlaylistDto.contents.length > 0) {
      const mappings = createPlaylistDto.contents.map((content) =>
        this.playlistContentRepository.create({
          playlistSeq: savedPlaylist.playlistSeq,
          contentSeq: content.content_seq,
          playOrder: content.play_order,
          playDuration: content.play_duration,
          transitionEffect: content.transition_effect,
          transitionDuration: content.transition_duration ?? 0,
          zoneNumber: content.zone_number ?? 1,
          zoneWidth: content.zone_width ?? 100,
          zoneHeight: content.zone_height ?? 100,
          zoneXPosition: content.zone_x_position ?? 0,
          zoneYPosition: content.zone_y_position ?? 0,
        }),
      );

      await this.playlistContentRepository.save(mappings);

      // 총 재생 시간 계산
      await this.updatePlaylistDuration(savedPlaylist.playlistSeq);
    }

    return {
      playlist_seq: savedPlaylist.playlistSeq,
      playlist_code: savedPlaylist.playlistCode,
      reg_date: savedPlaylist.regDate,
    };
  }

  async update(playlistSeq: number, updatePlaylistDto: UpdatePlaylistDto) {
    const playlist = await this.playlistRepository.findOne({
      where: { playlistSeq, playlistIsdel: 'N' },
    });

    if (!playlist) {
      throw new NotFoundException('플레이리스트를 찾을 수 없습니다.');
    }

    // 콘텐츠 매핑 전체 교체
    if (updatePlaylistDto.contents) {
      const contentSeqs = updatePlaylistDto.contents.map((c) => c.content_seq);
      const contents = await this.contentRepository.find({
        where: { contentSeq: In(contentSeqs), contentIsdel: 'N' },
      });

      if (contents.length !== contentSeqs.length) {
        throw new NotFoundException('존재하지 않는 콘텐츠가 포함되어 있습니다.');
      }

      // 기존 매핑 삭제 (소프트)
      await this.playlistContentRepository.update(
        { playlistSeq },
        { plcIsdel: 'Y' },
      );

      // 새 매핑 생성
      const mappings = updatePlaylistDto.contents.map((content) =>
        this.playlistContentRepository.create({
          playlistSeq,
          contentSeq: content.content_seq,
          playOrder: content.play_order,
          playDuration: content.play_duration,
          transitionEffect: content.transition_effect,
          transitionDuration: content.transition_duration ?? 0,
          zoneNumber: content.zone_number ?? 1,
          zoneWidth: content.zone_width ?? 100,
          zoneHeight: content.zone_height ?? 100,
          zoneXPosition: content.zone_x_position ?? 0,
          zoneYPosition: content.zone_y_position ?? 0,
        }),
      );

      await this.playlistContentRepository.save(mappings);

      // 총 재생 시간 재계산
      await this.updatePlaylistDuration(playlistSeq);
    }

    // 플레이리스트 정보 업데이트
    Object.assign(playlist, {
      playlistName: updatePlaylistDto.playlist_name ?? playlist.playlistName,
      playlistType: updatePlaylistDto.playlist_type ?? playlist.playlistType,
      playlistPriority: updatePlaylistDto.playlist_priority ?? playlist.playlistPriority,
      playlistLoop: updatePlaylistDto.playlist_loop ?? playlist.playlistLoop,
      playlistRandom: updatePlaylistDto.playlist_random ?? playlist.playlistRandom,
      playlistScreenLayout: updatePlaylistDto.playlist_screen_layout ?? playlist.playlistScreenLayout,
      playlistStatus: updatePlaylistDto.playlist_status ?? playlist.playlistStatus,
      playlistDescription: updatePlaylistDto.playlist_description ?? playlist.playlistDescription,
      playlistOrder: updatePlaylistDto.playlist_order ?? playlist.playlistOrder,
    });

    const savedPlaylist = await this.playlistRepository.save(playlist);

    return {
      playlist_seq: savedPlaylist.playlistSeq,
      upd_date: savedPlaylist.updDate,
    };
  }

  async remove(playlistSeq: number) {
    const playlist = await this.playlistRepository.findOne({
      where: { playlistSeq, playlistIsdel: 'N' },
    });

    if (!playlist) {
      throw new NotFoundException('플레이리스트를 찾을 수 없습니다.');
    }

    playlist.playlistIsdel = 'Y';
    await this.playlistRepository.save(playlist);

    return { message: '플레이리스트가 삭제되었습니다.' };
  }

  private async updatePlaylistDuration(playlistSeq: number) {
    const playlistContents = await this.playlistContentRepository.find({
      where: { playlistSeq, plcIsdel: 'N' },
      relations: ['content'],
    });

    let totalDuration = 0;
    playlistContents.forEach((plc) => {
      const duration = plc.playDuration ?? plc.content.contentDuration ?? 0;
      totalDuration += duration;
    });

    await this.playlistRepository.update(playlistSeq, {
      playlistDuration: totalDuration,
    });
  }
}
