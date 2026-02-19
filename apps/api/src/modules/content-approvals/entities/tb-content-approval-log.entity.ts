import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TbPlayListContent } from '@modules/playlists/entities/tb-play-list-content.entity';
import { TbUser } from '@modules/users/entities/tb-user.entity';

@Entity('tb_content_approval_log')
export class TbContentApprovalLog {
  @PrimaryGeneratedColumn({ name: 'log_seq', comment: '로그 시퀀스' })
  logSeq: number;

  @Column({
    name: 'plc_seq',
    type: 'int',
    nullable: false,
    comment: '플레이리스트콘텐츠 시퀀스',
  })
  plcSeq: number;

  @Column({
    name: 'action',
    type: 'enum',
    enum: ['APPROVED', 'REJECTED', 'CANCELLED'],
    nullable: false,
    comment: '수행 액션',
  })
  action: 'APPROVED' | 'REJECTED' | 'CANCELLED';

  @Column({
    name: 'actor_seq',
    type: 'int',
    nullable: true,
    comment: '수행자 시퀀스 (삭제 시 NULL 보존)',
  })
  actorSeq: number | null;

  @Column({
    name: 'reason',
    type: 'text',
    nullable: true,
    comment: '사유',
  })
  reason: string | null;

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '수행 일시',
  })
  createdAt: Date;

  // Relations
  @ManyToOne(() => TbPlayListContent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plc_seq' })
  playlistContent: TbPlayListContent;

  @ManyToOne(() => TbUser, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_seq' })
  actor: TbUser | null;
}
