import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { TbPlayListContent } from '@modules/playlists/entities/tb-play-list-content.entity';

@Entity('tb_content')
export class TbContent {
  @PrimaryGeneratedColumn({ name: 'content_seq', comment: '콘텐츠 시퀀스' })
  contentSeq: number;

  @Column({
    name: 'content_name',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '콘텐츠명',
  })
  contentName: string;

  @Column({
    name: 'content_code',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: '콘텐츠 코드',
  })
  contentCode: string;

  @Column({
    name: 'content_type',
    type: 'enum',
    enum: ['VIDEO', 'IMAGE', 'HTML', 'STREAM'],
    nullable: false,
    comment: '콘텐츠 타입',
  })
  contentType: 'VIDEO' | 'IMAGE' | 'HTML' | 'STREAM';

  @Column({
    name: 'content_file_path',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '파일 경로 (업로드 파일)',
  })
  contentFilePath: string | null;

  @Column({
    name: 'content_url',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '외부 URL (스트리밍)',
  })
  contentUrl: string | null;

  @Column({
    name: 'content_duration',
    type: 'int',
    nullable: true,
    comment: '재생 시간 (초)',
  })
  contentDuration: number | null;

  @Column({
    name: 'content_orientation',
    type: 'enum',
    enum: ['LANDSCAPE', 'PORTRAIT', 'BOTH'],
    nullable: true,
    comment: '지원 화면 방향',
  })
  contentOrientation: 'LANDSCAPE' | 'PORTRAIT' | 'BOTH' | null;

  @Column({
    name: 'content_category',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '카테고리',
  })
  contentCategory: string | null;

  @Column({
    name: 'content_tags',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '태그 (JSON/CSV)',
  })
  contentTags: string | null;

  @Column({
    name: 'valid_from',
    type: 'datetime',
    nullable: true,
    comment: '유효 시작일시',
  })
  validFrom: Date | null;

  @Column({
    name: 'valid_to',
    type: 'datetime',
    nullable: true,
    comment: '유효 종료일시',
  })
  validTo: Date | null;

  @Column({
    name: 'play_count',
    type: 'int',
    default: 0,
    comment: '총 재생 횟수',
  })
  playCount: number;

  @Column({
    name: 'content_status',
    type: 'enum',
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
    comment: '사용 상태',
  })
  contentStatus: 'ACTIVE' | 'INACTIVE';

  @Column({
    name: 'content_width',
    type: 'int',
    nullable: true,
    comment: '원본 가로 해상도',
  })
  contentWidth: number | null;

  @Column({
    name: 'content_height',
    type: 'int',
    nullable: true,
    comment: '원본 세로 해상도',
  })
  contentHeight: number | null;

  @Column({
    name: 'content_size',
    type: 'bigint',
    nullable: true,
    comment: '파일 크기 (bytes)',
  })
  contentSize: number | null;

  @Column({
    name: 'content_mime_type',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'MIME Type',
  })
  contentMimeType: string | null;

  @Column({
    name: 'content_thumbnail',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '썸네일 경로',
  })
  contentThumbnail: string | null;

  @Column({
    name: 'content_description',
    type: 'text',
    nullable: true,
    comment: '콘텐츠 설명',
  })
  contentDescription: string | null;

  @Column({
    name: 'content_order',
    type: 'int',
    default: 0,
    comment: '정렬 순서',
  })
  contentOrder: number;

  @Column({
    name: 'content_isdel',
    type: 'char',
    length: 1,
    default: 'N',
    comment: '삭제 여부 (Y/N)',
  })
  contentIsdel: 'Y' | 'N';

  @Column({
    name: 'reg_date',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
    comment: '등록일시',
  })
  regDate: Date | null;

  @Column({
    name: 'upd_date',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    nullable: true,
    comment: '수정일시',
  })
  updDate: Date | null;

  @OneToMany(() => TbPlayListContent, (plc) => plc.content)
  playlistContents: TbPlayListContent[];
}
