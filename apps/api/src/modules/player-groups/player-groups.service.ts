import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbPlayerGroup } from './entities/tb-player-group.entity';
import { TbPlayerGroupMember } from './entities/tb-player-group-member.entity';
import { TbPlayer } from '@modules/players/entities/tb-player.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';
import { CreatePlayerGroupDto } from './dto/create-player-group.dto';
import { UpdatePlayerGroupDto } from './dto/update-player-group.dto';
import { AddMembersDto } from './dto/add-members.dto';

@Injectable()
export class PlayerGroupsService {
  constructor(
    @InjectRepository(TbPlayerGroup)
    private playerGroupRepo: Repository<TbPlayerGroup>,
    @InjectRepository(TbPlayerGroupMember)
    private memberRepo: Repository<TbPlayerGroupMember>,
    @InjectRepository(TbPlayer)
    private playerRepo: Repository<TbPlayer>,
    @InjectRepository(TbBuilding)
    private buildingRepo: Repository<TbBuilding>,
  ) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    building_seq?: number;
    search?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.playerGroupRepo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.building', 'building')
      .leftJoin('g.members', 'members', 'members.pgm_isdel = :isdel', { isdel: 'N' })
      .leftJoin('g.playlists', 'playlists', 'playlists.gp_isdel = :isdel', { isdel: 'N' })
      .where('g.group_isdel = :isdel', { isdel: 'N' });

    if (query.building_seq) {
      qb.andWhere('g.building_seq = :buildingSeq', { buildingSeq: query.building_seq });
    }

