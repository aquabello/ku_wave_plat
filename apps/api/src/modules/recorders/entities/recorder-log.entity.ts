import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TbRecorder } from './recorder.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { RecorderLogType, ResultStatus } from '../enums/log-type.enum';

@Entity('tb_recorder_log')
export class TbRecorderLog {
  @PrimaryGeneratedColumn({ name: 'rec_log_seq', comment: '로그 시퀀스' })
  recLogSeq: number;

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
    comment: '실행자 시퀀스',
  })
  tuSeq: number | null;

  @Column({
    name: 'log_type',
    type: 'enum',
    enum: RecorderLogType,
    comment: '명령 유형',
  })
  logType: RecorderLogType;

  @Column({
    name: 'command_detail',
    type: 'text',
    nullable: true,
    comment: '전송 명령 상세 (JSON)',
  })
  commandDetail: string | null;

  @Column({
    name: 'result_status',
    type: 'enum',
    enum: ResultStatus,
    comment: '실행 결과',
  })
  resultStatus: ResultStatus;

  @Column({
    name: 'result_message',
    type: 'text',
    nullable: true,
    comment: '응답 메시지',
  })
  resultMessage: string | null;

  @Column({
    name: 'executed_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '실행 시각',
  })
  executedAt: Date;

  // Relations
  @ManyToOne(() => TbRecorder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recorder_seq' })
  recorder: TbRecorder;

  @ManyToOne(() => TbUser, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tu_seq' })
  user: TbUser | null;
}
