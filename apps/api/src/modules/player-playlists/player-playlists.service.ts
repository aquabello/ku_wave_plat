import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbPlayerPlaylist } from './entities/tb-player-playlist.entity';
import { TbGroupPlaylist } from './entities/tb-group-playlist.entity';
import { TbPlayer } from '@modules/players/entities/tb-player.entity';
import { TbPlayList } from '@modules/playlists/entities/tb-play-list.entity';
import { TbPlayerGroup } from '@modules/player-groups/entities/tb-player-group.entity';
import { TbPlayerGroupMember } from '@modules/player-groups/entities/tb-player-group-member.entity';
import { AssignPlayerPlaylistDto } from './dto/assign-player-playlist.dto';
import { UpdatePlayerPlaylistDto } from './dto/update-player-playlist.dto';
import { AssignGroupPlaylistDto } from './dto/assign-group-playlist.dto';
import { UpdateGroupPlaylistDto } from './dto/update-group-playlist.dto';

@Injectable()
export class PlayerPlaylistsService {
  constructor(
    @InjectRepository(TbPlayerPlaylist)
    private playerPlaylistRepo: Repository<TbPlayerPlaylist>,
    @InjectRepository(TbGroupPlaylist)
    private groupPlaylistRepo: Repository<TbGroupPlaylist>,
    @InjectRepository(TbPlayer)
    private playerRepo: Repository<TbPlayer>,
    @InjectRepository(TbPlayList)
    private playlistRepo: Repository<TbPlayList>,
    @InjectRepository(TbPlayerGroup)
    private groupRepo: Repository<TbPlayerGroup>,
    @InjectRepository(TbPlayerGroupMember)
    private groupMemberRepo: Repository<TbPlayerGroupMember>,
  ) {}

  // Player Playlist APIs
  async getPlayerPlaylists(playerSeq: number) {
    const player = await this.playerRepo.findOne({
      where: { playerSeq, playerIsdel: 'N' },
    });

    if (!player) {
      throw new NotFoundException('플레이어를 찾을 수 없습니다.');
    }

    const playlists = await this.playerPlaylistRepo.find({
      where: { playerSeq, ppIsdel: 'N' },
      relations: ['playlist'],
      order: { ppPriority: 'DESC', regDate: 'DESC' },
    });

    return playlists.map((pp) => ({
      pp_seq: pp.ppSeq,
      playlist_seq: pp.playlistSeq,
      playlist_name: pp.playlist?.playlistName || null,
      playlist_type: pp.playlist?.playlistType || null,
      pp_priority: pp.ppPriority,
      schedule_start_time: pp.scheduleStartTime,
      schedule_end_time: pp.scheduleEndTime,
      schedule_days: pp.scheduleDays,
      pp_status: pp.ppStatus,
      reg_date: pp.regDate,
    }));
  }

  async assignPlaylistToPlayer(playerSeq: number, dto: AssignPlayerPlaylistDto) {
    const player = await this.playerRepo.findOne({
      where: { playerSeq, playerIsdel: 'N' },
    });

    if (!player) {
      throw new NotFoundException('플레이어를 찾을 수 없습니다.');
    }

    const playlist = await this.playlistRepo.findOne({
      where: { playlistSeq: dto.playlist_seq, playlistIsdel: 'N' },
    });

    if (!playlist) {
      throw new NotFoundException('플레이리스트를 찾을 수 없습니다.');
    }

    // 중복 확인
    const existing = await this.playerPlaylistRepo.findOne({
      where: { playerSeq, playlistSeq: dto.playlist_seq, ppIsdel: 'N' },
    });

    if (existing) {
      throw new BadRequestException('이미 할당된 플레이리스트입니다.');
    }

    const assignment = this.playerPlaylistRepo.create({
      playerSeq,
      playlistSeq: dto.playlist_seq,
      ppPriority: dto.pp_priority ?? 0,
      scheduleStartTime: dto.schedule_start_time || null,
      scheduleEndTime: dto.schedule_end_time || null,
      scheduleDays: dto.schedule_days || null,
      ppStatus: dto.pp_status || 'ACTIVE',
    });

    const saved = await this.playerPlaylistRepo.save(assignment);

    return {
      pp_seq: saved.ppSeq,
      reg_date: saved.regDate,
    };
  }

