import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TbRecorder } from './recorder.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';

@Entity('tb_recorder_user')
export class TbRecorderUser {
  @PrimaryGeneratedColumn({ name: 'recorder_user_seq', comment: '시퀀스' })
  recorderUserSeq: number;

  @Column({
    name: 'recorder_seq',
    type: 'int',
    nullable: false,
    comment: '녹화기 시퀀스',
  })
  recorderSeq: number;

  @Column({
    name: 'tu_seq',
    type: 'int',
    nullable: false,
    comment: '사용자(교수) 시퀀스',
  })
  tuSeq: number;

  @Column({
    name: 'is_default',
    type: 'char',
    length: 1,
    default: 'N',
    comment: '기본 사용자 여부',
  })
  isDefault: 'Y' | 'N';

  @Column({
    name: 'recorder_user_isdel',
    type: 'char',
    length: 1,
    default: 'N',
    comment: '삭제 여부',
  })
  recorderUserIsdel: 'Y' | 'N';

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
  recorder: TbRecorder;

  @ManyToOne(() => TbUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tu_seq' })
  user: TbUser;
}
