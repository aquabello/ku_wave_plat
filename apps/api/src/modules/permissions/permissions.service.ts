import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { TbMenuUsers } from '@modules/menus/entities/tb-menu-users.entity';
import { TbMenu } from '@modules/menus/entities/tb-menu.entity';
import { PermissionQueryDto, PermissionListItemDto, PermissionListResponseDto } from './dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(TbUser)
    private readonly userRepository: Repository<TbUser>,
    @InjectRepository(TbMenuUsers)
    private readonly menuUsersRepository: Repository<TbMenuUsers>,
    @InjectRepository(TbMenu)
    private readonly menuRepository: Repository<TbMenu>,
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
    if (userSeqs.length > 0) {
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
    }

    const items: PermissionListItemDto[] = users.map((u, index) => ({
      no: total - skip - index,
      seq: u.seq,
      id: u.id,
      name: u.name,
      userType: u.type,
      step: u.step,
      assignedBuildings: [], // TODO: 건물-사용자 매핑 테이블 연결 후
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
}
