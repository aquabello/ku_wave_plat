import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TbRecorder } from './recorder.entity';

@Entity('tb_recorder_preset')
export class TbRecorderPreset {
  @PrimaryGeneratedColumn({ name: 'rec_preset_seq', comment: '프리셋 시퀀스' })
  recPresetSeq: number;

  @Column({
    name: 'recorder_seq',
    type: 'int',
    nullable: false,
    comment: '녹화기 시퀀스',
  })
  recorderSeq: number;

  @Column({
    name: 'preset_name',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '프리셋명 (예: 칠판 중심, 강단 전체)',
  })
  presetName: string;

  @Column({
    name: 'preset_number',
    type: 'int',
    nullable: false,
    comment: '녹화기 내부 프리셋 번호',
  })
  presetNumber: number;

  @Column({
    name: 'pan_value',
    type: 'float',
    nullable: true,
    comment: 'Pan 값',
  })
  panValue: number | null;

  @Column({
    name: 'tilt_value',
    type: 'float',
    nullable: true,
    comment: 'Tilt 값',
  })
  tiltValue: number | null;

  @Column({
    name: 'zoom_value',
    type: 'float',
    nullable: true,
    comment: 'Zoom 값',
  })
  zoomValue: number | null;

  @Column({
    name: 'preset_description',
    type: 'text',
    nullable: true,
    comment: '프리셋 설명',
  })
  presetDescription: string | null;

  @Column({
    name: 'preset_order',
    type: 'int',
    default: 0,
    nullable: true,
    comment: '정렬 순서',
  })
  presetOrder: number | null;

  @Column({
    name: 'preset_isdel',
    type: 'char',
    length: 1,
    default: 'N',
    comment: '삭제 여부',
  })
  presetIsdel: 'Y' | 'N';

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
}
