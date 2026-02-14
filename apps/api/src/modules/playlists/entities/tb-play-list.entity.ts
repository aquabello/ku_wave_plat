import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { TbPlayListContent } from './tb-play-list-content.entity';
import { TbPlayer } from '@modules/players/entities/tb-player.entity';

@Entity('tb_play_list')
export class TbPlayList {
  @PrimaryGeneratedColumn({ name: 'playlist_seq', comment: '플레이리스트 시퀀스' })
  playlistSeq: number;

  @Column({
    name: 'playlist_name',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '플레이리스트명',
  })
  playlistName: string;

  @Column({
    name: 'playlist_code',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: '플레이리스트 코드',
  })
  playlistCode: string;

  @Column({
    name: 'playlist_type',
    type: 'enum',
    enum: ['NORMAL', 'EMERGENCY', 'ANNOUNCEMENT'],
    default: 'NORMAL',
    comment: '플레이리스트 유형',
  })
  playlistType: 'NORMAL' | 'EMERGENCY' | 'ANNOUNCEMENT';

  @Column({
    name: 'playlist_priority',
    type: 'tinyint',
    default: 0,
    comment: '우선순위 (0-99)',
  })
  playlistPriority: number;

  @Column({
    name: 'playlist_duration',
    type: 'int',
    nullable: true,
    comment: '총 재생 시간 (초, 계산값)',
  })
  playlistDuration: number | null;

  @Column({
    name: 'playlist_loop',
    type: 'char',
    length: 1,
    default: 'Y',
    comment: '반복 재생 여부 (Y/N)',
  })
  playlistLoop: 'Y' | 'N';

  @Column({
    name: 'playlist_random',
    type: 'char',
    length: 1,
    default: 'N',
    comment: '랜덤 재생 여부 (Y/N)',
  })
  playlistRandom: 'Y' | 'N';

  @Column({
    name: 'playlist_screen_layout',
    type: 'enum',
    enum: ['1x1', '1x2', '1x3', '1x4', '2x2', '2x4', '1x8'],
    default: '1x1',
    comment: '화면 분할 레이아웃',
  })
  playlistScreenLayout: '1x1' | '1x2' | '1x3' | '1x4' | '2x2' | '2x4' | '1x8';

  @Column({
    name: 'playlist_status',
    type: 'enum',
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
    comment: '사용 상태',
  })
  playlistStatus: 'ACTIVE' | 'INACTIVE';

  @Column({
    name: 'playlist_description',
    type: 'text',
    nullable: true,
    comment: '플레이리스트 설명',
  })
  playlistDescription: string | null;

  @Column({
    name: 'playlist_order',
    type: 'int',
    default: 0,
    comment: '정렬 순서',
  })
  playlistOrder: number;

  @Column({
    name: 'playlist_isdel',
    type: 'char',
    length: 1,
    default: 'N',
    comment: '삭제 여부 (Y/N)',
  })
  playlistIsdel: 'Y' | 'N';

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

  @OneToMany(() => TbPlayListContent, (plc) => plc.playlist)
  playlistContents: TbPlayListContent[];

  @OneToMany(() => TbPlayer, (player) => player.playlist)
  players: TbPlayer[];
}