    if (query.search) {
      qb.andWhere('(g.group_name LIKE :search OR g.group_code LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.select([
      'g.groupSeq',
      'g.groupName',
      'g.groupCode',
      'g.buildingSeq',
      'g.groupDescription',
      'g.regDate',
      'g.updDate',
      'building.buildingSeq',
      'building.buildingName',
    ])
      .addSelect('COUNT(DISTINCT members.pgmSeq)', 'memberCount')
      .addSelect('COUNT(DISTINCT playlists.gpSeq)', 'playlistCount')
      .groupBy('g.groupSeq')
      .addGroupBy('building.buildingSeq')
      .orderBy('g.groupOrder', 'ASC')
      .addOrderBy('g.regDate', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item: any) => ({
        group_seq: item.groupSeq,
        group_name: item.groupName,
        group_code: item.groupCode,
        building_seq: item.buildingSeq,
        building_name: item.building?.buildingName || null,
        group_description: item.groupDescription,
        member_count: parseInt(item.memberCount) || 0,
        playlist_count: parseInt(item.playlistCount) || 0,
        reg_date: item.regDate,
        upd_date: item.updDate,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(groupSeq: number) {
    const group = await this.playerGroupRepo.findOne({
      where: { groupSeq, groupIsdel: 'N' },
      relations: ['building', 'members', 'members.player', 'playlists', 'playlists.playlist'],
    });

    if (!group) {
      throw new NotFoundException('플레이어 그룹을 찾을 수 없습니다.');
    }

    return {
      group_seq: group.groupSeq,
      group_name: group.groupName,
      group_code: group.groupCode,
      building_seq: group.buildingSeq,
      group_description: group.groupDescription,
      group_order: group.groupOrder,
      reg_date: group.regDate,
      upd_date: group.updDate,
      members: group.members
        .filter((m) => m.pgmIsdel === 'N')
        .map((m) => ({
          pgm_seq: m.pgmSeq,
          player_seq: m.playerSeq,
          player_name: m.player?.playerName || null,
          player_code: m.player?.playerCode || null,
          player_status: m.player?.playerStatus || null,
          reg_date: m.regDate,
        })),
      playlists: group.playlists
        .filter((p) => p.gpIsdel === 'N')
        .map((p) => ({
          gp_seq: p.gpSeq,
          playlist_seq: p.playlistSeq,
          playlist_name: p.playlist?.playlistName || null,
          gp_priority: p.gpPriority,
          schedule_start_time: p.scheduleStartTime,
          schedule_end_time: p.scheduleEndTime,
          schedule_days: p.scheduleDays,
          gp_status: p.gpStatus,
        })),
    };
  }

  async create(dto: CreatePlayerGroupDto) {
    // 건물 존재 확인
    if (dto.building_seq) {
      const building = await this.buildingRepo.findOne({
        where: { buildingSeq: dto.building_seq, buildingIsdel: 'N' },
      });
      if (!building) {
        throw new NotFoundException('존재하지 않는 건물입니다.');
      }
    }

    // 그룹 코드 중복 확인
    const existing = await this.playerGroupRepo.findOne({
      where: { groupCode: dto.group_code, groupIsdel: 'N' },
    });
    if (existing) {
      throw new BadRequestException('이미 사용 중인 그룹 코드입니다.');
    }

    const group = this.playerGroupRepo.create({
      groupName: dto.group_name,
      groupCode: dto.group_code,
      buildingSeq: dto.building_seq || null,
      groupDescription: dto.group_description || null,
    });

    const saved = await this.playerGroupRepo.save(group);

    // 초기 멤버 추가
    let memberCount = 0;
    if (dto.member_player_seqs && dto.member_player_seqs.length > 0) {
      await this.addMembers(saved.groupSeq, { player_seqs: dto.member_player_seqs });
      memberCount = dto.member_player_seqs.length;
    }

    return {
      group_seq: saved.groupSeq,
      group_code: saved.groupCode,
      member_count: memberCount,
      reg_date: saved.regDate,
    };
  }

  async update(groupSeq: number, dto: UpdatePlayerGroupDto) {
    const group = await this.playerGroupRepo.findOne({
      where: { groupSeq, groupIsdel: 'N' },
    });

    if (!group) {
      throw new NotFoundException('플레이어 그룹을 찾을 수 없습니다.');
    }

    // 건물 존재 확인
    if (dto.building_seq) {
      const building = await this.buildingRepo.findOne({
        where: { buildingSeq: dto.building_seq, buildingIsdel: 'N' },
      });
      if (!building) {
        throw new NotFoundException('존재하지 않는 건물입니다.');
      }
    }

    Object.assign(group, {
      groupName: dto.group_name ?? group.groupName,
      buildingSeq: dto.building_seq !== undefined ? dto.building_seq : group.buildingSeq,
      groupDescription: dto.group_description !== undefined ? dto.group_description : group.groupDescription,
      groupOrder: dto.group_order ?? group.groupOrder,
    });

    const updated = await this.playerGroupRepo.save(group);

    return {
      group_seq: updated.groupSeq,
      upd_date: updated.updDate,
    };
  }

  async remove(groupSeq: number) {
    const group = await this.playerGroupRepo.findOne({
      where: { groupSeq, groupIsdel: 'N' },
    });

    if (!group) {
      throw new NotFoundException('플레이어 그룹을 찾을 수 없습니다.');
    }

    group.groupIsdel = 'Y';
    await this.playerGroupRepo.save(group);

    return { message: '플레이어 그룹이 삭제되었습니다.' };
  }

  async addMembers(groupSeq: number, dto: AddMembersDto) {
    const group = await this.playerGroupRepo.findOne({
      where: { groupSeq, groupIsdel: 'N' },
    });

    if (!group) {
      throw new NotFoundException('플레이어 그룹을 찾을 수 없습니다.');
    }

    // 플레이어 존재 확인
    const players = await this.playerRepo.find({
      where: dto.player_seqs.map((seq) => ({ playerSeq: seq, playerIsdel: 'N' })),
    });

    if (players.length !== dto.player_seqs.length) {
      throw new BadRequestException('일부 플레이어를 찾을 수 없습니다.');
    }

    // 이미 추가된 멤버 확인
    const existingMembers = await this.memberRepo.find({
      where: {
        groupSeq,
        pgmIsdel: 'N',
      },
    });

    const existingPlayerSeqs = new Set(existingMembers.map((m) => m.playerSeq));
    const newPlayerSeqs = dto.player_seqs.filter((seq) => !existingPlayerSeqs.has(seq));

    if (newPlayerSeqs.length === 0) {
      throw new BadRequestException('모든 플레이어가 이미 그룹에 속해 있습니다.');
    }

    const members = newPlayerSeqs.map((playerSeq) =>
      this.memberRepo.create({
        groupSeq,
        playerSeq,
      }),
    );

    await this.memberRepo.save(members);

    const totalCount = existingMembers.length + newPlayerSeqs.length;

    return {
      added_count: newPlayerSeqs.length,
      member_count: totalCount,
    };
  }

  async removeMember(groupSeq: number, playerSeq: number) {
    const member = await this.memberRepo.findOne({
      where: { groupSeq, playerSeq, pgmIsdel: 'N' },
    });

    if (!member) {
      throw new NotFoundException('그룹 멤버를 찾을 수 없습니다.');
    }

    member.pgmIsdel = 'Y';
    await this.memberRepo.save(member);

    return { message: '그룹 멤버가 삭제되었습니다.' };
  }
}
