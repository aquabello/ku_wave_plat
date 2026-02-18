import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TbNfcReader } from './tb-nfc-reader.entity';
import { TbNfcCard } from './tb-nfc-card.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';

@Entity('tb_nfc_log')
export class TbNfcLog {
  @PrimaryGeneratedColumn({ name: 'nfc_log_seq', comment: 'NFC 로그 시퀀스' })
  nfcLogSeq: number;

  @Column({ name: 'reader_seq', type: 'int', nullable: false, comment: '리더기 시퀀스' })
  readerSeq: number;

  @Column({ name: 'card_seq', type: 'int', nullable: true, comment: '카드 시퀀스' })
  cardSeq: number | null;

  @Column({ name: 'tu_seq', type: 'int', nullable: true, comment: '사용자 시퀀스' })
  tuSeq: number | null;

  @Column({ name: 'space_seq', type: 'int', nullable: false, comment: '공간 시퀀스' })
  spaceSeq: number;

  @Column({
    name: 'log_type',
    type: 'enum',
    enum: ['ENTER', 'EXIT', 'DENIED', 'UNKNOWN'],
    nullable: false,
    comment: '로그 유형',
  })
  logType: 'ENTER' | 'EXIT' | 'DENIED' | 'UNKNOWN';

  @Column({
    name: 'tag_identifier',
    type: 'varchar',
    length: 64,
    nullable: false,
    comment: '태그 식별자',
  })
  tagIdentifier: string;

  @Column({
    name: 'tag_aid',
    type: 'varchar',
    length: 32,
    nullable: true,
    comment: '태그 AID',
  })
  tagAid: string | null;

  @Column({
    name: 'control_result',
    type: 'enum',
    enum: ['SUCCESS', 'FAIL', 'PARTIAL', 'SKIPPED'],
    nullable: true,
    comment: '제어 결과',
  })
  controlResult: 'SUCCESS' | 'FAIL' | 'PARTIAL' | 'SKIPPED' | null;

  @Column({
    name: 'control_detail',
    type: 'text',
    nullable: true,
    comment: '제어 상세 (JSON)',
  })
  controlDetail: string | null;

  @Column({
    name: 'tagged_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
    comment: '태그 시각',
  })
  taggedAt: Date | null;

  @ManyToOne(() => TbNfcReader)
  @JoinColumn({ name: 'reader_seq' })
  reader: TbNfcReader;

  @ManyToOne(() => TbNfcCard, { nullable: true })
  @JoinColumn({ name: 'card_seq' })
  card: TbNfcCard | null;

  @ManyToOne(() => TbUser, { nullable: true })
  @JoinColumn({ name: 'tu_seq' })
  user: TbUser | null;

  @ManyToOne(() => TbSpace)
  @JoinColumn({ name: 'space_seq' })
  space: TbSpace;
}
