import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TbRecorder } from './recorder.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { TbRecorderPreset } from './recorder-preset.entity';
import { SessionStatus } from '../enums/session-status.enum';

@Entity('tb_recording_session')
export class TbRecordingSession {
  @PrimaryGeneratedColumn({ name: 'rec_session_seq', comment: '세션 시퀀스' })
  recSessionSeq: number;

  @Column({
    name: 'recorder_seq',
    type: 'int',
    nullable: false,
    comment: '녹화기 시퀀스',
  })
  recorderSeq: number;

  @Column({
    name: 'tu_seq',
    type: 'int',
    nullable: true,
    comment: '녹화 시작 사용자',
  })
  tuSeq: number | null;

  @Column({
    name: 'session_status',
    type: 'enum',
    enum: SessionStatus,
    comment: '세션 상태',
  })
  sessionStatus: SessionStatus;

  @Column({
    name: 'rec_preset_seq',
    type: 'int',
    nullable: true,
    comment: '사용된 프리셋',
  })
  recPresetSeq: number | null;

  @Column({
    name: 'session_title',
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: '강의명 / 메모',
  })
  sessionTitle: string | null;

  @Column({
    name: 'started_at',
    type: 'datetime',
    nullable: false,
    comment: '녹화 시작 시각',
  })
  startedAt: Date;

  @Column({
    name: 'ended_at',
    type: 'datetime',
    nullable: true,
    comment: '녹화 종료 시각',
  })
  endedAt: Date | null;

  @Column({
    name: 'duration_sec',
    type: 'int',
    nullable: true,
    comment: '녹화 시간 (초)',
  })
  durationSec: number | null;

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
  @ManyToOne(() => TbRecorder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recorder_seq' })
  recorder: TbRecorder;

  @ManyToOne(() => TbUser, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tu_seq' })
  user: TbUser | null;

  @ManyToOne(() => TbRecorderPreset, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'rec_preset_seq' })
  preset: TbRecorderPreset | null;
}
