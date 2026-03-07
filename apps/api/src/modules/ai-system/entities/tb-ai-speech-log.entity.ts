import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TbAiSpeechSession } from './tb-ai-speech-session.entity';

@Entity('tb_ai_speech_log')
export class TbAiSpeechLog {
  @PrimaryGeneratedColumn({ name: 'speech_log_seq', comment: '음성로그 시퀀스' })
  speechLogSeq: number;

  @Column({ name: 'session_seq', type: 'int', nullable: false, comment: '세션 시퀀스' })
  sessionSeq: number;

  @Column({ name: 'segment_text', type: 'text', nullable: false, comment: '인식된 텍스트' })
  segmentText: string;

  @Column({ name: 'segment_start_sec', type: 'float', nullable: true, comment: '구간 시작 (초)' })
  segmentStartSec: number | null;

  @Column({ name: 'segment_end_sec', type: 'float', nullable: true, comment: '구간 종료 (초)' })
  segmentEndSec: number | null;

  @Column({ name: 'confidence', type: 'float', nullable: true, comment: 'STT 신뢰도' })
  confidence: number | null;

  @Column({ name: 'is_command', type: 'char', length: 1, default: 'N', nullable: false, comment: '명령어 인식 여부' })
  isCommand: string;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', nullable: false, comment: '생성일시' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => TbAiSpeechSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_seq' })
  session: TbAiSpeechSession;
}
