import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { ProcessStatus } from '../enums/process-status.enum';

@Entity('tb_ai_lecture_summary')
export class TbAiLectureSummary {
  @PrimaryGeneratedColumn({ name: 'summary_seq', comment: '시퀀스' })
  summarySeq: number;

  @Column({ name: 'space_seq', type: 'int', nullable: false, comment: '공간 시퀀스' })
  spaceSeq: number;

  @Column({ name: 'tu_seq', type: 'int', nullable: true, comment: '강의자 시퀀스' })
  tuSeq: number | null;

  @Column({ name: 'device_code', type: 'varchar', length: 50, nullable: false, comment: '미니PC 식별자' })
  deviceCode: string;

  @Column({ name: 'job_id', type: 'varchar', length: 36, nullable: false, unique: true, comment: 'ku_ai_worker Job UUID' })
  jobId: string;

  @Column({ name: 'recording_title', type: 'varchar', length: 200, nullable: true, comment: '강의 제목' })
  recordingTitle: string | null;

  @Column({ name: 'recording_filename', type: 'varchar', length: 255, nullable: false, comment: '원본 파일명' })
  recordingFilename: string;

  @Column({ name: 'duration_seconds', type: 'int', nullable: true, comment: '녹음 길이 (초)' })
  durationSeconds: number | null;

  @Column({ name: 'recorded_at', type: 'datetime', nullable: true, comment: '녹음 시각' })
  recordedAt: Date | null;

  @Column({ name: 'stt_text', type: 'longtext', nullable: true, comment: 'STT 전체 텍스트' })
  sttText: string | null;

  @Column({ name: 'stt_language', type: 'varchar', length: 10, nullable: true, comment: '감지 언어' })
  sttLanguage: string | null;

  @Column({ name: 'stt_confidence', type: 'float', nullable: true, comment: 'STT 신뢰도' })
  sttConfidence: number | null;

  @Column({ name: 'summary_text', type: 'longtext', nullable: true, comment: '요약 텍스트' })
  summaryText: string | null;

  @Column({ name: 'summary_keywords', type: 'text', nullable: true, comment: '키워드 JSON' })
  summaryKeywords: string | null;

  @Column({
    name: 'process_status',
    type: 'enum',
    enum: ProcessStatus,
    default: ProcessStatus.UPLOADING,
    nullable: false,
    comment: '처리 상태',
  })
  processStatus: ProcessStatus;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true, comment: '처리 완료 시각' })
  completedAt: Date | null;

  @Column({ name: 'session_seq', type: 'int', nullable: true, comment: '연결된 STT 세션 시퀀스' })
  sessionSeq: number | null;

  @Column({ name: 'summary_isdel', type: 'char', length: 1, default: 'N', nullable: false, comment: '삭제 여부' })
  summaryIsdel: string;

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
