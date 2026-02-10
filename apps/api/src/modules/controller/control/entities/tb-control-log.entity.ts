import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TbSpaceDevice } from '@modules/controller/devices/entities/tb-space-device.entity';
import { TbPresetCommand } from '@modules/controller/presets/entities/tb-preset-command.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';

@Entity('tb_control_log')
export class TbControlLog {
  @PrimaryGeneratedColumn({ name: 'log_seq', comment: '로그 시퀀스' })
  logSeq: number;

  @Column({
    name: 'space_device_seq',
    type: 'int',
    comment: '공간장비 시퀀스',
  })
  spaceDeviceSeq: number;

  @Column({
    name: 'command_seq',
    type: 'int',
    comment: '명령어 시퀀스',
  })
  commandSeq: number;

  @Column({
    name: 'tu_seq',
    type: 'int',
    comment: '실행자 시퀀스',
  })
  tuSeq: number;

  @Column({
    name: 'result_status',
    type: 'enum',
    enum: ['SUCCESS', 'FAIL', 'TIMEOUT'],
    comment: '실행 결과',
  })
  resultStatus: string;

  @Column({
    name: 'result_message',
    type: 'text',
    nullable: true,
    comment: '응답 메시지',
  })
  resultMessage: string | null;

  @Column({
    name: 'executed_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '실행 시각',
  })
  executedAt: Date;

  @ManyToOne(() => TbSpaceDevice)
  @JoinColumn({ name: 'space_device_seq' })
  spaceDevice: TbSpaceDevice;

  @ManyToOne(() => TbPresetCommand)
  @JoinColumn({ name: 'command_seq' })
  command: TbPresetCommand;

  @ManyToOne(() => TbUser)
  @JoinColumn({ name: 'tu_seq' })
  user: TbUser;
}
