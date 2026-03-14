import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tb_socket_command')
export class TbSocketCommand {
  @PrimaryGeneratedColumn({ name: 'socket_cmd_seq', comment: '소켓명령 시퀀스' })
  socketCmdSeq: number;

  @Column({
    name: 'cmd_label',
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '명령어 라벨',
  })
  cmdLabel: string;

  @Column({
    name: 'cmd_hex',
    type: 'varchar',
    length: 500,
    nullable: false,
    comment: '명령어 HEX',
  })
  cmdHex: string;

  @Column({
    name: 'cmd_category',
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: '명령어 카테고리',
  })
  cmdCategory: string;

  @Column({
    name: 'cmd_description',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '명령어 설명',
  })
  cmdDescription: string | null;

  @Column({
    name: 'cmd_order',
    type: 'int',
    default: 0,
    nullable: true,
    comment: '정렬 순서',
  })
  cmdOrder: number | null;

  @Column({
    name: 'cmd_isdel',
    type: 'char',
    default: 'N',
    nullable: true,
    comment: '삭제 여부',
  })
  cmdIsdel: string | null;

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
}
