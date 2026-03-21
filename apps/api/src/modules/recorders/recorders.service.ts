import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TbRecorder } from './entities/recorder.entity';
// TbRecorderUser removed — 선점 방식으로 전환
import { TbRecorderPreset } from './entities/recorder-preset.entity';
import { TbRecorderLog } from './entities/recorder-log.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { CreateRecorderDto } from './dto/create-recorder.dto';
import { UpdateRecorderDto } from './dto/update-recorder.dto';
import { ListRecordersDto } from './dto/list-recorders.dto';
import { CreatePresetDto } from './dto/create-preset.dto';
import { UpdatePresetDto } from './dto/update-preset.dto';
import { QueryLogsDto } from './dto/query-logs.dto';
import { RecorderProtocol } from './enums/recorder-protocol.enum';

@Injectable()
export class RecordersService {
  constructor(
    @InjectRepository(TbRecorder)
    private readonly recorderRepo: Repository<TbRecorder>,
    @InjectRepository(TbRecorderPreset)
    private readonly presetRepo: Repository<TbRecorderPreset>,
    @InjectRepository(TbRecorderLog)
    private readonly logRepo: Repository<TbRecorderLog>,
    @InjectRepository(TbSpace)
    private readonly spaceRepo: Repository<TbSpace>,
    private readonly dataSource: DataSource,
  ) {}

  // ──────────────── 녹화기 CRUD ────────────────

