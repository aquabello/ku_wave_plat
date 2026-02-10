import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';

@Entity('tb_user_building')
export class TbUserBuilding {
  @PrimaryGeneratedColumn({ name: 'tub_seq', comment: '시퀀스' })
  tubSeq: number;

  @Column({
    name: 'tu_seq',
    type: 'int',
    comment: '사용자 시퀀스',
  })
  tuSeq: number;

  @Column({
    name: 'building_seq',
    type: 'int',
    comment: '건물 시퀀스',
  })
  buildingSeq: number;

  @Column({
    name: 'reg_date',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
    comment: '할당일시',
  })
  regDate: Date | null;

  @Column({
    name: 'upd_date',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    nullable: true,
    comment: '수정일시',
  })
  updDate: Date | null;

  @ManyToOne(() => TbUser)
  @JoinColumn({ name: 'tu_seq' })
  user: TbUser;

  @ManyToOne(() => TbBuilding)
  @JoinColumn({ name: 'building_seq' })
  building: TbBuilding;
}
