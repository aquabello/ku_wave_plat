import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, Not } from 'typeorm';
import { TbPlayer } from './entities/tb-player.entity';
import { TbPlayerHeartbeatLog } from './entities/tb-player-heartbeat-log.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbPlayList } from '@modules/playlists/entities/tb-play-list.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { ListPlayersDto } from './dto/list-players.dto';
import { RejectPlayerDto } from './dto/reject-player.dto';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { ListHeartbeatLogsDto } from './dto/list-heartbeat-logs.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(TbPlayer)
    private readonly playerRepository: Repository<TbPlayer>,
    @InjectRepository(TbPlayerHeartbeatLog)
    private readonly heartbeatLogRepository: Repository<TbPlayerHeartbeatLog>,
    @InjectRepository(TbBuilding)
    private readonly buildingRepository: Repository<TbBuilding>,
    @InjectRepository(TbSpace)
    private readonly spaceRepository: Repository<TbSpace>,
    @InjectRepository(TbPlayList)
    private readonly playlistRepository: Repository<TbPlayList>,
  ) {}

  async findAll(query: ListPlayersDto) {
    const { page = 1, limit = 20, building_seq, status, approval, search, sort } = query;

    const where: FindOptionsWhere<TbPlayer> = {
      playerIsdel: 'N',
    };

    if (building_seq) {
      where.buildingSeq = building_seq;
    }

    if (status) {
      where.playerStatus = status;
    }

    if (approval) {
      where.playerApproval = approval;
    }

    const queryBuilder = this.playerRepository
      .createQueryBuilder('player')
      .leftJoinAndSelect('player.building', 'building')
      .leftJoinAndSelect('player.space', 'space')
      .leftJoinAndSelect('player.playlist', 'playlist')
      .where('player.player_isdel = :isdel', { isdel: 'N' });

    if (building_seq) {
      queryBuilder.andWhere('player.building_seq = :buildingSeq', { buildingSeq: building_seq });
    }

    if (status) {
      queryBuilder.andWhere('player.player_status = :status', { status });
    }

    if (approval) {
      queryBuilder.andWhere('player.player_approval = :approval', { approval });
    }

    if (search) {
      queryBuilder.andWhere(
        '(player.player_name LIKE :search OR player.player_code LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 정렬 (snake_case를 camelCase로 변환)
    if (sort) {
      const direction = sort.startsWith('-') ? 'DESC' : 'ASC';
      const field = sort.replace(/^-/, '');

      // snake_case 필드명을 camelCase Entity 프로퍼티명으로 변환
      const fieldMap: Record<string, string> = {
        'player_name': 'playerName',
        'player_code': 'playerCode',
        'player_status': 'playerStatus',
        'player_approval': 'playerApproval',
        'player_order': 'playerOrder',
        'last_heartbeat_at': 'lastHeartbeatAt',
        'reg_date': 'regDate',
        'upd_date': 'updDate',
      };

      const propertyName = fieldMap[field] || field;
      queryBuilder.orderBy(`player.${propertyName}`, direction);
    } else {
      queryBuilder.orderBy('player.playerOrder', 'ASC');
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map((player) => ({
        player_seq: player.playerSeq,
        player_name: player.playerName,
        player_code: player.playerCode,
        player_did: player.playerDid,
        player_mac: player.playerMac,
        player_ip: player.playerIp,
        player_port: player.playerPort,
        player_resolution: player.playerResolution,
        player_orientation: player.playerOrientation,
        player_description: player.playerDescription,
        default_volume: player.defaultVolume,
        player_status: player.playerStatus,
        player_approval: player.playerApproval,
        last_heartbeat_at: player.lastHeartbeatAt,
        building: player.building
          ? {
              building_seq: player.building.buildingSeq,
              building_name: player.building.buildingName,
              building_code: player.building.buildingCode,
            }
          : null,
        space: player.space
          ? {
              space_seq: player.space.spaceSeq,
              space_name: player.space.spaceName,
            }
          : null,
        playlist: player.playlist
          ? {
              playlist_seq: player.playlist.playlistSeq,
              playlist_name: player.playlist.playlistName,
            }
          : null,
        reg_date: player.regDate,
        upd_date: player.updDate,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(playerSeq: number) {
    const player = await this.playerRepository.findOne({
      where: { playerSeq, playerIsdel: 'N' },
      relations: ['building', 'space', 'playlist', 'approver'],
    });

    if (!player) {
      throw new NotFoundException('플레이어를 찾을 수 없습니다.');
    }

    return {
      player_seq: player.playerSeq,
      player_name: player.playerName,
      player_code: player.playerCode,
      player_did: player.playerDid,
      player_mac: player.playerMac,
      building_seq: player.buildingSeq,
      space_seq: player.spaceSeq,
      playlist_seq: player.playlistSeq,
      player_ip: player.playerIp,
      player_port: player.playerPort,
      player_api_key: player.playerApiKey,
      player_approval: player.playerApproval,
      approved_by: player.approvedBy,
      approved_at: player.approvedAt,
      reject_reason: player.rejectReason,
      player_status: player.playerStatus,
      last_heartbeat_at: player.lastHeartbeatAt,
      last_content_played: player.lastContentPlayed,
      player_version: player.playerVersion,
      player_resolution: player.playerResolution,
      player_orientation: player.playerOrientation,
      player_description: player.playerDescription,
      default_volume: player.defaultVolume,
      player_order: player.playerOrder,
      player_isdel: player.playerIsdel,
      reg_date: player.regDate,
      upd_date: player.updDate,
      building: player.building
        ? {
            building_seq: player.building.buildingSeq,
            building_name: player.building.buildingName,
            building_code: player.building.buildingCode,
            building_location: player.building.buildingLocation,
          }
        : null,
      space: player.space
        ? {
            space_seq: player.space.spaceSeq,
            space_name: player.space.spaceName,
          }
        : null,
      playlist: player.playlist
        ? {
            playlist_seq: player.playlist.playlistSeq,
            playlist_name: player.playlist.playlistName,
            playlist_code: player.playlist.playlistCode,
          }
        : null,
      approver: player.approver
        ? {
            tu_seq: player.approver.seq,
            tu_name: player.approver.name,
            tu_email: player.approver.email,
          }
        : null,
    };
  }

  async create(createPlayerDto: CreatePlayerDto) {
    // 1. 활성 플레이어 IP 중복 체크 (isdel = 'N')
    const activePlayerWithIp = await this.playerRepository.findOne({
      where: { playerIp: createPlayerDto.player_ip, playerIsdel: 'N' },
    });

    if (activePlayerWithIp) {
      throw new ConflictException('이미 사용 중인 IP 주소입니다.');
    }

    // 2. 삭제된 플레이어 검색 (isdel = 'Y')
    const deletedPlayerWithIp = await this.playerRepository.findOne({
      where: { playerIp: createPlayerDto.player_ip, playerIsdel: 'Y' },
    });

    // 3. 삭제된 플레이어가 있는 경우 → 재활성화
    if (deletedPlayerWithIp) {
      // 건물 존재 확인
      const building = await this.buildingRepository.findOne({
        where: { buildingSeq: createPlayerDto.building_seq, buildingIsdel: 'N' },
      });

      if (!building) {
        throw new NotFoundException('존재하지 않는 건물입니다.');
      }

      // 공간 존재 확인 (선택적)
      if (createPlayerDto.space_seq) {
        const space = await this.spaceRepository.findOne({
          where: { spaceSeq: createPlayerDto.space_seq, spaceIsdel: 'N' },
        });

        if (!space) {
          throw new NotFoundException('존재하지 않는 공간입니다.');
        }
      }

      // 플레이리스트 존재 확인 (선택적)
      if (createPlayerDto.playlist_seq) {
        const playlist = await this.playlistRepository.findOne({
          where: { playlistSeq: createPlayerDto.playlist_seq, playlistIsdel: 'N' },
        });

        if (!playlist) {
          throw new NotFoundException('존재하지 않는 플레이리스트입니다.');
        }
      }

      // 플레이어 코드 처리
      let playerCode = createPlayerDto.player_code;

      if (!playerCode) {
        // 자동 생성: PLAYER-{timestamp}-{random6}
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        playerCode = `PLAYER-${timestamp}-${random}`;
      }

      // 플레이어 코드 중복 확인 (자기 자신 제외)
      const existingByCode = await this.playerRepository.findOne({
        where: { playerCode: playerCode, playerSeq: Not(deletedPlayerWithIp.playerSeq) },
      });

      if (existingByCode) {
        throw new ConflictException('이미 사용 중인 플레이어 코드입니다.');
      }

      // Device ID 중복 확인 (자기 자신 제외)
      if (createPlayerDto.player_did) {
        const existingByDid = await this.playerRepository.findOne({
          where: { playerDid: createPlayerDto.player_did, playerSeq: Not(deletedPlayerWithIp.playerSeq) },
        });

        if (existingByDid) {
          throw new ConflictException('이미 등록된 Device ID입니다.');
        }
      }

      // API Key 재생성 (보안)
      const apiKey = `player_${randomUUID().replace(/-/g, '')}`;

      // 모든 필드 업데이트
      Object.assign(deletedPlayerWithIp, {
        playerName: createPlayerDto.player_name,
        playerCode: playerCode,
        playerDid: createPlayerDto.player_did,
        playerMac: createPlayerDto.player_mac,
        buildingSeq: createPlayerDto.building_seq,
        spaceSeq: createPlayerDto.space_seq,
        playlistSeq: createPlayerDto.playlist_seq,
        playerIp: createPlayerDto.player_ip,
        playerPort: createPlayerDto.player_port || 9090,
        playerResolution: createPlayerDto.player_resolution,
        playerOrientation: createPlayerDto.player_orientation || 'LANDSCAPE',
        playerDescription: createPlayerDto.player_description,
        defaultVolume: 50,
        playerApiKey: apiKey,
        playerApproval: 'PENDING',
        playerStatus: 'OFFLINE',
        playerIsdel: 'N',
        approvedBy: null,
        approvedAt: null,
        rejectReason: null,
      });

      const savedPlayer = await this.playerRepository.save(deletedPlayerWithIp);

      return {
        player_seq: savedPlayer.playerSeq,
        player_code: savedPlayer.playerCode,
        player_api_key: savedPlayer.playerApiKey,
        player_approval: savedPlayer.playerApproval,
        reg_date: savedPlayer.regDate,
        message: '삭제된 플레이어가 재등록되었습니다.',
      };
    }

    // 3-2. 삭제된 플레이어가 없는 경우 → 신규 생성
    // 건물 존재 확인
    const building = await this.buildingRepository.findOne({
      where: { buildingSeq: createPlayerDto.building_seq, buildingIsdel: 'N' },
    });

    if (!building) {
      throw new NotFoundException('존재하지 않는 건물입니다.');
    }

    // 공간 존재 확인 (선택적)
    if (createPlayerDto.space_seq) {
      const space = await this.spaceRepository.findOne({
        where: { spaceSeq: createPlayerDto.space_seq, spaceIsdel: 'N' },
      });

      if (!space) {
        throw new NotFoundException('존재하지 않는 공간입니다.');
      }
    }

    // 플레이리스트 존재 확인 (선택적)
    if (createPlayerDto.playlist_seq) {
      const playlist = await this.playlistRepository.findOne({
        where: { playlistSeq: createPlayerDto.playlist_seq, playlistIsdel: 'N' },
      });

      if (!playlist) {
        throw new NotFoundException('존재하지 않는 플레이리스트입니다.');
      }
    }

    // 플레이어 코드 자동 생성 또는 사용자 입력 사용
    let playerCode = createPlayerDto.player_code;

    if (!playerCode) {
      // 자동 생성: PLAYER-{timestamp}-{random6}
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      playerCode = `PLAYER-${timestamp}-${random}`;
    }

    // 플레이어 코드 중복 확인
    const existingByCode = await this.playerRepository.findOne({
      where: { playerCode: playerCode },
    });

    if (existingByCode) {
      throw new ConflictException('이미 사용 중인 플레이어 코드입니다.');
    }

    // Device ID 중복 확인 (제공된 경우)
    if (createPlayerDto.player_did) {
      const existingByDid = await this.playerRepository.findOne({
        where: { playerDid: createPlayerDto.player_did },
      });

      if (existingByDid) {
        throw new ConflictException('이미 등록된 Device ID입니다.');
      }
    }

    // API Key 생성
    const apiKey = `player_${randomUUID().replace(/-/g, '')}`;

    const player = this.playerRepository.create({
      playerName: createPlayerDto.player_name,
      playerCode: playerCode,
      playerDid: createPlayerDto.player_did,
      playerMac: createPlayerDto.player_mac,
      buildingSeq: createPlayerDto.building_seq,
      spaceSeq: createPlayerDto.space_seq,
      playlistSeq: createPlayerDto.playlist_seq,
      playerIp: createPlayerDto.player_ip,
      playerPort: createPlayerDto.player_port || 9090,
      playerResolution: createPlayerDto.player_resolution,
      playerOrientation: createPlayerDto.player_orientation || 'LANDSCAPE',
      playerDescription: createPlayerDto.player_description,
      defaultVolume: 50,
      playerApiKey: apiKey,
      playerApproval: 'PENDING',
      playerStatus: 'OFFLINE',
    });

    const savedPlayer = await this.playerRepository.save(player);

    return {
      player_seq: savedPlayer.playerSeq,
      player_code: savedPlayer.playerCode,
      player_api_key: savedPlayer.playerApiKey,
      player_approval: savedPlayer.playerApproval,
      reg_date: savedPlayer.regDate,
    };
  }

  async update(playerSeq: number, updatePlayerDto: UpdatePlayerDto) {
    const player = await this.playerRepository.findOne({
      where: { playerSeq, playerIsdel: 'N' },
    });

    if (!player) {
      throw new NotFoundException('플레이어를 찾을 수 없습니다.');
    }

    // 건물 존재 확인
    if (updatePlayerDto.building_seq) {
      const building = await this.buildingRepository.findOne({
        where: { buildingSeq: updatePlayerDto.building_seq, buildingIsdel: 'N' },
      });

      if (!building) {
        throw new NotFoundException('존재하지 않는 건물입니다.');
      }
    }

    // 공간 존재 확인
    if (updatePlayerDto.space_seq) {
      const space = await this.spaceRepository.findOne({
        where: { spaceSeq: updatePlayerDto.space_seq, spaceIsdel: 'N' },
      });

      if (!space) {
        throw new NotFoundException('존재하지 않는 공간입니다.');
      }
    }

    // 플레이리스트 존재 확인
    if (updatePlayerDto.playlist_seq) {
      const playlist = await this.playlistRepository.findOne({
        where: { playlistSeq: updatePlayerDto.playlist_seq, playlistIsdel: 'N' },
      });

      if (!playlist) {
        throw new NotFoundException('존재하지 않는 플레이리스트입니다.');
      }
    }

    // Device ID 중복 확인 (변경 시)
    if (updatePlayerDto.player_did && updatePlayerDto.player_did !== player.playerDid) {
      const existingByDid = await this.playerRepository.findOne({
        where: { playerDid: updatePlayerDto.player_did, playerSeq: Not(playerSeq) },
      });

      if (existingByDid) {
        throw new ConflictException('이미 등록된 Device ID입니다.');
      }
    }

    // 업데이트
    Object.assign(player, {
      playerName: updatePlayerDto.player_name ?? player.playerName,
      playerDid: updatePlayerDto.player_did ?? player.playerDid,
      playerMac: updatePlayerDto.player_mac ?? player.playerMac,
      buildingSeq: updatePlayerDto.building_seq ?? player.buildingSeq,
      spaceSeq: updatePlayerDto.space_seq ?? player.spaceSeq,
      playlistSeq: updatePlayerDto.playlist_seq ?? player.playlistSeq,
      playerIp: updatePlayerDto.player_ip ?? player.playerIp,
      playerPort: updatePlayerDto.player_port ?? player.playerPort,
      playerResolution: updatePlayerDto.player_resolution ?? player.playerResolution,
      playerOrientation: updatePlayerDto.player_orientation ?? player.playerOrientation,
      playerDescription: updatePlayerDto.player_description ?? player.playerDescription,
      playerOrder: updatePlayerDto.player_order ?? player.playerOrder,
    });

    const savedPlayer = await this.playerRepository.save(player);

    return {
      player_seq: savedPlayer.playerSeq,
      upd_date: savedPlayer.updDate,
    };
  }

  async remove(playerSeq: number) {
    const player = await this.playerRepository.findOne({
      where: { playerSeq, playerIsdel: 'N' },
    });

    if (!player) {
      throw new NotFoundException('플레이어를 찾을 수 없습니다.');
    }

    player.playerIsdel = 'Y';
    await this.playerRepository.save(player);

    return { message: '플레이어가 삭제되었습니다.' };
  }

  async approve(playerSeq: number, userId: number) {
    const player = await this.playerRepository.findOne({
      where: { playerSeq, playerIsdel: 'N' },
    });

    if (!player) {
      throw new NotFoundException('플레이어를 찾을 수 없습니다.');
    }

    if (player.playerApproval === 'APPROVED') {
      throw new BadRequestException('이미 승인된 플레이어입니다.');
    }

    player.playerApproval = 'APPROVED';
    player.approvedBy = userId;
    player.approvedAt = new Date();
    player.rejectReason = null;

    const savedPlayer = await this.playerRepository.save(player);

    return {
      player_seq: savedPlayer.playerSeq,
      player_approval: savedPlayer.playerApproval,
      approved_by: savedPlayer.approvedBy,
      approved_at: savedPlayer.approvedAt,
    };
  }

  async reject(playerSeq: number, rejectDto: RejectPlayerDto, userId: number) {
    const player = await this.playerRepository.findOne({
      where: { playerSeq, playerIsdel: 'N' },
    });

    if (!player) {
      throw new NotFoundException('플레이어를 찾을 수 없습니다.');
    }

    player.playerApproval = 'REJECTED';
    player.approvedBy = userId;
    player.approvedAt = new Date();
    player.rejectReason = rejectDto.reject_reason;

    const savedPlayer = await this.playerRepository.save(player);

    return {
      player_seq: savedPlayer.playerSeq,
      player_approval: savedPlayer.playerApproval,
      approved_by: savedPlayer.approvedBy,
      approved_at: savedPlayer.approvedAt,
      reject_reason: savedPlayer.rejectReason,
    };
  }

  async heartbeat(heartbeatDto: HeartbeatDto, requestIp: string) {
    const player = await this.playerRepository.findOne({
      where: { playerSeq: heartbeatDto.player_seq, playerIsdel: 'N' },
    });

    if (!player) {
      throw new NotFoundException('플레이어를 찾을 수 없습니다.');
    }

    // Heartbeat 로그 저장
    const log = this.heartbeatLogRepository.create({
      playerSeq: heartbeatDto.player_seq,
      playerIp: requestIp,
      playerVersion: heartbeatDto.player_version,
      cpuUsage: heartbeatDto.cpu_usage,
      memoryUsage: heartbeatDto.memory_usage,
      diskUsage: heartbeatDto.disk_usage,
      currentPlaylist: heartbeatDto.current_playlist,
      currentContent: heartbeatDto.current_content,
      errorMessage: heartbeatDto.error_message,
    });

    await this.heartbeatLogRepository.save(log);

    // 플레이어 상태 업데이트
    const previousPlaylistSeq = player.playlistSeq;
    player.lastHeartbeatAt = new Date();
    player.playerStatus = heartbeatDto.error_message ? 'ERROR' : 'ONLINE';

    if (heartbeatDto.player_version) {
      player.playerVersion = heartbeatDto.player_version;
    }

    if (heartbeatDto.current_content) {
      player.lastContentPlayed = heartbeatDto.current_content;
    }

    await this.playerRepository.save(player);

    // 플레이리스트 변경 여부 확인
    const shouldUpdatePlaylist = previousPlaylistSeq !== player.playlistSeq;

    return {
      player_seq: player.playerSeq,
      player_status: player.playerStatus,
      last_heartbeat_at: player.lastHeartbeatAt,
      should_update_playlist: shouldUpdatePlaylist,
      new_playlist_seq: shouldUpdatePlaylist ? player.playlistSeq : undefined,
    };
  }

  async findHeartbeatLogs(playerSeq: number, query: ListHeartbeatLogsDto) {
    const { page = 1, limit = 20, from, to } = query;

    // 플레이어 존재 확인
    const player = await this.playerRepository.findOne({
      where: { playerSeq, playerIsdel: 'N' },
    });

    if (!player) {
      throw new NotFoundException('플레이어를 찾을 수 없습니다.');
    }

    const queryBuilder = this.heartbeatLogRepository
      .createQueryBuilder('log')
      .where('log.player_seq = :playerSeq', { playerSeq });

    if (from) {
      queryBuilder.andWhere('log.heartbeat_at >= :from', { from });
    }

    if (to) {
      queryBuilder.andWhere('log.heartbeat_at <= :to', { to });
    }

    queryBuilder.orderBy('log.heartbeatAt', 'DESC');

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map((log) => ({
        heartbeat_seq: log.heartbeatSeq,
        player_seq: log.playerSeq,
        heartbeat_at: log.heartbeatAt,
        player_ip: log.playerIp,
        player_version: log.playerVersion,
        cpu_usage: log.cpuUsage,
        memory_usage: log.memoryUsage,
        disk_usage: log.diskUsage,
        current_playlist: log.currentPlaylist,
        current_content: log.currentContent,
        error_message: log.errorMessage,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
