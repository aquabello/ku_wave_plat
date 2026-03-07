import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { WorkerServerStatus } from '../enums/worker-server-status.enum';

@Entity('tb_ai_worker_server')
export class TbAiWorkerServer {
  @PrimaryGeneratedColumn({ name: 'worker_server_seq', comment: 'Worker 서버 시퀀스' })
  workerServerSeq: number;

  @Column({ name: 'server_name', type: 'varchar', length: 100, nullable: false, comment: '서버명' })
  serverName: string;

  @Column({ name: 'server_url', type: 'varchar', length: 255, nullable: false, unique: true, comment: '서버 URL' })
  serverUrl: string;

  @Column({ name: 'api_key', type: 'varchar', length: 255, nullable: false, comment: 'API 인증키' })
  apiKey: string;

  @Column({ name: 'callback_secret', type: 'varchar', length: 255, nullable: true, comment: 'Webhook 검증용 Secret' })
  callbackSecret: string | null;

  @Column({
    name: 'server_status',
    type: 'enum',
    enum: WorkerServerStatus,
    default: WorkerServerStatus.OFFLINE,
    nullable: false,
    comment: '서버 상태',
  })
  serverStatus: WorkerServerStatus;

  @Column({ name: 'last_health_check', type: 'datetime', nullable: true, comment: '마지막 헬스체크 시각' })
  lastHealthCheck: Date | null;

  @Column({ name: 'gpu_info', type: 'varchar', length: 200, nullable: true, comment: 'GPU 정보' })
  gpuInfo: string | null;

  @Column({ name: 'max_concurrent_jobs', type: 'int', default: 1, nullable: false, comment: '동시 처리 가능 Job 수' })
  maxConcurrentJobs: number;

  @Column({ name: 'default_stt_model', type: 'varchar', length: 50, default: 'large-v3', nullable: true, comment: '기본 STT 모델' })
  defaultSttModel: string | null;

  @Column({ name: 'default_llm_model', type: 'varchar', length: 50, default: 'llama3', nullable: true, comment: '기본 요약 LLM 모델' })
  defaultLlmModel: string | null;

  @Column({ name: 'server_isdel', type: 'char', length: 1, default: 'N', nullable: false, comment: '삭제 여부' })
  serverIsdel: string;

  @Column({ name: 'reg_date', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', nullable: false, comment: '등록일시' })
  regDate: Date;

  @Column({ name: 'upd_date', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', nullable: false, comment: '수정일시' })
  updDate: Date;
}
