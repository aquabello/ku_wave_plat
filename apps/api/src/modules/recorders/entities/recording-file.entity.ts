import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TbRecordingSession } from './recording-session.entity';
import { TbFtpConfig } from '@modules/ftp/entities/ftp-config.entity';
import { FtpStatus } from '../enums/ftp-status.enum';

@Entity('tb_recording_file')
export class TbRecordingFile {
  @PrimaryGeneratedColumn({ name: 'rec_file_seq', comment: '파일 시퀀스' })
  recFileSeq: number;

  @Column({
    name: 'rec_session_seq',
    type: 'int',
    nullable: false,
    comment: '세션 시퀀스',
  })
  recSessionSeq: number;

  @Column({
    name: 'file_name',
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: '원본 파일명',
  })
  fileName: string;

  @Column({
    name: 'file_path',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '녹화기 내 파일 경로',
  })
  filePath: string | null;

  @Column({
    name: 'file_size',
    type: 'bigint',
    nullable: true,
    comment: '파일 크기 (bytes)',
  })
  fileSize: string | null; // bigint is returned as string by TypeORM

  @Column({
    name: 'file_format',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '파일 포맷 (mp4, avi)',
  })
  fileFormat: string | null;

  @Column({
    name: 'file_duration_sec',
    type: 'int',
    nullable: true,
    comment: '영상 길이 (초)',
  })
  fileDurationSec: number | null;

  @Column({
    name: 'ftp_status',
    type: 'enum',
    enum: FtpStatus,
    default: FtpStatus.PENDING,
    comment: 'FTP 업로드 상태',
  })
  ftpStatus: FtpStatus;

  @Column({
    name: 'ftp_config_seq',
    type: 'int',
    nullable: true,
    comment: 'FTP 설정 시퀀스',
  })
  ftpConfigSeq: number | null;

  @Column({
    name: 'ftp_uploaded_path',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'FTP 업로드 경로',
  })
  ftpUploadedPath: string | null;

  @Column({
    name: 'ftp_uploaded_at',
    type: 'datetime',
    nullable: true,
    comment: '업로드 완료 시각',
  })
  ftpUploadedAt: Date | null;

  @Column({
    name: 'ftp_retry_count',
    type: 'int',
    default: 0,
    comment: '재시도 횟수',
  })
  ftpRetryCount: number;

  @Column({
    name: 'ftp_error_message',
    type: 'text',
    nullable: true,
    comment: '업로드 실패 에러',
  })
  ftpErrorMessage: string | null;

  @Column({
    name: 'file_isdel',
    type: 'char',
    length: 1,
    default: 'N',
    comment: '삭제 여부',
  })
  fileIsdel: 'Y' | 'N';

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
  @ManyToOne(() => TbRecordingSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rec_session_seq' })
  session: TbRecordingSession;

  @ManyToOne(() => TbFtpConfig, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ftp_config_seq' })
  ftpConfig: TbFtpConfig | null;
}
