import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TbAiSpeechSession } from './tb-ai-speech-session.entity';
import { TbAiVoiceCommand } from './tb-ai-voice-command.entity';
import { CommandExecutionStatus } from '../enums/command-execution-status.enum';
import { VerifySource } from '../enums/verify-source.enum';

@Entity('tb_ai_command_log')
export class TbAiCommandLog {
  @PrimaryGeneratedColumn({ name: 'command_log_seq', comment: '명령로그 시퀀스' })
  commandLogSeq: number;

  @Column({ name: 'session_seq', type: 'int', nullable: false, comment: '세션 시퀀스' })
  sessionSeq: number;

  @Column({ name: 'voice_command_seq', type: 'int', nullable: true, comment: '매칭된 음성명령 시퀀스' })
  voiceCommandSeq: number | null;

  @Column({ name: 'recognized_text', type: 'varchar', length: 200, nullable: false, comment: '인식된 원문' })
  recognizedText: string;

  @Column({ name: 'matched_keyword', type: 'varchar', length: 100, nullable: true, comment: '매칭된 키워드' })
  matchedKeyword: string | null;

  @Column({ name: 'match_score', type: 'float', nullable: true, comment: '매칭 점수' })
  matchScore: number | null;

  @Column({
    name: 'verify_source',
    type: 'enum',
    enum: VerifySource,
    nullable: true,
    comment: '확정 소스',
  })
  verifySource: VerifySource | null;

  @Column({
    name: 'execution_status',
    type: 'enum',
    enum: CommandExecutionStatus,
    nullable: false,
    comment: '실행 상태',
  })
  executionStatus: CommandExecutionStatus;

  @Column({ name: 'execution_result', type: 'text', nullable: true, comment: '실행 결과 JSON' })
  executionResult: string | null;

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', nullable: false, comment: '실행 시각' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => TbAiSpeechSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_seq' })
  session: TbAiSpeechSession;

  @ManyToOne(() => TbAiVoiceCommand, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'voice_command_seq' })
  voiceCommand: TbAiVoiceCommand | null;
}
