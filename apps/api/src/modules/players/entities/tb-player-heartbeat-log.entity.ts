import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TbPlayer } from './tb-player.entity';

@Entity('tb_player_heartbeat_log')
export class TbPlayerHeartbeatLog {
  @PrimaryGeneratedColumn({ name: 'heartbeat_seq', comment: 'Heartbeat 시퀀스' })
  heartbeatSeq: number;

  @Column({
    name: 'player_seq',
    type: 'int',
    nullable: false,
    comment: '플레이어 시퀀스',
  })
  playerSeq: number;

  @Column({
    name: 'heartbeat_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
    comment: 'Health Check 시각',
  })
  heartbeatAt: Date;

  @Column({
    name: 'player_ip',
    type: 'varchar',
    length: 45,
    nullable: true,
    comment: '요청 IP (검증용)',
  })
  playerIp: string | null;

  @Column({
    name: 'player_version',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '보고된 버전',
  })
  playerVersion: string | null;

  @Column({
    name: 'cpu_usage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'CPU 사용률 (%)',
  })
  cpuUsage: number | null;

  @Column({
    name: 'memory_usage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: '메모리 사용률 (%)',
  })
  memoryUsage: number | null;

  @Column({
    name: 'disk_usage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: '디스크 사용률 (%)',
  })
  diskUsage: number | null;

  @Column({
    name: 'current_playlist',
    type: 'int',
    nullable: true,
    comment: '현재 재생 중인 플레이리스트',
  })
  currentPlaylist: number | null;

  @Column({
    name: 'current_content',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '현재 재생 중인 콘텐츠',
  })
  currentContent: string | null;

  @Column({
    name: 'error_message',
    type: 'text',
    nullable: true,
    comment: '에러 메시지 (있을 경우)',
  })
  errorMessage: string | null;

  @ManyToOne(() => TbPlayer, (player) => player.heartbeatLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'player_seq' })
  player: TbPlayer;
}
