import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbBuilding } from './entities/tb-building.entity';
import { CreateBuildingDto, UpdateBuildingDto, BuildingQueryDto } from './dto';
import { BuildingListItemDto, BuildingListResponseDto } from './dto';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectRepository(TbBuilding)
    private readonly buildingRepository: Repository<TbBuilding>,
  ) {}

  /**
   * 건물 리스트 조회 (삭제되지 않은 건물만, 페이징)
   */
  async findAll(query: BuildingQueryDto): Promise<BuildingListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.buildingRepository
      .createQueryBuilder('b')
      .where('(b.building_isdel IS NULL OR b.building_isdel != :deleted)', {
        deleted: 'Y',
      });

    if (query.search) {
      qb.andWhere(
        '(b.building_name LIKE :search OR b.building_code LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // spaceCount LEFT JOIN subquery
    qb.addSelect((subQuery) => {
      return subQuery
        .select('COUNT(s.space_seq)')
        .from('tb_space', 's')
        .where('s.building_seq = b.building_seq')
        .andWhere("(s.space_isdel IS NULL OR s.space_isdel != 'Y')");
    }, 'spaceCount');

    const total = await qb.getCount();

    const rawAndEntities = await qb
      .orderBy('b.building_name', 'ASC')
      .skip(skip)
      .take(limit)
      .getRawAndEntities();

    const items: BuildingListItemDto[] = rawAndEntities.entities.map((b, index) => ({
      no: total - skip - index,
      buildingSeq: b.buildingSeq,
      buildingName: b.buildingName,
      buildingCode: b.buildingCode,
      buildingLocation: b.buildingLocation,
      buildingFloorCount: b.buildingFloorCount,
      playerCount: 0, // TODO: 플레이어 테이블 연결 후 카운트
      assignedUserCount: 0, // TODO: 할당사용자 테이블 연결 후 카운트
      spaceCount: parseInt(rawAndEntities.raw[index]?.spaceCount ?? '0', 10),
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
   * 건물 상세 조회
   */
  async findOne(buildingSeq: number): Promise<TbBuilding> {
    const building = await this.buildingRepository.findOne({
      where: { buildingSeq },
    });

    if (!building || building.buildingIsdel === 'Y') {
      throw new NotFoundException('해당 건물을 찾을 수 없습니다');
    }

    return building;
  }

  /**
   * 건물 코드 자동 생성 (BLD-001 ~ BLD-999)
   */
  private async generateBuildingCode(): Promise<string> {
    const result = await this.buildingRepository
      .createQueryBuilder('b')
      .select('MAX(b.building_code)', 'maxCode')
      .where("b.building_code LIKE 'BLD-%'")
      .getRawOne();

    let nextNumber = 1;
    if (result?.maxCode) {
      const currentNumber = parseInt(result.maxCode.replace('BLD-', ''), 10);
      nextNumber = currentNumber + 1;
    }

    if (nextNumber > 999) {
      throw new ConflictException('건물 코드가 최대치(BLD-999)를 초과했습니다');
    }

    return `BLD-${String(nextNumber).padStart(3, '0')}`;
  }

  /**
   * 건물 등록
   */
  async create(createBuildingDto: CreateBuildingDto): Promise<TbBuilding> {
    const buildingCode = await this.generateBuildingCode();

    const building = this.buildingRepository.create({
      buildingName: createBuildingDto.buildingName,
      buildingCode,
      buildingLocation: createBuildingDto.buildingLocation ?? null,
      buildingFloorCount: createBuildingDto.buildingFloorCount ?? 0,
      buildingOrder: createBuildingDto.buildingOrder ?? 0,
      buildingManagerName: createBuildingDto.buildingManagerName ?? null,
      buildingManagerPhone: createBuildingDto.buildingManagerPhone ?? null,
    });

    return this.buildingRepository.save(building);
  }

  /**
   * 건물 수정
   */
  async update(buildingSeq: number, updateBuildingDto: UpdateBuildingDto): Promise<TbBuilding> {
    const building = await this.findOne(buildingSeq);

    // buildingCode는 자동생성이므로 수정 불가

    if (updateBuildingDto.buildingName !== undefined) {
      building.buildingName = updateBuildingDto.buildingName;
    }
    if (updateBuildingDto.buildingLocation !== undefined) {
      building.buildingLocation = updateBuildingDto.buildingLocation;
    }
    if (updateBuildingDto.buildingFloorCount !== undefined) {
      building.buildingFloorCount = updateBuildingDto.buildingFloorCount;
    }
    if (updateBuildingDto.buildingOrder !== undefined) {
      building.buildingOrder = updateBuildingDto.buildingOrder;
    }
    if (updateBuildingDto.buildingManagerName !== undefined) {
      building.buildingManagerName = updateBuildingDto.buildingManagerName;
    }
    if (updateBuildingDto.buildingManagerPhone !== undefined) {
      building.buildingManagerPhone = updateBuildingDto.buildingManagerPhone;
    }

    return this.buildingRepository.save(building);
  }

  /**
   * 건물 삭제 (소프트 삭제)
   */
  async softDelete(buildingSeq: number): Promise<void> {
    const building = await this.findOne(buildingSeq);

    await this.buildingRepository.update(building.buildingSeq, {
      buildingIsdel: 'Y',
    });
  }
}
