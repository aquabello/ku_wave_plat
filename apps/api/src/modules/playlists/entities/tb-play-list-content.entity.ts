import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TbPlayList } from './tb-play-list.entity';
import { TbContent } from '@modules/contents/entities/tb-content.entity';

@Entity('tb_play_list_content')
export class TbPlayListContent {
  @PrimaryGeneratedColumn({ name: 'plc_seq', comment: '매핑 시퀀스' })
  plcSeq: number;

  @Column({
    name: 'playlist_seq',
    type: 'int',
    nullable: false,
    comment: '플레이리스트 시퀀스',
  })
  playlistSeq: number;

  @Column({
    name: 'content_seq',
    type: 'int',
    nullable: false,
    comment: '콘텐츠 시퀀스',
  })
  contentSeq: number;

  @Column({
    name: 'play_order',
    type: 'int',
    default: 0,
    comment: '재생 순서',
  })
  playOrder: number;

  @Column({
    name: 'play_duration',
    type: 'int',
    nullable: true,
    comment: '재생 시간 오버라이드 (NULL이면 원본 사용)',
  })
  playDuration: number | null;

  @Column({
    name: 'transition_effect',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '전환 효과 (fade, slide 등)',
  })
  transitionEffect: string | null;

  @Column({
    name: 'transition_duration',
    type: 'int',
    default: 0,
    comment: '전환 시간 (밀리초)',
  })
  transitionDuration: number;

  @Column({
    name: 'zone_number',
    type: 'tinyint',
    default: 1,
    comment: '영역 번호 (1~8)',
  })
  zoneNumber: number;

  @Column({
    name: 'zone_width',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 100.00,
    comment: '영역 너비 (%)',
  })
  zoneWidth: number;

  @Column({
    name: 'zone_height',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 100.00,
    comment: '영역 높이 (%)',
  })
  zoneHeight: number;

  @Column({
    name: 'zone_x_position',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0.00,
    comment: 'X 좌표 (%)',
  })
  zoneXPosition: number;

  @Column({
    name: 'zone_y_position',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0.00,
    comment: 'Y 좌표 (%)',
  })
  zoneYPosition: number;

  @Column({
    name: 'plc_isdel',
    type: 'char',
    length: 1,
    default: 'N',
    comment: '삭제 여부 (Y/N)',
  })
  plcIsdel: 'Y' | 'N';

  @Column({
    name: 'reg_date',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
    comment: '등록일시',
  })
  regDate: Date | null;

  @ManyToOne(() => TbPlayList, (playlist) => playlist.playlistContents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'playlist_seq' })
  playlist: TbPlayList;

  @ManyToOne(() => TbContent, (content) => content.playlistContents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'content_seq' })
  content: TbContent;
}
