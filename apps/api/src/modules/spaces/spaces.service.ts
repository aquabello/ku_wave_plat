import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbSpace } from './entities/tb-space.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';
import { CreateSpaceDto, UpdateSpaceDto, SpaceQueryDto } from './dto';
import { SpaceListItemDto, SpaceListResponseDto } from './dto';

@Injectable()
export class SpacesService {
  constructor(
    @InjectRepository(TbSpace)
    private readonly spaceRepository: Repository<TbSpace>,
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
   * 공간 코드 자동 생성 (SPC-001 ~ SPC-999)
   */
  private async generateSpaceCode(): Promise<string> {
    const result = await this.spaceRepository
      .createQueryBuilder('s')
      .select('MAX(s.space_code)', 'maxCode')
      .where("s.space_code LIKE 'SPC-%'")
      .getRawOne();

    let nextNumber = 1;
    if (result?.maxCode) {
      const currentNumber = parseInt(result.maxCode.replace('SPC-', ''), 10);
      nextNumber = currentNumber + 1;
    }

    if (nextNumber > 999) {
      throw new ConflictException('공간 코드가 최대치(SPC-999)를 초과했습니다');
    }

    return `SPC-${String(nextNumber).padStart(3, '0')}`;
  }

  /**
   * 공간 리스트 조회 (건물별, 페이징)
   */
  async findAll(buildingSeq: number, query: SpaceQueryDto): Promise<SpaceListResponseDto> {
    await this.validateBuilding(buildingSeq);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.spaceRepository
      .createQueryBuilder('s')
      .where('s.building_seq = :buildingSeq', { buildingSeq })
      .andWhere('(s.space_isdel IS NULL OR s.space_isdel != :deleted)', {
        deleted: 'Y',
      });

    if (query.search) {
      qb.andWhere(
        '(s.space_name LIKE :search OR s.space_code LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.floor) {
      qb.andWhere('s.space_floor = :floor', { floor: query.floor });
    }

    if (query.spaceType) {
      qb.andWhere('s.space_type = :spaceType', { spaceType: query.spaceType });
    }

    const [spaces, total] = await qb
      .orderBy('s.space_order', 'ASC')
      .addOrderBy('s.space_name', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const items: SpaceListItemDto[] = spaces.map((s, index) => ({
      no: total - skip - index,
      spaceSeq: s.spaceSeq,
      buildingSeq: s.buildingSeq,
      spaceName: s.spaceName,
      spaceCode: s.spaceCode,
      spaceFloor: s.spaceFloor,
      spaceType: s.spaceType,
      spaceCapacity: s.spaceCapacity,
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
   * 공간 상세 조회
   */
  async findOne(buildingSeq: number, spaceSeq: number): Promise<TbSpace> {
    await this.validateBuilding(buildingSeq);

    const space = await this.spaceRepository.findOne({
      where: { spaceSeq, buildingSeq },
    });

    if (!space || space.spaceIsdel === 'Y') {
      throw new NotFoundException('해당 공간을 찾을 수 없습니다');
    }

    return space;
  }

  /**
   * 공간 등록
   */
  async create(buildingSeq: number, createSpaceDto: CreateSpaceDto): Promise<TbSpace> {
    await this.validateBuilding(buildingSeq);

    const spaceCode = await this.generateSpaceCode();

    const space = this.spaceRepository.create({
      buildingSeq,
      spaceName: createSpaceDto.spaceName,
      spaceCode,
      spaceFloor: createSpaceDto.spaceFloor ?? null,
      spaceType: createSpaceDto.spaceType ?? null,
      spaceCapacity: createSpaceDto.spaceCapacity ?? 0,
      spaceDescription: createSpaceDto.spaceDescription ?? null,
      spaceOrder: createSpaceDto.spaceOrder ?? 0,
    });

    return this.spaceRepository.save(space);
  }

  /**
   * 공간 수정
   */
  async update(buildingSeq: number, spaceSeq: number, updateSpaceDto: UpdateSpaceDto): Promise<TbSpace> {
    const space = await this.findOne(buildingSeq, spaceSeq);

    if (updateSpaceDto.spaceName !== undefined) {
      space.spaceName = updateSpaceDto.spaceName;
    }
    if (updateSpaceDto.spaceFloor !== undefined) {
      space.spaceFloor = updateSpaceDto.spaceFloor;
    }
    if (updateSpaceDto.spaceType !== undefined) {
      space.spaceType = updateSpaceDto.spaceType;
    }
    if (updateSpaceDto.spaceCapacity !== undefined) {
      space.spaceCapacity = updateSpaceDto.spaceCapacity;
    }
    if (updateSpaceDto.spaceDescription !== undefined) {
      space.spaceDescription = updateSpaceDto.spaceDescription;
    }
    if (updateSpaceDto.spaceOrder !== undefined) {
      space.spaceOrder = updateSpaceDto.spaceOrder;
    }

    return this.spaceRepository.save(space);
  }

  /**
   * 공간 삭제 (소프트 삭제)
   */
  async softDelete(buildingSeq: number, spaceSeq: number): Promise<void> {
    const space = await this.findOne(buildingSeq, spaceSeq);

    await this.spaceRepository.update(space.spaceSeq, {
      spaceIsdel: 'Y',
    });
  }
}
