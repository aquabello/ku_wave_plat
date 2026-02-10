import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbDevicePreset } from '@modules/controller/presets/entities/tb-device-preset.entity';

@Entity('tb_space_device')
export class TbSpaceDevice {
  @PrimaryGeneratedColumn({ name: 'space_device_seq', comment: '공간장비 시퀀스' })
  spaceDeviceSeq: number;

  @Column({
    name: 'space_seq',
    type: 'int',
    nullable: false,
    comment: '공간 시퀀스',
  })
  spaceSeq: number;

  @Column({
    name: 'preset_seq',
    type: 'int',
    nullable: false,
    comment: '프리셋 시퀀스',
  })
  presetSeq: number;

  @Column({
    name: 'device_name',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '장비명 (예: 101호 프로젝터)',
  })
  deviceName: string;

  @Column({
    name: 'device_ip',
    type: 'varchar',
    length: 45,
    nullable: false,
    comment: '장비 IP',
  })
  deviceIp: string;

  @Column({
    name: 'device_port',
    type: 'int',
    nullable: false,
    comment: '장비 포트 (프리셋 기본값에서 자동 채움, 수정 가능)',
  })
  devicePort: number;

  @Column({
    name: 'device_status',
    type: 'enum',
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
    nullable: true,
    comment: '장비 상태',
  })
  deviceStatus: string | null;

  @Column({
    name: 'device_order',
    type: 'int',
    default: 0,
    nullable: true,
    comment: '정렬 순서',
  })
  deviceOrder: number | null;

  @Column({
    name: 'device_isdel',
    type: 'char',
    default: 'N',
    nullable: true,
    comment: '삭제 여부',
  })
  deviceIsdel: string | null;

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

  @ManyToOne(() => TbDevicePreset)
  @JoinColumn({ name: 'preset_seq' })
  preset: TbDevicePreset;
}
