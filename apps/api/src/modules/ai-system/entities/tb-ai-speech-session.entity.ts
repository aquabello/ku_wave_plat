import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { SpeechSessionStatus } from '../enums/speech-session-status.enum';

@Entity('tb_ai_speech_session')
export class TbAiSpeechSession {
  @PrimaryGeneratedColumn({ name: 'session_seq', comment: '세션 시퀀스' })
  sessionSeq: number;

  @Column({ name: 'space_seq', type: 'int', nullable: false, comment: '공간 시퀀스' })
  spaceSeq: number;

  @Column({ name: 'tu_seq', type: 'int', nullable: true, comment: '강의자 시퀀스' })
  tuSeq: number | null;

  @Column({
    name: 'session_status',
    type: 'enum',
    enum: SpeechSessionStatus,
    default: SpeechSessionStatus.ACTIVE,
    nullable: false,
    comment: '세션 상태',
  })
  sessionStatus: SpeechSessionStatus;

  @Column({ name: 'stt_engine', type: 'varchar', length: 50, default: 'faster-whisper', nullable: true, comment: 'STT 엔진명' })
  sttEngine: string | null;

  @Column({ name: 'stt_model', type: 'varchar', length: 50, default: 'small', nullable: true, comment: 'STT 모델명' })
  sttModel: string | null;

  @Column({ name: 'started_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', nullable: false, comment: '시작 시각' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'datetime', nullable: true, comment: '종료 시각' })
  endedAt: Date | null;

  @Column({ name: 'total_duration_sec', type: 'int', nullable: true, comment: '총 세션 시간 (초)' })
  totalDurationSec: number | null;

  @Column({ name: 'total_segments', type: 'int', default: 0, nullable: true, comment: '총 인식 구간 수' })
  totalSegments: number;

  @Column({ name: 'total_commands', type: 'int', default: 0, nullable: true, comment: '총 명령 실행 수' })
  totalCommands: number;

  @Column({ name: 'recording_filename', type: 'varchar', length: 255, nullable: true, comment: '녹음 파일명' })
  recordingFilename: string | null;

  @Column({ name: 'summary_seq', type: 'int', nullable: true, comment: '연결된 강의요약 시퀀스' })
  summarySeq: number | null;

  @Column({ name: 'session_isdel', type: 'char', length: 1, default: 'N', nullable: false, comment: '삭제 여부' })
  sessionIsdel: string;

  @Column({ name: 'reg_date', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', nullable: false, comment: '등록일시' })
  regDate: Date;

  @Column({ name: 'upd_date', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', nullable: false, comment: '수정일시' })
  updDate: Date;

  // Relations
  @ManyToOne(() => TbSpace)
  @JoinColumn({ name: 'space_seq' })
  space: TbSpace;

  @ManyToOne(() => TbUser, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tu_seq' })
  user: TbUser | null;
}
