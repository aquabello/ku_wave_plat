import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TbMenu } from './tb-menu.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';

@Entity('tb_menu_users')
export class TbMenuUsers {
  @PrimaryGeneratedColumn({ name: 'mu_seq', comment: '시퀀스' })
  muSeq: number;

  @Column({
    name: 'tu_seq',
    type: 'int',
    comment: '사용자 시퀀스',
  })
  tuSeq: number;

  @Column({
    name: 'menu_seq',
    type: 'int',
    comment: '메뉴 시퀀스',
  })
  menuSeq: number;

  @Column({
    name: 'reg_date',
    type: 'datetime',
    nullable: true,
    comment: '권한 부여일',
  })
  regDate: Date | null;

  @ManyToOne(() => TbUser)
  @JoinColumn({ name: 'tu_seq' })
  user: TbUser;

  @ManyToOne(() => TbMenu)
  @JoinColumn({ name: 'menu_seq' })
  menu: TbMenu;
}
