import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TbPlayerGroup } from './tb-player-group.entity';
import { TbPlayer } from '@modules/players/entities/tb-player.entity';

@Entity('tb_player_group_member')
export class TbPlayerGroupMember {
  @PrimaryGeneratedColumn({ name: 'pgm_seq', comment: '멤버 시퀀스' })
  pgmSeq: number;

  @Column({
    name: 'group_seq',
    type: 'int',
    nullable: false,
    comment: '그룹 시퀀스',
  })
  groupSeq: number;

  @Column({
    name: 'player_seq',
    type: 'int',
    nullable: false,
    comment: '플레이어 시퀀스',
  })
  playerSeq: number;

  @Column({
    name: 'pgm_isdel',
    type: 'char',
    length: 1,
    default: 'N',
    comment: '삭제 여부 (Y/N)',
  })
  pgmIsdel: 'Y' | 'N';

  @Column({
    name: 'reg_date',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
    comment: '등록일시',
  })
  regDate: Date | null;

  // Relations
  @ManyToOne(() => TbPlayerGroup, (group) => group.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_seq' })
  group: TbPlayerGroup;

  @ManyToOne(() => TbPlayer, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'player_seq' })
  player: TbPlayer;
}
