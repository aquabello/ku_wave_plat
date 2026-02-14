import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TbPlayerGroup } from '@modules/player-groups/entities/tb-player-group.entity';
import { TbPlayList } from '@modules/playlists/entities/tb-play-list.entity';

@Entity('tb_group_playlist')
export class TbGroupPlaylist {
  @PrimaryGeneratedColumn({ name: 'gp_seq', comment: '할당 시퀀스' })
  gpSeq: number;

  @Column({
    name: 'group_seq',
    type: 'int',
    nullable: false,
    comment: '그룹 시퀀스',
  })
  groupSeq: number;

  @Column({
    name: 'playlist_seq',
    type: 'int',
    nullable: false,
    comment: '플레이리스트 시퀀스',
  })
  playlistSeq: number;

  @Column({
    name: 'gp_priority',
    type: 'tinyint',
    default: 0,
    comment: '우선순위 (0-99)',
  })
  gpPriority: number;

  @Column({
    name: 'schedule_start_time',
    type: 'time',
    nullable: true,
    comment: '시작 시간 (HH:mm:ss)',
  })
  scheduleStartTime: string | null;

  @Column({
    name: 'schedule_end_time',
    type: 'time',
    nullable: true,
    comment: '종료 시간 (HH:mm:ss)',
  })
  scheduleEndTime: string | null;

  @Column({
    name: 'schedule_days',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '요일 (1,2,3,4,5)',
  })
  scheduleDays: string | null;

  @Column({
    name: 'gp_status',
    type: 'enum',
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
    comment: '할당 상태',
  })
  gpStatus: 'ACTIVE' | 'INACTIVE';

  @Column({
    name: 'gp_isdel',
    type: 'char',
    length: 1,
    default: 'N',
    comment: '삭제 여부 (Y/N)',
  })
  gpIsdel: 'Y' | 'N';

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

  // Relations
  @ManyToOne(() => TbPlayerGroup, (group) => group.playlists, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_seq' })
  group: TbPlayerGroup;

  @ManyToOne(() => TbPlayList, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'playlist_seq' })
  playlist: TbPlayList;
}
