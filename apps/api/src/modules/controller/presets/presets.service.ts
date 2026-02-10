import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TbDevicePreset } from './entities/tb-device-preset.entity';
import { TbPresetCommand } from './entities/tb-preset-command.entity';
import {
  CreatePresetDto,
  UpdatePresetDto,
  PresetQueryDto,
  PresetListItemDto,
  PresetListResponseDto,
} from './dto';

@Injectable()
export class PresetsService {
  constructor(
    @InjectRepository(TbDevicePreset)
    private readonly presetRepository: Repository<TbDevicePreset>,
    @InjectRepository(TbPresetCommand)
    private readonly commandRepository: Repository<TbPresetCommand>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 프리셋 리스트 조회 (페이징, 검색, 필터)
   */
  async findAll(query: PresetQueryDto): Promise<PresetListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.presetRepository
      .createQueryBuilder('p')
      .where('(p.preset_isdel IS NULL OR p.preset_isdel != :deleted)', {
        deleted: 'Y',
      });

    // 검색 (프리셋명)
    if (query.search) {
      qb.andWhere('p.preset_name LIKE :search', {
        search: `%${query.search}%`,
      });
    }

    // 프로토콜 필터
    if (query.protocol) {
      qb.andWhere('p.protocol_type = :protocol', { protocol: query.protocol });
    }

    // 명령어 수 (commandCount)
    qb.addSelect((subQuery) => {
      return subQuery
        .select('COUNT(c.command_seq)')
        .from('tb_preset_command', 'c')
        .where('c.preset_seq = p.preset_seq')
        .andWhere("(c.command_isdel IS NULL OR c.command_isdel != 'Y')");
    }, 'commandCount');

    // 연결된 장비 수 (deviceCount)
    qb.addSelect((subQuery) => {
      return subQuery
        .select('COUNT(d.space_device_seq)')
        .from('tb_space_device', 'd')
        .where('d.preset_seq = p.preset_seq')
        .andWhere("(d.device_isdel IS NULL OR d.device_isdel != 'Y')");
    }, 'deviceCount');

    const total = await qb.getCount();

    const rawAndEntities = await qb
      .orderBy('p.preset_order', 'ASC')
      .addOrderBy('p.preset_name', 'ASC')
      .skip(skip)
      .take(limit)
      .getRawAndEntities();

    const items: PresetListItemDto[] = rawAndEntities.entities.map((p, index) => ({
      no: total - skip - index,
      presetSeq: p.presetSeq,
      presetName: p.presetName,
      protocolType: p.protocolType,
      commIp: p.commIp,
      commPort: p.commPort,
      presetDescription: p.presetDescription,
      commandCount: parseInt(rawAndEntities.raw[index]?.commandCount ?? '0', 10),
      deviceCount: parseInt(rawAndEntities.raw[index]?.deviceCount ?? '0', 10),
      presetOrder: p.presetOrder,
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 프리셋 상세 조회 (명령어 포함)
   */
  async findOne(presetSeq: number): Promise<TbDevicePreset> {
    const preset = await this.presetRepository.findOne({
      where: { presetSeq },
      relations: ['commands'],
    });

    if (!preset || preset.presetIsdel === 'Y') {
      throw new NotFoundException('해당 프리셋을 찾을 수 없습니다');
    }

    // 삭제되지 않은 명령어만 필터링 및 정렬
    if (preset.commands) {
      preset.commands = preset.commands
        .filter((cmd) => cmd.commandIsdel !== 'Y')
        .sort((a, b) => {
          const orderA = a.commandOrder ?? 0;
          const orderB = b.commandOrder ?? 0;
          return orderA - orderB;
        });
    }

    return preset;
  }

  /**
   * 프리셋 생성 (명령어 포함, 트랜잭션)
   */
  async create(createPresetDto: CreatePresetDto): Promise<TbDevicePreset> {
    const savedPreset = await this.dataSource.transaction(async (manager) => {
      // 프리셋 생성
      const preset = manager.create(TbDevicePreset, {
        presetName: createPresetDto.presetName,
        protocolType: createPresetDto.protocolType,
        commIp: createPresetDto.commIp ?? null,
        commPort: createPresetDto.commPort ?? null,
        presetDescription: createPresetDto.presetDescription ?? null,
        presetOrder: createPresetDto.presetOrder ?? 0,
      });

      const saved = await manager.save(TbDevicePreset, preset);

      // 명령어 생성
      if (createPresetDto.commands && createPresetDto.commands.length > 0) {
        const commands = createPresetDto.commands.map((cmd) =>
          manager.create(TbPresetCommand, {
            presetSeq: saved.presetSeq,
            commandName: cmd.commandName,
            commandCode: cmd.commandCode,
            commandType: cmd.commandType ?? 'CUSTOM',
            commandOrder: cmd.commandOrder ?? 0,
          }),
        );

        await manager.save(TbPresetCommand, commands);
      }

      return saved;
    });

    // 트랜잭션 커밋 후 조회
    return this.findOne(savedPreset.presetSeq);
  }

  /**
   * 프리셋 수정 (명령어 동기화, 트랜잭션)
   */
  async update(presetSeq: number, updatePresetDto: UpdatePresetDto): Promise<TbDevicePreset> {
    const preset = await this.findOne(presetSeq);

    await this.dataSource.transaction(async (manager) => {
      // 프리셋 필드 업데이트
      if (updatePresetDto.presetName !== undefined) {
        preset.presetName = updatePresetDto.presetName;
      }
      if (updatePresetDto.protocolType !== undefined) {
        preset.protocolType = updatePresetDto.protocolType;
      }
      if (updatePresetDto.commIp !== undefined) {
        preset.commIp = updatePresetDto.commIp;
      }
      if (updatePresetDto.commPort !== undefined) {
        preset.commPort = updatePresetDto.commPort;
      }
      if (updatePresetDto.presetDescription !== undefined) {
        preset.presetDescription = updatePresetDto.presetDescription;
      }
      if (updatePresetDto.presetOrder !== undefined) {
        preset.presetOrder = updatePresetDto.presetOrder;
      }

      await manager.save(TbDevicePreset, preset);

      // 명령어 동기화 로직
      if (updatePresetDto.commands !== undefined) {
        const requestCommandSeqs = updatePresetDto.commands
          .filter((cmd) => cmd.commandSeq !== undefined)
          .map((cmd) => cmd.commandSeq!);

        // 기존 명령어 중 요청에 없는 것은 소프트 삭제
        const existingCommands = await manager.find(TbPresetCommand, {
          where: { presetSeq },
        });

        for (const existing of existingCommands) {
          if (
            existing.commandIsdel !== 'Y' &&
            !requestCommandSeqs.includes(existing.commandSeq)
          ) {
            await manager.update(TbPresetCommand, existing.commandSeq, {
              commandIsdel: 'Y',
            });
          }
        }

        // 명령어 처리 (commandSeq 있으면 업데이트, 없으면 생성)
        for (const cmdDto of updatePresetDto.commands) {
          if (cmdDto.commandSeq) {
            // 기존 명령어 업데이트
            const existingCmd = await manager.findOne(TbPresetCommand, {
              where: { commandSeq: cmdDto.commandSeq, presetSeq },
            });

            if (existingCmd) {
              if (cmdDto.commandName !== undefined) {
                existingCmd.commandName = cmdDto.commandName;
              }
              if (cmdDto.commandCode !== undefined) {
                existingCmd.commandCode = cmdDto.commandCode;
              }
              if (cmdDto.commandType !== undefined) {
                existingCmd.commandType = cmdDto.commandType;
              }
              if (cmdDto.commandOrder !== undefined) {
                existingCmd.commandOrder = cmdDto.commandOrder;
              }

              await manager.save(TbPresetCommand, existingCmd);
            }
          } else {
            // 신규 명령어 생성
            const newCmd = manager.create(TbPresetCommand, {
              presetSeq,
              commandName: cmdDto.commandName ?? '',
              commandCode: cmdDto.commandCode ?? '',
              commandType: cmdDto.commandType ?? 'CUSTOM',
              commandOrder: cmdDto.commandOrder ?? 0,
            });

            await manager.save(TbPresetCommand, newCmd);
          }
        }
      }
    });

    // 트랜잭션 커밋 후 조회
    return this.findOne(presetSeq);
  }

  /**
   * 프리셋 삭제 (소프트 삭제, 장비 연결 체크)
   */
  async softDelete(presetSeq: number): Promise<void> {
    const preset = await this.findOne(presetSeq);

    // 연결된 활성 장비 확인
    const deviceCountResult = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(d.space_device_seq)', 'count')
      .from('tb_space_device', 'd')
      .where('d.preset_seq = :presetSeq', { presetSeq })
      .andWhere("(d.device_isdel IS NULL OR d.device_isdel != 'Y')")
      .getRawOne();

    const deviceCount = parseInt(deviceCountResult?.count ?? '0', 10);

    if (deviceCount > 0) {
      throw new ConflictException(
        `이 프리셋을 사용 중인 장비가 ${deviceCount}개 있어 삭제할 수 없습니다`,
      );
    }

    // 프리셋 및 명령어 소프트 삭제
    await this.dataSource.transaction(async (manager) => {
      // 프리셋 소프트 삭제
      await manager.update(TbDevicePreset, preset.presetSeq, {
        presetIsdel: 'Y',
      });

      // 모든 명령어 소프트 삭제
      await manager.update(
        TbPresetCommand,
        { presetSeq: preset.presetSeq },
        { commandIsdel: 'Y' },
      );
    });
  }
}