  async updatePlayerPlaylist(playerSeq: number, ppSeq: number, dto: UpdatePlayerPlaylistDto) {
    const assignment = await this.playerPlaylistRepo.findOne({
      where: { ppSeq, playerSeq, ppIsdel: 'N' },
    });

    if (!assignment) {
      throw new NotFoundException('플레이리스트 할당을 찾을 수 없습니다.');
    }

    Object.assign(assignment, {
      ppPriority: dto.pp_priority ?? assignment.ppPriority,
      scheduleStartTime: dto.schedule_start_time !== undefined ? dto.schedule_start_time : assignment.scheduleStartTime,
      scheduleEndTime: dto.schedule_end_time !== undefined ? dto.schedule_end_time : assignment.scheduleEndTime,
      scheduleDays: dto.schedule_days !== undefined ? dto.schedule_days : assignment.scheduleDays,
      ppStatus: dto.pp_status ?? assignment.ppStatus,
    });

    const updated = await this.playerPlaylistRepo.save(assignment);

    return {
      pp_seq: updated.ppSeq,
      upd_date: updated.updDate,
    };
  }

  async removePlayerPlaylist(playerSeq: number, ppSeq: number) {
    const assignment = await this.playerPlaylistRepo.findOne({
      where: { ppSeq, playerSeq, ppIsdel: 'N' },
    });

    if (!assignment) {
      throw new NotFoundException('플레이리스트 할당을 찾을 수 없습니다.');
    }

    assignment.ppIsdel = 'Y';
    await this.playerPlaylistRepo.save(assignment);

    return { message: '플레이리스트 할당이 해제되었습니다.' };
  }

  // Group Playlist APIs
  async assignPlaylistToGroup(groupSeq: number, dto: AssignGroupPlaylistDto) {
    const group = await this.groupRepo.findOne({
      where: { groupSeq, groupIsdel: 'N' },
    });

    if (!group) {
      throw new NotFoundException('플레이어 그룹을 찾을 수 없습니다.');
    }

    const playlist = await this.playlistRepo.findOne({
      where: { playlistSeq: dto.playlist_seq, playlistIsdel: 'N' },
    });

    if (!playlist) {
      throw new NotFoundException('플레이리스트를 찾을 수 없습니다.');
    }

    // 중복 확인
    const existing = await this.groupPlaylistRepo.findOne({
      where: { groupSeq, playlistSeq: dto.playlist_seq, gpIsdel: 'N' },
    });

    if (existing) {
      throw new BadRequestException('이미 할당된 플레이리스트입니다.');
    }

    const assignment = this.groupPlaylistRepo.create({
      groupSeq,
      playlistSeq: dto.playlist_seq,
      gpPriority: dto.gp_priority ?? 0,
      scheduleStartTime: dto.schedule_start_time || null,
      scheduleEndTime: dto.schedule_end_time || null,
      scheduleDays: dto.schedule_days || null,
      gpStatus: dto.gp_status || 'ACTIVE',
    });

    const saved = await this.groupPlaylistRepo.save(assignment);

    // 영향받은 플레이어 수 계산
    const members = await this.groupMemberRepo.count({
      where: { groupSeq, pgmIsdel: 'N' },
    });

    return {
      gp_seq: saved.gpSeq,
      affected_players: members,
      reg_date: saved.regDate,
    };
  }

  async updateGroupPlaylist(groupSeq: number, gpSeq: number, dto: UpdateGroupPlaylistDto) {
    const assignment = await this.groupPlaylistRepo.findOne({
      where: { gpSeq, groupSeq, gpIsdel: 'N' },
    });

    if (!assignment) {
      throw new NotFoundException('그룹 플레이리스트 할당을 찾을 수 없습니다.');
    }

    Object.assign(assignment, {
      gpPriority: dto.gp_priority ?? assignment.gpPriority,
      scheduleStartTime: dto.schedule_start_time !== undefined ? dto.schedule_start_time : assignment.scheduleStartTime,
      scheduleEndTime: dto.schedule_end_time !== undefined ? dto.schedule_end_time : assignment.scheduleEndTime,
      scheduleDays: dto.schedule_days !== undefined ? dto.schedule_days : assignment.scheduleDays,
      gpStatus: dto.gp_status ?? assignment.gpStatus,
    });

    const updated = await this.groupPlaylistRepo.save(assignment);

    return {
      gp_seq: updated.gpSeq,
      upd_date: updated.updDate,
    };
  }

  async removeGroupPlaylist(groupSeq: number, gpSeq: number) {
    const assignment = await this.groupPlaylistRepo.findOne({
      where: { gpSeq, groupSeq, gpIsdel: 'N' },
    });

    if (!assignment) {
      throw new NotFoundException('그룹 플레이리스트 할당을 찾을 수 없습니다.');
    }

    assignment.gpIsdel = 'Y';
    await this.groupPlaylistRepo.save(assignment);

    return { message: '그룹 플레이리스트 할당이 해제되었습니다.' };
  }
}
