import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';

@Entity('tb_space')
export class TbSpace {
  @PrimaryGeneratedColumn({ name: 'space_seq', comment: '공간 시퀀스' })
  spaceSeq: number;

  @Column({
    name: 'building_seq',
    type: 'int',
    comment: '건물 시퀀스',
  })
  buildingSeq: number;

  @Column({
    name: 'space_name',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '공간명 (예: 101호, 대강당)',
  })
  spaceName: string;

  @Column({
    name: 'space_code',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: '공간 코드 (예: SPC-001)',
  })
  spaceCode: string;

  @Column({
    name: 'space_floor',
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: '층 (예: 1, 2, B1, B2)',
  })
  spaceFloor: string | null;

  @Column({
    name: 'space_type',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '공간 유형 (강의실, 실험실, 사무실, 회의실, 기타)',
  })
  spaceType: string | null;

  @Column({
    name: 'space_capacity',
    type: 'int',
    default: 0,
    nullable: true,
    comment: '수용 인원',
  })
  spaceCapacity: number | null;

  @Column({
    name: 'space_description',
    type: 'text',
    nullable: true,
    comment: '공간 설명/메모',
  })
  spaceDescription: string | null;

  @Column({
    name: 'space_order',
    type: 'int',
    default: 0,
    nullable: true,
    comment: '정렬 순서',
  })
  spaceOrder: number | null;

  @Column({
    name: 'space_isdel',
    type: 'char',
    default: 'N',
    nullable: true,
    comment: '삭제 여부',
  })
  spaceIsdel: string | null;

  @Column({
    name: 'reg_date',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
    comment: '등록일시',
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

  @ManyToOne(() => TbBuilding)
  @JoinColumn({ name: 'building_seq' })
  building: TbBuilding;
}
