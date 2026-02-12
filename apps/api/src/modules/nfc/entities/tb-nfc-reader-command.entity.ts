import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TbNfcReader } from './tb-nfc-reader.entity';
import { TbSpaceDevice } from '@modules/controller/devices/entities/tb-space-device.entity';
import { TbPresetCommand } from '@modules/controller/presets/entities/tb-preset-command.entity';

@Entity('tb_nfc_reader_command')
export class TbNfcReaderCommand {
  @PrimaryGeneratedColumn({
    name: 'reader_command_seq',
    comment: 'NFC 리더기 명령어 매핑 시퀀스',
  })
  readerCommandSeq: number;

  @Column({
    name: 'reader_seq',
    type: 'int',
    nullable: false,
    comment: 'NFC 리더기 시퀀스',
  })
  readerSeq: number;

  @Column({
    name: 'space_device_seq',
    type: 'int',
    nullable: false,
    comment: '공간장비 시퀀스',
  })
  spaceDeviceSeq: number;

  @Column({
    name: 'enter_command_seq',
    type: 'int',
    nullable: true,
    comment: '입실 시 실행할 명령어 시퀀스',
  })
  enterCommandSeq: number | null;

  @Column({
    name: 'exit_command_seq',
    type: 'int',
    nullable: true,
    comment: '퇴실 시 실행할 명령어 시퀀스',
  })
  exitCommandSeq: number | null;

  @Column({
    name: 'command_isdel',
    type: 'char',
    length: 1,
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

  @ManyToOne(() => TbNfcReader)
  @JoinColumn({ name: 'reader_seq' })
  reader: TbNfcReader;

  @ManyToOne(() => TbSpaceDevice)
  @JoinColumn({ name: 'space_device_seq' })
  spaceDevice: TbSpaceDevice;

  @ManyToOne(() => TbPresetCommand)
  @JoinColumn({ name: 'enter_command_seq' })
  enterCommand: TbPresetCommand | null;

  @ManyToOne(() => TbPresetCommand)
  @JoinColumn({ name: 'exit_command_seq' })
  exitCommand: TbPresetCommand | null;
}
