import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { TbMenuUsers } from './tb-menu-users.entity';

@Entity('tb_menu')
export class TbMenu {
  @PrimaryGeneratedColumn({ name: 'menu_seq', comment: '메뉴 시퀀스' })
  menuSeq: number;

  @Column({
    name: 'menu_name',
    type: 'varchar',
    length: 50,
    comment: '메뉴명',
  })
  menuName: string;

  @Column({
    name: 'menu_code',
    type: 'varchar',
    length: 50,
    comment: '메뉴코드',
  })
  menuCode: string;

  @Column({
    name: 'menu_path',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '라우트 경로',
  })
  menuPath: string | null;

  @Column({
    name: 'menu_type',
    type: 'enum',
    enum: ['GNB', 'LNB'],
    comment: '메뉴 타입',
  })
  menuType: 'GNB' | 'LNB';

  @Column({
    name: 'parent_seq',
    type: 'int',
    nullable: true,
    comment: '상위메뉴 시퀀스',
  })
  parentSeq: number | null;

  @Column({
    name: 'menu_order',
    type: 'int',
    default: 0,
    nullable: true,
    comment: '정렬 순서',
  })
  menuOrder: number | null;

  @Column({
    name: 'menu_isdel',
    type: 'char',
    default: 'N',
    nullable: true,
    comment: '삭제 여부',
  })
  menuIsdel: string | null;

  @Column({
    name: 'reg_date',
    type: 'datetime',
    nullable: true,
    comment: '등록일시',
  })
  regDate: Date | null;

  @ManyToOne(() => TbMenu, { nullable: true })
  @JoinColumn({ name: 'parent_seq' })
  parent: TbMenu | null;

  @OneToMany(() => TbMenu, (menu) => menu.parent)
  children: TbMenu[];

  @OneToMany(() => TbMenuUsers, (mu) => mu.menu)
  menuUsers: TbMenuUsers[];
}
