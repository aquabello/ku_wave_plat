import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { RecorderStatus } from '../enums/recorder-status.enum';
import { RecorderProtocol } from '../enums/recorder-protocol.enum';

@Entity('tb_recorder')
export class TbRecorder {
  @PrimaryGeneratedColumn({ name: 'recorder_seq', comment: '녹화기 시퀀스' })
  recorderSeq: number;

  @Column({
    name: 'space_seq',
    type: 'int',
    nullable: false,
    comment: '공간 시퀀스',
  })
  spaceSeq: number;

  @Column({
    name: 'recorder_name',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '녹화기명',
  })
  recorderName: string;

  @Column({
    name: 'recorder_ip',
    type: 'varchar',
    length: 45,
    nullable: false,
    comment: '고정 IP',
  })
  recorderIp: string;

  @Column({
    name: 'recorder_port',
    type: 'int',
    default: 80,
    nullable: true,
    comment: '통신 포트',
  })
  recorderPort: number | null;

  @Column({
    name: 'recorder_protocol',
    type: 'enum',
    enum: RecorderProtocol,
    default: RecorderProtocol.HTTP,
    comment: '통신 프로토콜',
  })
  recorderProtocol: RecorderProtocol;

  @Column({
    name: 'recorder_username',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '녹화기 로그인 ID',
  })
  recorderUsername: string | null;

  @Column({
    name: 'recorder_password',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '녹화기 로그인 PW (AES 암호화)',
  })
  recorderPassword: string | null;

  @Column({
    name: 'recorder_model',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '녹화기 모델명/제조사',
  })
  recorderModel: string | null;

  @Column({
    name: 'recorder_status',
    type: 'enum',
    enum: RecorderStatus,
    default: RecorderStatus.OFFLINE,
    comment: '녹화기 상태',
  })
  recorderStatus: RecorderStatus;

  @Column({
    name: 'current_user_seq',
    type: 'int',
    nullable: true,
    comment: '현재 사용 중인 사용자',
  })
  currentUserSeq: number | null;

  @Column({
    name: 'last_health_check',
    type: 'datetime',
    nullable: true,
    comment: '마지막 상태 확인 시각',
  })
  lastHealthCheck: Date | null;

  @Column({
    name: 'recorder_order',
    type: 'int',
    default: 0,
    nullable: true,
    comment: '정렬 순서',
  })
  recorderOrder: number | null;

  @Column({
    name: 'recorder_isdel',
    type: 'char',
    length: 1,
    default: 'N',
    comment: '삭제 여부',
  })
  recorderIsdel: 'Y' | 'N';

  @Column({
    name: 'reg_date',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '등록일시',
  })
  regDate: Date;

  @Column({
    name: 'upd_date',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    comment: '수정일시',
  })
  updDate: Date;

  // Relations
  @ManyToOne(() => TbSpace)
  @JoinColumn({ name: 'space_seq' })
  space: TbSpace;

  @ManyToOne(() => TbUser, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'current_user_seq' })
  currentUser: TbUser | null;
}
