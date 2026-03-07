import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TbSpace } from '@modules/spaces/entities/tb-space.entity';
import { TbSpaceDevice } from '@modules/controller/devices/entities/tb-space-device.entity';
import { TbPresetCommand } from '@modules/controller/presets/entities/tb-preset-command.entity';

@Entity('tb_ai_voice_command')
export class TbAiVoiceCommand {
  @PrimaryGeneratedColumn({ name: 'voice_command_seq', comment: '음성명령 시퀀스' })
  voiceCommandSeq: number;

  @Column({ name: 'space_seq', type: 'int', nullable: false, comment: '공간 시퀀스' })
  spaceSeq: number;

  @Column({ name: 'keyword', type: 'varchar', length: 100, nullable: false, comment: '음성 키워드' })
  keyword: string;

  @Column({ name: 'keyword_aliases', type: 'text', nullable: true, comment: '별칭 JSON' })
  keywordAliases: string | null;

  @Column({ name: 'space_device_seq', type: 'int', nullable: false, comment: '제어 대상 장비 시퀀스' })
  spaceDeviceSeq: number;

  @Column({ name: 'command_seq', type: 'int', nullable: false, comment: '실행할 명령어 시퀀스' })
  commandSeq: number;

  @Column({ name: 'min_confidence', type: 'float', default: 0.85, nullable: false, comment: '즉시실행 임계값' })
  minConfidence: number;

  @Column({ name: 'command_priority', type: 'int', default: 0, nullable: true, comment: '우선순위' })
  commandPriority: number | null;

  @Column({ name: 'command_isdel', type: 'char', length: 1, default: 'N', nullable: false, comment: '삭제 여부' })
  commandIsdel: string;

  @Column({ name: 'reg_date', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', nullable: false, comment: '등록일시' })
  regDate: Date;

  @Column({ name: 'upd_date', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', nullable: false, comment: '수정일시' })
  updDate: Date;

  // Relations
  @ManyToOne(() => TbSpace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'space_seq' })
  space: TbSpace;

  @ManyToOne(() => TbSpaceDevice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'space_device_seq' })
  spaceDevice: TbSpaceDevice;

  @ManyToOne(() => TbPresetCommand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'command_seq' })
  command: TbPresetCommand;
}
