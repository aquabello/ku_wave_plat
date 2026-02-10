import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tb_users')
export class TbUser {
  @PrimaryGeneratedColumn({ name: 'tu_seq', comment: '시퀀스' })
  seq: number;

  @Column({
    name: 'tu_id',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '아이디',
  })
  id: string | null;

  @Column({
    name: 'tu_pw',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '패스워드',
  })
  password: string | null;

  @Column({
    name: 'tu_name',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '이름',
  })
  name: string | null;

  @Column({
    name: 'tu_phone',
    type: 'varchar',
    length: 15,
    nullable: true,
    comment: '휴대폰',
  })
  phone: string | null;

  @Column({
    name: 'tu_email',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '이메일',
  })
  email: string | null;

  @Column({
    name: 'tu_isdel',
    type: 'char',
    nullable: true,
    comment: '삭제여부',
  })
  isDel: string | null;

  @Column({
    name: 'tu_step',
    type: 'char',
    length: 2,
    nullable: true,
    comment: '상태',
  })
  step: string | null;

  @Column({
    name: 'tu_type',
    type: 'char',
    length: 6,
    nullable: true,
    comment: '타입',
  })
  type: string | null;

  @Column({
    name: 'tu_content_yn',
    type: 'enum',
    enum: ['Y', 'N'],
    default: 'Y',
    nullable: true,
    comment: '콘텐츠 사용여부',
  })
  contentYn: 'Y' | 'N' | null;

  @Column({
    name: 'tu_work_type',
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: '계약타입',
  })
  workType: string | null;

  @Column({
    name: 'tu_last_access_date',
    type: 'datetime',
    nullable: true,
    comment: '마지막 접속',
  })
  lastAccessDate: Date | null;

  @Column({
    name: 'tu_log',
    type: 'text',
    nullable: true,
    comment: '로그',
  })
  log: string | null;

  @Column({
    name: 'tu_new_noti',
    type: 'char',
    nullable: true,
    comment: '알림정보',
  })
  newNoti: string | null;

  @Column({
    name: 'tu_access_token',
    type: 'varchar',
    length: 300,
    nullable: true,
    comment: '접근토큰',
  })
  accessToken: string | null;

  @Column({
    name: 'tu_refresh_token',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '리프레시토큰',
  })
  refreshToken: string | null;

  @Column({
    name: 'tu_push_token',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'PUSH 토큰',
  })
  pushToken: string | null;

  @Column({
    name: 'tu_device_name',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '디바이스명',
  })
  deviceName: string | null;

  @Column({
    name: 'tu_app_ver',
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: '앱버전',
  })
  appVer: string | null;

  @Column({
    name: 'si_seq',
    type: 'int',
    nullable: true,
    comment: '사이트정보',
  })
  siSeq: number | null;

  @Column({
    name: 'tu_approved_date',
    type: 'datetime',
    nullable: true,
    comment: '승인일시',
  })
  approvedDate: Date | null;

  @Column({
    name: 'tu_token_ver',
    type: 'int',
    default: 1,
    comment: '토큰 버전 (권한 변경 시 +1 → 강제 재로그인)',
  })
  tokenVer: number;

  @Column({
    name: 'reg_date',
    type: 'datetime',
    nullable: true,
    comment: '등록일',
  })
  regDate: Date | null;
}
