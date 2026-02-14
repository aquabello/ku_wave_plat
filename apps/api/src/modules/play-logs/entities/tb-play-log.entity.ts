import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TbPlayer } from '@modules/players/entities/tb-player.entity';
import { TbPlayList } from '@modules/playlists/entities/tb-play-list.entity';
import { TbContent } from '@modules/contents/entities/tb-content.entity';

@Entity('tb_play_log')
export class TbPlayLog {
  @PrimaryGeneratedColumn({ name: 'log_seq', type: 'bigint', comment: '로그 시퀀스' })
  logSeq: string;

  @Column({
    name: 'player_seq',
    type: 'int',
    nullable: false,
    comment: '플레이어 시퀀스',
  })
  playerSeq: number;

  @Column({
    name: 'playlist_seq',
    type: 'int',
    nullable: true,
    comment: '플레이리스트 시퀀스',
  })
  playlistSeq: number | null;

  @Column({
    name: 'content_seq',
    type: 'int',
    nullable: false,
    comment: '콘텐츠 시퀀스',
  })
  contentSeq: number;

  @Column({
    name: 'zone_number',
    type: 'tinyint',
    default: 1,
    comment: '재생 영역 번호 (1~8)',
  })
  zoneNumber: number;

  @Column({
    name: 'play_started_at',
    type: 'datetime',
    nullable: false,
    comment: '재생 시작 시각',
  })
  playStartedAt: Date;

  @Column({
    name: 'play_ended_at',
    type: 'datetime',
    nullable: true,
    comment: '재생 종료 시각',
  })
  playEndedAt: Date | null;

  @Column({
    name: 'play_duration',
    type: 'int',
    nullable: true,
    comment: '실제 재생 시간 (초)',
  })
  playDuration: number | null;

  @Column({
    name: 'play_status',
    type: 'enum',
    enum: ['COMPLETED', 'SKIPPED', 'ERROR'],
    nullable: false,
    comment: '재생 상태',
  })
  playStatus: 'COMPLETED' | 'SKIPPED' | 'ERROR';

  @Column({
    name: 'error_message',
    type: 'text',
    nullable: true,
    comment: '오류 메시지',
  })
  errorMessage: string | null;

  // Relations
  @ManyToOne(() => TbPlayer, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'player_seq' })
  player: TbPlayer;

  @ManyToOne(() => TbPlayList, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'playlist_seq' })
  playlist: TbPlayList | null;

  @ManyToOne(() => TbContent, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'content_seq' })
  content: TbContent;
}
