import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TbUser } from '@modules/users/entities/tb-user.entity';

@Entity('tb_nfc_card')
export class TbNfcCard {
  @PrimaryGeneratedColumn({ name: 'card_seq', comment: 'NFC 카드 시퀀스' })
  cardSeq: number;

  @Column({ name: 'tu_seq', type: 'int', nullable: false, comment: '사용자 시퀀스' })
  tuSeq: number;

  @Column({
    name: 'card_identifier',
    type: 'varchar',
    length: 64,
    nullable: false,
    unique: true,
    comment: '카드 식별자',
  })
  cardIdentifier: string;

  @Column({
    name: 'card_aid',
    type: 'varchar',
    length: 32,
    nullable: true,
    comment: '카드 AID',
  })
  cardAid: string | null;

  @Column({
    name: 'card_label',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '카드 라벨',
  })
  cardLabel: string | null;

  @Column({
    name: 'card_type',
    type: 'enum',
    enum: ['CARD', 'PHONE'],
    default: 'CARD',
    comment: '카드 유형',
  })
  cardType: 'CARD' | 'PHONE';

  @Column({
    name: 'card_status',
    type: 'enum',
    enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'],
    default: 'ACTIVE',
    comment: '카드 상태',
  })
  cardStatus: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

  @Column({
    name: 'card_isdel',
    type: 'char',
    length: 1,
    default: 'N',
    comment: '삭제 여부',
  })
  cardIsdel: string;

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

  @ManyToOne(() => TbUser)
  @JoinColumn({ name: 'tu_seq' })
  user: TbUser;
}
