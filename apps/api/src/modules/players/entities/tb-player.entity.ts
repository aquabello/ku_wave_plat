import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { TbBuilding } from '@modules/buildings/entities/tb-building.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbPlayList } from '@modules/playlists/entities/tb-play-list.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { TbPlayerHeartbeatLog } from './tb-player-heartbeat-log.entity';

@Entity('tb_player')
export class TbPlayer {
  @PrimaryGeneratedColumn({ name: 'player_seq', comment: '플레이어 시퀀스' })
  playerSeq: number;

  // 기본 정보
  @Column({
    name: 'player_name',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '플레이어명 (예: 본관 1층 로비 디스플레이)',
  })
  playerName: string;

  @Column({
    name: 'player_code',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: '플레이어 코드 (예: PLAYER-001)',
  })
  playerCode: string;

  @Column({
    name: 'player_did',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Device ID (하드웨어 고유 식별자)',
  })
  playerDid: string | null;

  @Column({
    name: 'player_mac',
    type: 'varchar',
    length: 17,
    nullable: true,
    comment: 'MAC 주소 (AA:BB:CC:DD:EE:FF)',
  })
  playerMac: string | null;

  // 관계 매핑
  @Column({
    name: 'building_seq',
    type: 'int',
    nullable: false,
    comment: '건물 시퀀스',
  })
  buildingSeq: number;

  @Column({
    name: 'space_seq',
    type: 'int',
    nullable: true,
    comment: '공간 시퀀스 (선택적, 상세 위치 지정)',
  })
  spaceSeq: number | null;

  @Column({
    name: 'playlist_seq',
    type: 'int',
    nullable: true,
    comment: '현재 활성 플레이리스트 시퀀스',
  })
  playlistSeq: number | null;

  // 네트워크 정보
  @Column({
    name: 'player_ip',
    type: 'varchar',
    length: 45,
    nullable: false,
    comment: '플레이어 IP (IPv4/IPv6)',
  })
  playerIp: string;

  @Column({
    name: 'player_port',
    type: 'int',
    default: 9090,
    comment: '플레이어 통신 포트',
  })
  playerPort: number;

  // 인증 및 보안
  @Column({
    name: 'player_api_key',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'API Key (플레이어 인증용)',
  })
  playerApiKey: string;

  @Column({
    name: 'player_secret',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '암호화된 시크릿 (필요 시)',
  })
  playerSecret: string | null;

  // 승인 프로세스
  @Column({
    name: 'player_approval',
    type: 'enum',
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    comment: '승인 상태',
  })
  playerApproval: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Column({
    name: 'approved_by',
    type: 'int',
    nullable: true,
    comment: '승인자 시퀀스',
  })
  approvedBy: number | null;

  @Column({
    name: 'approved_at',
    type: 'datetime',
    nullable: true,
    comment: '승인 일시',
  })
  approvedAt: Date | null;

  @Column({
    name: 'reject_reason',
    type: 'text',
    nullable: true,
    comment: '반려 사유',
  })
  rejectReason: string | null;

  // 상태 관리
  @Column({
    name: 'player_status',
    type: 'enum',
    enum: ['ONLINE', 'OFFLINE', 'ERROR', 'MAINTENANCE'],
    default: 'OFFLINE',
    comment: '플레이어 현재 상태',
  })
  playerStatus: 'ONLINE' | 'OFFLINE' | 'ERROR' | 'MAINTENANCE';

  @Column({
    name: 'last_heartbeat_at',
    type: 'datetime',
    nullable: true,
    comment: '마지막 Health Check 시각',
  })
  lastHeartbeatAt: Date | null;

  @Column({
    name: 'last_content_played',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '마지막 재생 콘텐츠 (비정규화)',
  })
  lastContentPlayed: string | null;

  // 플레이어 정보
  @Column({
    name: 'player_version',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '플레이어 SW 버전',
  })
  playerVersion: string | null;

  @Column({
    name: 'player_resolution',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '화면 해상도 (예: 1920x1080)',
  })
  playerResolution: string | null;

  @Column({
    name: 'player_orientation',
    type: 'enum',
    enum: ['LANDSCAPE', 'PORTRAIT'],
    default: 'LANDSCAPE',
    comment: '화면 방향',
  })
  playerOrientation: 'LANDSCAPE' | 'PORTRAIT';

  @Column({
    name: 'default_volume',
    type: 'tinyint',
    default: 50,
    comment: '기본 볼륨 (0-100)',
  })
  defaultVolume: number;

  // 메타데이터
  @Column({
    name: 'player_description',
    type: 'text',
    nullable: true,
    comment: '플레이어 설명/메모',
  })
  playerDescription: string | null;

  @Column({
    name: 'player_order',
    type: 'int',
    default: 0,
    comment: '정렬 순서',
  })
  playerOrder: number;

  @Column({
    name: 'player_isdel',
    type: 'char',
    length: 1,
    default: 'N',
    comment: '삭제 여부 (Y/N)',
  })
  playerIsdel: 'Y' | 'N';

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
  @ManyToOne(() => TbBuilding, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'building_seq' })
  building: TbBuilding;

  @ManyToOne(() => TbSpace, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'space_seq' })
  space: TbSpace | null;

  @ManyToOne(() => TbPlayList, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'playlist_seq' })
  playlist: TbPlayList | null;

  @ManyToOne(() => TbUser, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'approved_by' })
  approver: TbUser | null;

  @OneToMany(() => TbPlayerHeartbeatLog, (log) => log.player)
  heartbeatLogs: TbPlayerHeartbeatLog[];
}
