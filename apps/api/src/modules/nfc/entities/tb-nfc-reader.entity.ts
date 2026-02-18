import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';

@Entity('tb_nfc_reader')
export class TbNfcReader {
  @PrimaryGeneratedColumn({ name: 'reader_seq', comment: 'NFC 리더기 시퀀스' })
  readerSeq: number;

  @Column({ name: 'space_seq', type: 'int', nullable: false, comment: '공간 시퀀스' })
  spaceSeq: number;

  @Column({
    name: 'reader_name',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '리더기명',
  })
  readerName: string;

  @Column({
    name: 'reader_code',
    type: 'varchar',
    length: 50,
    nullable: false,
    unique: true,
    comment: '리더기 코드',
  })
  readerCode: string;

  @Column({
    name: 'reader_serial',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '리더기 시리얼 번호',
  })
  readerSerial: string | null;

  @Column({
    name: 'reader_api_key',
    type: 'varchar',
    length: 100,
    nullable: false,
    unique: true,
    comment: '리더기 API 키',
  })
  readerApiKey: string;

  @Column({
    name: 'reader_status',
    type: 'enum',
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
    comment: '리더기 상태',
  })
  readerStatus: 'ACTIVE' | 'INACTIVE';

  @Column({
    name: 'reader_isdel',
    type: 'char',
    length: 1,
    default: 'N',
    comment: '삭제 여부',
  })
  readerIsdel: string;

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

  @ManyToOne(() => TbSpace)
  @JoinColumn({ name: 'space_seq' })
  space: TbSpace;
}