  async findAll(query: ListRecordersDto) {
    const { page = 1, limit = 10, buildingSeq, search, status } = query;

    const qb = this.recorderRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.space', 'space')
      .leftJoin('space.building', 'building')
      .addSelect(['building.buildingSeq', 'building.buildingName'])
      .leftJoin('r.currentUser', 'cu')
      .addSelect(['cu.seq', 'cu.name'])
      .where('r.recorder_isdel = :isdel', { isdel: 'N' });

    if (buildingSeq) {
      qb.andWhere('space.building_seq = :buildingSeq', { buildingSeq });
    }
    if (search) {
      qb.andWhere(
        '(r.recorder_name LIKE :search OR r.recorder_ip LIKE :search OR building.building_name LIKE :search OR space.space_name LIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (status) {
      qb.andWhere('r.recorder_status = :status', { status });
    }

    qb.orderBy('r.recorderOrder', 'ASC')
      .addOrderBy('r.recorderName', 'ASC');

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const result = items.map((r, idx) => ({
      no: total - (page - 1) * limit - idx,
      recorderSeq: r.recorderSeq,
      recorderName: r.recorderName,
      recorderIp: r.recorderIp,
      recorderPort: r.recorderPort,
      recorderProtocol: r.recorderProtocol,
      recorderModel: r.recorderModel,
      recorderStatus: r.recorderStatus,
      lastHealthCheck: r.lastHealthCheck,
      buildingName: r.space?.building?.buildingName ?? null,
      spaceName: r.space?.spaceName ?? null,
      spaceFloor: r.space?.spaceFloor ?? null,
      currentUserName: r.currentUser?.name ?? null,
    }));

    return {
      items: result,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(recorderSeq: number) {
    const recorder = await this.recorderRepo.findOne({
      where: { recorderSeq, recorderIsdel: 'N' },
      relations: ['space', 'space.building', 'currentUser'],
    });

    if (!recorder) {
      throw new NotFoundException('해당 녹화기를 찾을 수 없습니다.');
    }

    const presets = await this.presetRepo.find({
      where: { recorderSeq, presetIsdel: 'N' },
      order: { presetOrder: 'ASC' },
    });

    return {
      recorderSeq: recorder.recorderSeq,
      recorderName: recorder.recorderName,
      recorderIp: recorder.recorderIp,
      recorderPort: recorder.recorderPort,
      recorderProtocol: recorder.recorderProtocol,
      recorderUsername: recorder.recorderUsername,
      recorderModel: recorder.recorderModel,
      recorderStatus: recorder.recorderStatus,
      lastHealthCheck: recorder.lastHealthCheck,
      recorderOrder: recorder.recorderOrder,
      buildingSeq: recorder.space?.building?.buildingSeq ?? null,
      buildingName: recorder.space?.building?.buildingName ?? null,
      spaceSeq: recorder.spaceSeq,
      spaceName: recorder.space?.spaceName ?? null,
      spaceFloor: recorder.space?.spaceFloor ?? null,
      currentUser: recorder.currentUser
        ? { tuSeq: recorder.currentUser.seq, tuName: recorder.currentUser.name }
        : null,
      presets: presets.map((p) => ({
        recPresetSeq: p.recPresetSeq,
        presetName: p.presetName,
        presetNumber: p.presetNumber,
        panValue: p.panValue,
        tiltValue: p.tiltValue,
        zoomValue: p.zoomValue,
        presetOrder: p.presetOrder,
      })),
      regDate: recorder.regDate,
      updDate: recorder.updDate,
    };
  }

  async create(dto: CreateRecorderDto) {
    // 공간 존재 확인
    const space = await this.spaceRepo.findOne({
      where: { spaceSeq: dto.spaceSeq },
    });
    if (!space) {
      throw new NotFoundException('해당 공간을 찾을 수 없습니다.');
    }

    // 공간당 녹화기 1:1 제약 확인
    const existing = await this.recorderRepo.findOne({
      where: { spaceSeq: dto.spaceSeq, recorderIsdel: 'N' },
    });
    if (existing) {
      throw new ConflictException('해당 공간에 이미 녹화기가 등록되어 있습니다.');
    }

    const saved = await this.dataSource.transaction(async (manager) => {
      const recorder = manager.create(TbRecorder, {
        spaceSeq: dto.spaceSeq,
        recorderName: dto.recorderName,
        recorderIp: dto.recorderIp,
        recorderPort: dto.recorderPort ?? 80,
        recorderProtocol: dto.recorderProtocol ?? RecorderProtocol.HTTP,
        recorderUsername: dto.recorderUsername,
        recorderPassword: dto.recorderPassword,
        recorderModel: dto.recorderModel,
        recorderOrder: dto.recorderOrder ?? 0,
      });

      const savedRecorder = await manager.save(TbRecorder, recorder);
      return savedRecorder;
    });

    return this.findOne(saved.recorderSeq);
  }

  async update(recorderSeq: number, dto: UpdateRecorderDto) {
    const recorder = await this.recorderRepo.findOne({
      where: { recorderSeq, recorderIsdel: 'N' },
    });
    if (!recorder) {
      throw new NotFoundException('해당 녹화기를 찾을 수 없습니다.');
    }

    await this.dataSource.transaction(async (manager) => {
      // 녹화기 정보 업데이트
      const updateData: Partial<TbRecorder> = {};
      if (dto.recorderName !== undefined) updateData.recorderName = dto.recorderName;
      if (dto.recorderIp !== undefined) updateData.recorderIp = dto.recorderIp;
      if (dto.recorderPort !== undefined) updateData.recorderPort = dto.recorderPort;
      if (dto.recorderProtocol !== undefined) updateData.recorderProtocol = dto.recorderProtocol;
      if (dto.recorderUsername !== undefined) updateData.recorderUsername = dto.recorderUsername;
      if (dto.recorderPassword !== undefined && dto.recorderPassword !== '') {
        updateData.recorderPassword = dto.recorderPassword;
      }
      if (dto.recorderModel !== undefined) updateData.recorderModel = dto.recorderModel;
      if (dto.recorderOrder !== undefined) updateData.recorderOrder = dto.recorderOrder;

      if (Object.keys(updateData).length > 0) {
        await manager.update(TbRecorder, recorderSeq, updateData);
      }
    });

    return this.findOne(recorderSeq);
  }

  async remove(recorderSeq: number) {
    const recorder = await this.recorderRepo.findOne({
      where: { recorderSeq, recorderIsdel: 'N' },
    });
    if (!recorder) {
      throw new NotFoundException('해당 녹화기를 찾을 수 없습니다.');
    }

    await this.recorderRepo.update(recorderSeq, { recorderIsdel: 'Y' });
    return { message: '녹화기가 삭제되었습니다' };
  }

  // ──────────────── 프리셋 CRUD ────────────────

  async findPresets(recorderSeq: number) {
    const recorder = await this.recorderRepo.findOne({
      where: { recorderSeq, recorderIsdel: 'N' },
    });
    if (!recorder) {
      throw new NotFoundException('해당 녹화기를 찾을 수 없습니다.');
    }

    const presets = await this.presetRepo.find({
      where: { recorderSeq, presetIsdel: 'N' },
      order: { presetOrder: 'ASC' },
    });

    return {
      recorderSeq,
      recorderName: recorder.recorderName,
      presets: presets.map((p) => ({
        recPresetSeq: p.recPresetSeq,
        presetName: p.presetName,
        presetNumber: p.presetNumber,
        panValue: p.panValue,
        tiltValue: p.tiltValue,
        zoomValue: p.zoomValue,
        presetDescription: p.presetDescription,
        presetOrder: p.presetOrder,
      })),
    };
  }

  async createPreset(recorderSeq: number, dto: CreatePresetDto) {
    const recorder = await this.recorderRepo.findOne({
      where: { recorderSeq, recorderIsdel: 'N' },
    });
    if (!recorder) {
      throw new NotFoundException('해당 녹화기를 찾을 수 없습니다.');
    }

    // 프리셋 번호 중복 확인
    const existing = await this.presetRepo.findOne({
      where: { recorderSeq, presetNumber: dto.presetNumber, presetIsdel: 'N' },
    });
    if (existing) {
      throw new ConflictException('이미 같은 프리셋 번호가 존재합니다.');
    }

    const preset = this.presetRepo.create({
      recorderSeq,
      presetName: dto.presetName,
      presetNumber: dto.presetNumber,
      panValue: dto.panValue,
      tiltValue: dto.tiltValue,
      zoomValue: dto.zoomValue,
      presetDescription: dto.presetDescription,
      presetOrder: dto.presetOrder ?? 0,
    });

    const saved = await this.presetRepo.save(preset);
    return {
      recPresetSeq: saved.recPresetSeq,
      presetName: saved.presetName,
      presetNumber: saved.presetNumber,
      panValue: saved.panValue,
      tiltValue: saved.tiltValue,
      zoomValue: saved.zoomValue,
      presetDescription: saved.presetDescription,
      presetOrder: saved.presetOrder,
      regDate: saved.regDate,
    };
  }

  async updatePreset(recorderSeq: number, recPresetSeq: number, dto: UpdatePresetDto) {
    const preset = await this.presetRepo.findOne({
      where: { recPresetSeq, recorderSeq, presetIsdel: 'N' },
    });
    if (!preset) {
      throw new NotFoundException('해당 프리셋을 찾을 수 없습니다.');
    }

    if (dto.presetNumber !== undefined && dto.presetNumber !== preset.presetNumber) {
      const dup = await this.presetRepo.findOne({
        where: { recorderSeq, presetNumber: dto.presetNumber, presetIsdel: 'N' },
      });
      if (dup) {
        throw new ConflictException('변경하려는 프리셋 번호가 이미 존재합니다.');
      }
    }

    Object.assign(preset, {
      ...(dto.presetName !== undefined && { presetName: dto.presetName }),
      ...(dto.presetNumber !== undefined && { presetNumber: dto.presetNumber }),
      ...(dto.panValue !== undefined && { panValue: dto.panValue }),
      ...(dto.tiltValue !== undefined && { tiltValue: dto.tiltValue }),
      ...(dto.zoomValue !== undefined && { zoomValue: dto.zoomValue }),
      ...(dto.presetDescription !== undefined && { presetDescription: dto.presetDescription }),
      ...(dto.presetOrder !== undefined && { presetOrder: dto.presetOrder }),
    });

    const saved = await this.presetRepo.save(preset);
    return {
      recPresetSeq: saved.recPresetSeq,
      presetName: saved.presetName,
      presetNumber: saved.presetNumber,
      updDate: saved.updDate,
    };
  }

  async removePreset(recorderSeq: number, recPresetSeq: number) {
    const preset = await this.presetRepo.findOne({
      where: { recPresetSeq, recorderSeq, presetIsdel: 'N' },
    });
    if (!preset) {
      throw new NotFoundException('해당 프리셋을 찾을 수 없습니다.');
    }

    await this.presetRepo.update(recPresetSeq, { presetIsdel: 'Y' });
    return { message: '프리셋이 삭제되었습니다' };
  }

  // ──────────────── 로그 조회 ────────────────

  async findLogs(recorderSeq: number, query: QueryLogsDto) {
    const { page = 1, limit = 20, logType, resultStatus, startDate, endDate } = query;

    const recorder = await this.recorderRepo.findOne({
      where: { recorderSeq, recorderIsdel: 'N' },
    });
    if (!recorder) {
      throw new NotFoundException('해당 녹화기를 찾을 수 없습니다.');
    }

    const qb = this.logRepo
      .createQueryBuilder('log')
      .leftJoin('log.user', 'user')
      .addSelect(['user.seq', 'user.name'])
      .where('log.recorder_seq = :recorderSeq', { recorderSeq });

    if (logType) {
      qb.andWhere('log.log_type = :logType', { logType });
    }
    if (resultStatus) {
      qb.andWhere('log.result_status = :resultStatus', { resultStatus });
    }
    if (startDate) {
      qb.andWhere('log.executed_at >= :startDate', { startDate: `${startDate} 00:00:00` });
    }
    if (endDate) {
      qb.andWhere('log.executed_at <= :endDate', { endDate: `${endDate} 23:59:59` });
    }

    qb.orderBy('log.executedAt', 'DESC');

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      items: items.map((log, idx) => ({
        no: total - (page - 1) * limit - idx,
        recLogSeq: log.recLogSeq,
        logType: log.logType,
        commandDetail: log.commandDetail,
        resultStatus: log.resultStatus,
        resultMessage: log.resultMessage,
        executedBy: log.user?.name ?? null,
        executedAt: log.executedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
