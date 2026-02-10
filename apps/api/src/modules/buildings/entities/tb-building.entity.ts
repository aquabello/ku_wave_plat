import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';

@Entity('tb_building')
export class TbBuilding {
  @PrimaryGeneratedColumn({ name: 'building_seq', comment: '건물 시퀀스' })
  buildingSeq: number;

  @Column({
    name: 'building_name',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '건물명',
  })
  buildingName: string;

  @Column({
    name: 'building_code',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '건물 코드 (예: BLD-001)',
  })
  buildingCode: string | null;

  @Column({
    name: 'building_location',
    type: 'text',
    nullable: true,
    comment: '위치 설명',
  })
  buildingLocation: string | null;

  @Column({
    name: 'building_floor_count',
    type: 'int',
    default: 0,
    nullable: true,
    comment: '층수',
  })
  buildingFloorCount: number | null;

  @Column({
    name: 'building_order',
    type: 'int',
    default: 0,
    nullable: true,
    comment: '정렬 순서',
  })
  buildingOrder: number | null;

  @Column({
    name: 'building_manager_name',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '건물 담당자',
  })
  buildingManagerName: string | null;

  @Column({
    name: 'building_manager_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '담당자 연락처',
  })
  buildingManagerPhone: string | null;

  @Column({
    name: 'building_isdel',
    type: 'char',
    default: 'N',
    nullable: true,
    comment: '삭제 여부',
  })
  buildingIsdel: string | null;

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

  @OneToMany(() => TbSpace, (space) => space.building)
  spaces: TbSpace[];
}
