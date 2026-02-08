import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tb_activity_log')
export class TbActivityLog {
  @PrimaryGeneratedColumn({ name: 'log_seq', type: 'bigint', comment: '로그 시퀀스' })
  logSeq: number;

  @Column({ name: 'tu_seq', type: 'int', nullable: true, comment: '사용자 시퀀스' })
  tuSeq: number | null;

  @Column({ name: 'tu_id', type: 'varchar', length: 20, nullable: true, comment: '사용자 아이디' })
  tuId: string | null;

  @Column({ name: 'tu_name', type: 'varchar', length: 50, nullable: true, comment: '사용자 이름' })
  tuName: string | null;

  @Column({ name: 'http_method', type: 'varchar', length: 10, comment: 'HTTP 메서드' })
  httpMethod: string;

  @Column({ name: 'request_url', type: 'varchar', length: 500, comment: '요청 URL' })
  requestUrl: string;

  @Column({ name: 'action_name', type: 'varchar', length: 100, nullable: true, comment: '행위명' })
  actionName: string | null;

  @Column({ name: 'status_code', type: 'int', nullable: true, comment: 'HTTP 응답 코드' })
  statusCode: number | null;

  @Column({ name: 'request_body', type: 'json', nullable: true, comment: '요청 데이터' })
  requestBody: Record<string, unknown> | null;

  @Column({ name: 'response_body', type: 'json', nullable: true, comment: '응답 데이터' })
  responseBody: Record<string, unknown> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true, comment: 'IP 주소' })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true, comment: 'User-Agent' })
  userAgent: string | null;

  @Column({ name: 'duration_ms', type: 'int', nullable: true, comment: '처리시간(ms)' })
  durationMs: number | null;

  @Column({ name: 'reg_date', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', nullable: true, comment: '발생일시' })
  regDate: Date | null;
}
