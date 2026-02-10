import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbSpaceDevice } from './entities/tb-space-device.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbDevicePreset } from '@modules/controller/presets/entities/tb-device-preset.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';
import { CreateDeviceDto, CreateBulkDeviceDto, UpdateDeviceDto, DeviceQueryDto } from './dto';
import { DeviceListItemDto, DeviceListResponseDto } from './dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(TbSpaceDevice)
    private readonly deviceRepository: Repository<TbSpaceDevice>,
    @InjectRepository(TbSpace)
    private readonly spaceRepository: Repository<TbSpace>,
    @InjectRepository(TbDevicePreset)
    private readonly presetRepository: Repository<TbDevicePreset>,
    @InjectRepository(TbBuilding)
    private readonly buildingRepository: Repository<TbBuilding>,
  ) {}

  /**
   * 건물 존재 여부 확인
   */
  private async validateBuilding(buildingSeq: number): Promise<TbBuilding> {
    const building = await this.buildingRepository.findOne({
      where: { buildingSeq },
    });

    if (!building || building.buildingIsdel === 'Y') {
      throw new NotFoundException('해당 건물을 찾을 수 없습니다');
    }

    return building;
  }

  /**
   * 공간 존재 여부 확인
   */
  private async validateSpace(spaceSeq: number): Promise<TbSpace> {
    const space = await this.spaceRepository.findOne({
      where: { spaceSeq },
    });

    if (!space || space.spaceIsdel === 'Y') {
      throw new NotFoundException('해당 공간을 찾을 수 없습니다');
    }

    return space;
  }

  /**
   * 프리셋 존재 여부 확인
   */
  private async validatePreset(presetSeq: number): Promise<TbDevicePreset> {
    const preset = await this.presetRepository.findOne({
      where: { presetSeq },
    });

    if (!preset || preset.presetIsdel === 'Y') {
      throw new NotFoundException('해당 프리셋을 찾을 수 없습니다');
    }

    return preset;
  }

  /**
   * 장비 리스트 조회 (건물별, 공간별 필터, 페이징)
   */
  async findAll(query: DeviceQueryDto): Promise<DeviceListResponseDto> {
    await this.validateBuilding(query.buildingSeq);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.deviceRepository
      .createQueryBuilder('d')
      .leftJoin('d.space', 's')
      .leftJoin('d.preset', 'p')
      .select([
        'd.space_device_seq AS spaceDeviceSeq',
        'd.space_seq AS spaceSeq',
        's.space_name AS spaceName',
        's.space_floor AS spaceFloor',
        'd.preset_seq AS presetSeq',
        'p.preset_name AS presetName',
        'p.protocol_type AS protocolType',
        'd.device_name AS deviceName',
        'd.device_ip AS deviceIp',
        'd.device_port AS devicePort',
        'd.device_status AS deviceStatus',
        'd.device_order AS deviceOrder',
      ])
      .where('s.building_seq = :buildingSeq', { buildingSeq: query.buildingSeq })
      .andWhere('(d.device_isdel IS NULL OR d.device_isdel != :deleted)', {
        deleted: 'Y',
      })
      .andWhere('(s.space_isdel IS NULL OR s.space_isdel != :deleted)', {
        deleted: 'Y',
      });

    if (query.spaceSeq) {
      qb.andWhere('d.space_seq = :spaceSeq', { spaceSeq: query.spaceSeq });
    }

    if (query.search) {
      qb.andWhere(
        '(d.device_name LIKE :search OR p.preset_name LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const total = await qb.getCount();

    const devices = await qb
      .orderBy('d.device_order', 'ASC')
      .addOrderBy('d.device_name', 'ASC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    const items: DeviceListItemDto[] = devices.map((d, index) => ({
      no: total - skip - index,
      spaceDeviceSeq: d.spaceDeviceSeq,
      spaceSeq: d.spaceSeq,
      spaceName: d.spaceName,
      spaceFloor: d.spaceFloor,
      presetSeq: d.presetSeq,
      presetName: d.presetName,
      protocolType: d.protocolType,
      deviceName: d.deviceName,
      deviceIp: d.deviceIp,
      devicePort: d.devicePort,
      deviceStatus: d.deviceStatus,
      deviceOrder: d.deviceOrder,
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
   * 장비 등록
   */
  async create(createDeviceDto: CreateDeviceDto): Promise<TbSpaceDevice> {
    await this.validateSpace(createDeviceDto.spaceSeq);
    await this.validatePreset(createDeviceDto.presetSeq);

    const device = this.deviceRepository.create({
      spaceSeq: createDeviceDto.spaceSeq,
      presetSeq: createDeviceDto.presetSeq,
      deviceName: createDeviceDto.deviceName,
      deviceIp: createDeviceDto.deviceIp,
      devicePort: createDeviceDto.devicePort,
      deviceOrder: createDeviceDto.deviceOrder ?? 0,
    });

    return this.deviceRepository.save(device);
  }

  /**
   * 장비 일괄 등록
   */
  async createBulk(dto: CreateBulkDeviceDto) {
    await this.validatePreset(dto.presetSeq);

    const results = [];
    let successCount = 0;

    for (const item of dto.devices) {
      try {
        const space = await this.validateSpace(item.spaceSeq);

        const device = this.deviceRepository.create({
          spaceSeq: item.spaceSeq,
          presetSeq: dto.presetSeq,
          deviceName: item.deviceName,
          deviceIp: item.deviceIp,
          devicePort: item.devicePort,
          deviceOrder: item.deviceOrder ?? 0,
        });
        await this.deviceRepository.save(device);

        results.push({
          spaceSeq: item.spaceSeq,
          spaceName: space.spaceName,
          deviceName: item.deviceName,
          status: 'SUCCESS',
        });
        successCount++;
      } catch (error: any) {
        results.push({
          spaceSeq: item.spaceSeq,
          spaceName: null,
          deviceName: item.deviceName,
          status: 'FAIL',
          message: error.message,
        });
      }
    }

    return {
      totalRequested: dto.devices.length,
      successCount,
      results,
    };
  }

  /**
   * 장비 수정
   */
  async update(spaceDeviceSeq: number, updateDeviceDto: UpdateDeviceDto): Promise<TbSpaceDevice> {
    const device = await this.deviceRepository.findOne({
      where: { spaceDeviceSeq },
    });

    if (!device || device.deviceIsdel === 'Y') {
      throw new NotFoundException('해당 장비를 찾을 수 없습니다');
    }

    if (updateDeviceDto.presetSeq !== undefined) {
      await this.validatePreset(updateDeviceDto.presetSeq);
      device.presetSeq = updateDeviceDto.presetSeq;
    }
    if (updateDeviceDto.deviceName !== undefined) {
      device.deviceName = updateDeviceDto.deviceName;
    }
    if (updateDeviceDto.deviceIp !== undefined) {
      device.deviceIp = updateDeviceDto.deviceIp;
    }
    if (updateDeviceDto.devicePort !== undefined) {
      device.devicePort = updateDeviceDto.devicePort;
    }
    if (updateDeviceDto.deviceStatus !== undefined) {
      device.deviceStatus = updateDeviceDto.deviceStatus;
    }
    if (updateDeviceDto.deviceOrder !== undefined) {
      device.deviceOrder = updateDeviceDto.deviceOrder;
    }

    return this.deviceRepository.save(device);
  }

  /**
   * 장비 삭제 (소프트 삭제)
   */
  async softDelete(spaceDeviceSeq: number): Promise<void> {
    const device = await this.deviceRepository.findOne({
      where: { spaceDeviceSeq },
    });

    if (!device || device.deviceIsdel === 'Y') {
      throw new NotFoundException('해당 장비를 찾을 수 없습니다');
    }

    await this.deviceRepository.update(spaceDeviceSeq, {
      deviceIsdel: 'Y',
    });
  }
}
