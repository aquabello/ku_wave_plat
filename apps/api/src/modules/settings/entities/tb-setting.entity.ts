import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tb_setting')
export class TbSetting {
  @PrimaryGeneratedColumn({ name: 'ts_seq', comment: '시퀀스' })
  seq: number;

  @Column({
    name: 'ts_api_time',
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: 'API 실행 시간',
  })
  apiTime: string | null;

  @Column({
    name: 'ts_player_time',
    type: 'varchar',
    length: 10,
    nullable: true,
    default: '1',
    comment: '플레이어 실행 주기',
  })
  playerTime: string | null;

  @Column({
    name: 'ts_screen_start',
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: '스크린 세이버 시작',
  })
  screenStart: string | null;

  @Column({
    name: 'ts_screen_end',
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: '스크린 세이버 종료',
  })
  screenEnd: string | null;

  @Column({
    name: 'ts_player_ver',
    type: 'varchar',
    length: 10,
    nullable: true,
    default: '1.0.0',
    comment: '플레이어 버전',
  })
  playerVer: string | null;

  @Column({
    name: 'ts_player_link',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '플레이어 다운로드 링크',
  })
  playerLink: string | null;

  @Column({
    name: 'ts_watcher_ver',
    type: 'varchar',
    length: 10,
    nullable: true,
    default: '1.0.0',
    comment: '와처 버전',
  })
  watcherVer: string | null;

  @Column({
    name: 'ts_watcher_link',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '와처 다운로드 링크',
  })
  watcherLink: string | null;

  @Column({
    name: 'ts_notice_link',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '공지사항 링크',
  })
  noticeLink: string | null;

  @Column({
    name: 'ts_intro_link',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '인트로 링크',
  })
  introLink: string | null;

  @Column({
    name: 'ts_default_image',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'DID 플레이어 기본 이미지 경로',
  })
  defaultImage: string | null;

  @Column({ name: 'reg_date', type: 'datetime', comment: '등록일' })
  regDate: Date;
}
