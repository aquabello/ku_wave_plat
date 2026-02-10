import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { TbMenuUsers } from '@modules/menus/entities/tb-menu-users.entity';
import { TbMenu } from '@modules/menus/entities/tb-menu.entity';
import { TbUserBuilding } from './entities/tb-user-building.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';
import { PermissionQueryDto, PermissionListItemDto, PermissionListResponseDto, AssignBuildingsDto } from './dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(TbUser)
    private readonly userRepository: Repository<TbUser>,
    @InjectRepository(TbMenuUsers)
    private readonly menuUsersRepository: Repository<TbMenuUsers>,
    @InjectRepository(TbMenu)
    private readonly menuRepository: Repository<TbMenu>,
    @InjectRepository(TbUserBuilding)
    private readonly userBuildingRepository: Repository<TbUserBuilding>,
    @InjectRepository(TbBuilding)
    private readonly buildingRepository: Repository<TbBuilding>,
  ) {}

  /**
   * 권한 목록 조회 (사용자 리스트 + 할당된 메뉴/건물)
   */
  async findAll(query: PermissionQueryDto): Promise<PermissionListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('u')
      .where('(u.tu_isdel IS NULL OR u.tu_isdel != :deleted)', {
        deleted: 'Y',
      })
      .andWhere("(u.tu_type IS NULL OR u.tu_type != :superType)", {
        superType: 'SUPER',
      });

    if (query.search) {
      qb.andWhere(
        '(u.tu_id LIKE :search OR u.tu_name LIKE :search OR u.tu_email LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [users, total] = await qb
      .orderBy('u.tu_seq', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // 사용자 시퀀스 목록
    const userSeqs = users.map((u) => u.seq);

    // 사용자별 할당된 메뉴 조회 (한 번에)
    let menuMap = new Map<number, string[]>();
    let buildingMap = new Map<number, string[]>();

    if (userSeqs.length > 0) {
      // 메뉴 조회
      const menuResults = await this.menuUsersRepository
        .createQueryBuilder('mu')
        .innerJoin('mu.menu', 'm')
        .select(['mu.tu_seq AS tuSeq', 'm.menu_name AS menuName'])
        .where('mu.tu_seq IN (:...userSeqs)', { userSeqs })
        .andWhere("m.menu_type = 'GNB'")
        .andWhere("(m.menu_isdel IS NULL OR m.menu_isdel != 'Y')")
        .getRawMany();

      for (const row of menuResults) {
        const seqs = menuMap.get(row.tuSeq) ?? [];
        seqs.push(row.menuName);
        menuMap.set(row.tuSeq, seqs);
      }

      // 건물 조회
      const buildingResults = await this.userBuildingRepository
        .createQueryBuilder('ub')
        .innerJoin('ub.building', 'b')
        .select(['ub.tu_seq AS tuSeq', 'b.building_name AS buildingName'])
        .where('ub.tu_seq IN (:...userSeqs)', { userSeqs })
        .andWhere("(b.building_isdel IS NULL OR b.building_isdel != 'Y')")
        .getRawMany();

      for (const row of buildingResults) {
        const names = buildingMap.get(row.tuSeq) ?? [];
        names.push(row.buildingName);
        buildingMap.set(row.tuSeq, names);
      }
    }

    const items: PermissionListItemDto[] = users.map((u, index) => ({
      no: total - skip - index,
      seq: u.seq,
      id: u.id,
      name: u.name,
      userType: u.type,
      step: u.step,
      assignedBuildings: buildingMap.get(u.seq) ?? [],
      assignedMenus: menuMap.get(u.seq) ?? [],
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
   * 사용자에게 건물 할당 (전체 교체 방식)
   * 기존 할당을 모두 삭제하고 새로 할당
   */
  async assignBuildings(userSeq: number, dto: AssignBuildingsDto): Promise<{ message: string; assignedBuildings: string[] }> {
    // 사용자 존재 확인
    const user = await this.userRepository.findOne({ where: { seq: userSeq } });
    if (!user || user.isDel === 'Y') {
      throw new NotFoundException('해당 회원을 찾을 수 없습니다');
    }

    // 건물 유효성 확인 (요청된 건물이 모두 존재하는지)
    let buildingNames: string[] = [];
    if (dto.buildingSeqs.length > 0) {
      const buildings = await this.buildingRepository.find({
        where: { buildingSeq: In(dto.buildingSeqs) },
      });

      const validBuildings = buildings.filter((b) => b.buildingIsdel !== 'Y');
      const validSeqs = validBuildings.map((b) => b.buildingSeq);
      const invalidSeqs = dto.buildingSeqs.filter((seq) => !validSeqs.includes(seq));

      if (invalidSeqs.length > 0) {
        throw new NotFoundException(`존재하지 않는 건물: ${invalidSeqs.join(', ')}`);
      }

      buildingNames = validBuildings.map((b) => b.buildingName);
    }

    // 기존 할당 전체 삭제
    await this.userBuildingRepository.delete({ tuSeq: userSeq });

    // 새로 할당
    if (dto.buildingSeqs.length > 0) {
      const entities = dto.buildingSeqs.map((buildingSeq) =>
        this.userBuildingRepository.create({
          tuSeq: userSeq,
          buildingSeq,
        }),
      );
      await this.userBuildingRepository.save(entities);
    }

    return {
      message: '건물 할당이 완료되었습니다',
      assignedBuildings: buildingNames,
    };
  }
}
