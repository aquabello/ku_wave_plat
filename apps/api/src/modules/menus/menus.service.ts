import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { TbMenu } from './entities/tb-menu.entity';
import { TbMenuUsers } from './entities/tb-menu-users.entity';
import { GNBMenuItemDto, LNBMenuItemDto, UserMenuResponseDto, UpdateUserMenusDto } from './dto';
import { TbUser } from '@modules/users/entities/tb-user.entity';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(TbMenu)
    private readonly menuRepository: Repository<TbMenu>,
    @InjectRepository(TbMenuUsers)
    private readonly menuUsersRepository: Repository<TbMenuUsers>,
    @InjectRepository(TbUser)
    private readonly userRepository: Repository<TbUser>,
  ) {}

  /**
   * 전체 메뉴 트리 조회 (GNB → LNB 계층)
   */
  async findAllMenuTree(): Promise<GNBMenuItemDto[]> {
    const menus = await this.menuRepository.find({
      where: { menuIsdel: 'N' },
      order: { menuOrder: 'ASC' },
    });

    const gnbMenus = menus.filter((m) => m.menuType === 'GNB');
    const lnbMenus = menus.filter((m) => m.menuType === 'LNB');

    return gnbMenus.map((gnb) => ({
      menuSeq: gnb.menuSeq,
      menuName: gnb.menuName,
      menuCode: gnb.menuCode,
      menuOrder: gnb.menuOrder,
      children: lnbMenus
        .filter((lnb) => lnb.parentSeq === gnb.menuSeq)
        .map((lnb) => ({
          menuSeq: lnb.menuSeq,
          menuName: lnb.menuName,
          menuCode: lnb.menuCode,
          menuPath: lnb.menuPath,
          menuOrder: lnb.menuOrder,
        })),
    }));
  }

  /**
   * 특정 사용자의 메뉴 권한 조회
   */
  async findUserMenus(userSeq: number): Promise<UserMenuResponseDto> {
    const user = await this.userRepository.findOne({ where: { seq: userSeq } });
    if (!user || user.isDel === 'Y') {
      throw new NotFoundException('해당 회원을 찾을 수 없습니다');
    }

    // 사용자에게 할당된 메뉴 시퀀스 조회
    const userMenus = await this.menuUsersRepository.find({
      where: { tuSeq: userSeq },
    });
    const assignedSeqs = userMenus.map((mu) => mu.menuSeq);

    // 할당된 메뉴가 없으면 빈 트리 반환
    if (assignedSeqs.length === 0) {
      return { userSeq, menuSeqs: [], menuTree: [] };
    }

    // 할당된 메뉴 정보 조회
    const menus = await this.menuRepository.find({
      where: { menuSeq: In(assignedSeqs), menuIsdel: 'N' },
      order: { menuOrder: 'ASC' },
    });

    const lnbMenus = menus.filter((m) => m.menuType === 'LNB');
    let gnbMenus = menus.filter((m) => m.menuType === 'GNB');

    // LNB의 부모 GNB가 할당 목록에 없으면 자동 포함
    const gnbSeqs = new Set(gnbMenus.map((g) => g.menuSeq));
    const missingGnbSeqs = [
      ...new Set(
        lnbMenus
          .filter((lnb) => lnb.parentSeq && !gnbSeqs.has(lnb.parentSeq))
          .map((lnb) => lnb.parentSeq as number),
      ),
    ];

    if (missingGnbSeqs.length > 0) {
      const missingGnbs = await this.menuRepository.find({
        where: { menuSeq: In(missingGnbSeqs), menuIsdel: 'N' },
        order: { menuOrder: 'ASC' },
      });
      gnbMenus = [...gnbMenus, ...missingGnbs].sort(
        (a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0),
      );
    }

    const menuTree: GNBMenuItemDto[] = gnbMenus.map((gnb) => ({
      menuSeq: gnb.menuSeq,
      menuName: gnb.menuName,
      menuCode: gnb.menuCode,
      menuOrder: gnb.menuOrder,
      children: lnbMenus
        .filter((lnb) => lnb.parentSeq === gnb.menuSeq)
        .map((lnb) => ({
          menuSeq: lnb.menuSeq,
          menuName: lnb.menuName,
          menuCode: lnb.menuCode,
          menuPath: lnb.menuPath,
          menuOrder: lnb.menuOrder,
        })),
    }));

    return { userSeq, menuSeqs: assignedSeqs, menuTree };
  }

  /**
   * 사용자 메뉴 권한 일괄 저장 (기존 삭제 → 새로 INSERT)
   */
  async updateUserMenus(userSeq: number, dto: UpdateUserMenusDto): Promise<UserMenuResponseDto> {
    const user = await this.userRepository.findOne({ where: { seq: userSeq } });
    if (!user || user.isDel === 'Y') {
      throw new NotFoundException('해당 회원을 찾을 수 없습니다');
    }

    // 트랜잭션: 기존 권한 삭제 → 새 권한 INSERT → 토큰 버전 증가
    await this.menuUsersRepository.manager.transaction(async (manager) => {
      // 기존 권한 전체 삭제
      await manager.delete(TbMenuUsers, { tuSeq: userSeq });

      // 새 권한 일괄 INSERT
      if (dto.menuSeqs.length > 0) {
        const newRecords = dto.menuSeqs.map((menuSeq) =>
          manager.create(TbMenuUsers, { tuSeq: userSeq, menuSeq }),
        );
        await manager.save(TbMenuUsers, newRecords);
      }

      // 토큰 버전 증가 → 해당 사용자 강제 재로그인
      await manager.increment(TbUser, { seq: userSeq }, 'tokenVer', 1);
    });

    // 저장 후 결과 반환
    return this.findUserMenus(userSeq);
  }
}
