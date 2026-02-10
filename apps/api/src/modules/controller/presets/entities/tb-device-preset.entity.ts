import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { TbPresetCommand } from './tb-preset-command.entity';

@Entity('tb_device_preset')
export class TbDevicePreset {
  @PrimaryGeneratedColumn({ name: 'preset_seq', comment: '프리셋 시퀀스' })
  presetSeq: number;

  @Column({
    name: 'preset_name',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '프리셋명 (예: 강의실 프로젝터)',
  })
  presetName: string;

  @Column({
    name: 'protocol_type',
    type: 'enum',
    enum: ['TCP', 'UDP', 'WOL', 'HTTP', 'RS232'],
    nullable: false,
    comment: '통신 프로토콜',
  })
  protocolType: string;

  @Column({
    name: 'comm_ip',
    type: 'varchar',
    length: 45,
    nullable: true,
    comment: '기본 통신 IP',
  })
  commIp: string | null;

  @Column({
    name: 'comm_port',
    type: 'int',
    nullable: true,
    comment: '기본 통신 포트',
  })
  commPort: number | null;

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
    default: 'N',
    nullable: true,
    comment: '삭제 여부',
  })
  presetIsdel: string | null;

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

  @OneToMany(() => TbPresetCommand, (command) => command.preset)
  commands: TbPresetCommand[];
}
