import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TbRecorder } from '@modules/recorders/entities/recorder.entity';

@Entity('tb_ftp_config')
export class TbFtpConfig {
  @PrimaryGeneratedColumn({ name: 'ftp_config_seq', comment: 'FTP 설정 시퀀스' })
  ftpConfigSeq: number;

  @Column({
    name: 'recorder_seq',
    type: 'int',
    nullable: true,
    comment: '녹화기 시퀀스 (NULL=글로벌 기본)',
  })
  recorderSeq: number | null;

  @Column({
    name: 'ftp_name',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '설정명',
  })
  ftpName: string;

  @Column({
    name: 'ftp_host',
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'FTP 호스트',
  })
  ftpHost: string;

  @Column({
    name: 'ftp_port',
    type: 'int',
    default: 21,
    comment: 'FTP 포트',
  })
  ftpPort: number;

  @Column({
    name: 'ftp_username',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'FTP 계정',
  })
  ftpUsername: string;

  @Column({
    name: 'ftp_password',
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'FTP 비밀번호 (AES 암호화)',
  })
  ftpPassword: string;

  @Column({
    name: 'ftp_path',
    type: 'varchar',
    length: 500,
    default: '/',
    nullable: true,
    comment: '업로드 기본 경로',
  })
  ftpPath: string | null;

  @Column({
    name: 'ftp_protocol',
    type: 'enum',
    enum: ['FTP', 'SFTP', 'FTPS'],
    default: 'FTP',
    comment: '프로토콜',
  })
  ftpProtocol: 'FTP' | 'SFTP' | 'FTPS';

  @Column({
    name: 'ftp_passive_mode',
    type: 'char',
    length: 1,
    default: 'Y',
    comment: '패시브 모드 여부',
  })
  ftpPassiveMode: 'Y' | 'N';

  @Column({
    name: 'is_default',
    type: 'char',
    length: 1,
    default: 'N',
    comment: '기본 설정 여부',
  })
  isDefault: 'Y' | 'N';

  @Column({
    name: 'ftp_isdel',
    type: 'char',
    length: 1,
    default: 'N',
    comment: '삭제 여부',
  })
  ftpIsdel: 'Y' | 'N';

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
  recorder: TbRecorder | null;
}
