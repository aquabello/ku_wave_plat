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

  // 시스템 리소스
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

  // 디스플레이 정보
  @Column({
    name: 'display_status',
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: '화면 상태 (ON/OFF/STANDBY)',
  })
  displayStatus: string | null;

  @Column({
    name: 'resolution',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '현재 해상도',
  })
  resolution: string | null;

  @Column({
    name: 'orientation',
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: '화면 방향',
  })
  orientation: string | null;

  @Column({
    name: 'volume',
    type: 'tinyint',
    nullable: true,
    comment: '볼륨 레벨 (0-100)',
  })
  volume: number | null;

  // 네트워크 정보
  @Column({
    name: 'network_type',
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: '네트워크 종류 (ETHERNET/WIFI)',
  })
  networkType: string | null;

  @Column({
    name: 'network_speed',
    type: 'int',
    nullable: true,
    comment: '네트워크 속도 (Mbps)',
  })
  networkSpeed: number | null;

  // 기기 정보
  @Column({
    name: 'uptime',
    type: 'bigint',
    nullable: true,
    comment: '가동 시간 (초)',
  })
  uptime: number | null;

  @Column({
    name: 'storage_free',
    type: 'bigint',
    nullable: true,
    comment: '남은 저장공간 (MB)',
  })
  storageFree: number | null;

  @Column({
    name: 'os_version',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'OS 버전',
  })
  osVersion: string | null;

  @Column({
    name: 'last_download_at',
    type: 'datetime',
    nullable: true,
    comment: '마지막 콘텐츠 다운로드 시각',
  })
  lastDownloadAt: Date | null;

  // 레거시 (기존 데이터 보존용)
  @Column({
    name: 'current_playlist',
    type: 'int',
    nullable: true,
    comment: '[레거시] 현재 재생 중인 플레이리스트',
  })
  currentPlaylist: number | null;

  @Column({
    name: 'current_content',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '[레거시] 현재 재생 중인 콘텐츠',
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
