import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TbDevicePreset } from './tb-device-preset.entity';

@Entity('tb_preset_command')
export class TbPresetCommand {
  @PrimaryGeneratedColumn({ name: 'command_seq', comment: '명령어 시퀀스' })
  commandSeq: number;

  @Column({
    name: 'preset_seq',
    type: 'int',
    nullable: false,
    comment: '프리셋 시퀀스',
  })
  presetSeq: number;

  @Column({
    name: 'command_name',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '명령어명 (예: 전원 ON)',
  })
  commandName: string;

  @Column({
    name: 'command_code',
    type: 'varchar',
    length: 500,
    nullable: false,
    comment: '명령어 코드 (HEX 또는 텍스트)',
  })
  commandCode: string;

  @Column({
    name: 'command_type',
    type: 'varchar',
    length: 20,
    default: 'CUSTOM',
    nullable: true,
    comment: '명령어 유형 (POWER_ON, POWER_OFF, INPUT_CHANGE, CUSTOM)',
  })
  commandType: string | null;

  @Column({
    name: 'command_order',
    type: 'int',
    default: 0,
    nullable: true,
    comment: '정렬 순서',
  })
  commandOrder: number | null;

  @Column({
    name: 'command_isdel',
    type: 'char',
    default: 'N',
    nullable: true,
    comment: '삭제 여부',
  })
  commandIsdel: string | null;

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

  @ManyToOne(() => TbDevicePreset, (preset) => preset.commands)
  @JoinColumn({ name: 'preset_seq' })
  preset: TbDevicePreset;
}
