import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';
import { TbPlayerGroupMember } from './tb-player-group-member.entity';
import { TbGroupPlaylist } from '@modules/player-playlists/entities/tb-group-playlist.entity';

@Entity('tb_player_group')
export class TbPlayerGroup {
  @PrimaryGeneratedColumn({ name: 'group_seq', comment: '그룹 시퀀스' })
  groupSeq: number;

  @Column({
    name: 'group_name',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '그룹명',
  })
  groupName: string;

  @Column({
    name: 'group_code',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: '그룹 코드',
  })
  groupCode: string;

  @Column({
    name: 'building_seq',
    type: 'int',
    nullable: true,
    comment: '건물 시퀀스',
  })
  buildingSeq: number | null;

  @Column({
    name: 'group_description',
    type: 'text',
    nullable: true,
    comment: '그룹 설명',
  })
  groupDescription: string | null;

  @Column({
    name: 'group_order',
    type: 'int',
    default: 0,
    comment: '정렬 순서',
  })
  groupOrder: number;

  @Column({
    name: 'group_isdel',
    type: 'char',
    length: 1,
    default: 'N',
    comment: '삭제 여부 (Y/N)',
  })
  groupIsdel: 'Y' | 'N';

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

  // Relations
  @ManyToOne(() => TbBuilding, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'building_seq' })
  building: TbBuilding | null;

  @OneToMany(() => TbPlayerGroupMember, (member) => member.group)
  members: TbPlayerGroupMember[];

  @OneToMany(() => TbGroupPlaylist, (gp) => gp.group)
  playlists: TbGroupPlaylist[];
}
