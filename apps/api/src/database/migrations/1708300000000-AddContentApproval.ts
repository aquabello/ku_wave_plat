import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContentApproval1708300000000 implements MigrationInterface {
  name = 'AddContentApproval1708300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. tb_play_list_content에 승인 관련 컬럼 추가
    await queryRunner.query(`
      ALTER TABLE tb_play_list_content
        ADD COLUMN requester_seq    INT NULL COMMENT '콘텐츠 등록 요청자 시퀀스',
        ADD COLUMN approval_status  ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING' COMMENT '승인 상태',
        ADD COLUMN reviewer_seq     INT NULL COMMENT '승인/반려자 시퀀스',
        ADD COLUMN reviewed_date    DATETIME NULL COMMENT '승인/반려 일시',
        ADD COLUMN reject_reason    TEXT NULL COMMENT '반려 사유',
        ADD CONSTRAINT fk_plc_requester FOREIGN KEY (requester_seq) REFERENCES tb_users(tu_seq) ON DELETE SET NULL,
        ADD CONSTRAINT fk_plc_reviewer FOREIGN KEY (reviewer_seq) REFERENCES tb_users(tu_seq) ON DELETE SET NULL
    `);

    // 2. tb_play_list_content 인덱스
    await queryRunner.query(`CREATE INDEX idx_plc_approval_status ON tb_play_list_content (approval_status)`);
    await queryRunner.query(`CREATE INDEX idx_plc_reviewer ON tb_play_list_content (reviewer_seq)`);
    await queryRunner.query(`CREATE INDEX idx_plc_requester ON tb_play_list_content (requester_seq)`);

    // 3. 콘텐츠 승인 이력 테이블 생성
    await queryRunner.query(`
      CREATE TABLE tb_content_approval_log (
        log_seq        INT AUTO_INCREMENT PRIMARY KEY,
        plc_seq        INT NOT NULL COMMENT '플레이리스트콘텐츠 시퀀스',
        action         ENUM('APPROVED','REJECTED','CANCELLED') NOT NULL COMMENT '수행 액션',
        actor_seq      INT NULL COMMENT '수행자 시퀀스 (삭제 시 NULL 보존)',
        reason         TEXT NULL COMMENT '사유',
        created_at     DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '수행 일시',
        CONSTRAINT fk_cal_plc FOREIGN KEY (plc_seq) REFERENCES tb_play_list_content(plc_seq) ON DELETE CASCADE,
        CONSTRAINT fk_cal_user FOREIGN KEY (actor_seq) REFERENCES tb_users(tu_seq) ON DELETE SET NULL
      ) COMMENT '콘텐츠 승인 이력' CHARSET = utf8mb4
    `);

    // 4. tb_content_approval_log 인덱스
    await queryRunner.query(`CREATE INDEX idx_cal_plc ON tb_content_approval_log (plc_seq)`);
    await queryRunner.query(`CREATE INDEX idx_cal_actor ON tb_content_approval_log (actor_seq)`);
    await queryRunner.query(`CREATE INDEX idx_cal_created ON tb_content_approval_log (created_at)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 역순으로 롤백
    await queryRunner.query(`DROP TABLE IF EXISTS tb_content_approval_log`);

    await queryRunner.query(`DROP INDEX idx_plc_requester ON tb_play_list_content`);
    await queryRunner.query(`DROP INDEX idx_plc_reviewer ON tb_play_list_content`);
    await queryRunner.query(`DROP INDEX idx_plc_approval_status ON tb_play_list_content`);

    await queryRunner.query(`ALTER TABLE tb_play_list_content DROP FOREIGN KEY fk_plc_reviewer`);
    await queryRunner.query(`ALTER TABLE tb_play_list_content DROP FOREIGN KEY fk_plc_requester`);
    await queryRunner.query(`ALTER TABLE tb_play_list_content DROP COLUMN reject_reason`);
    await queryRunner.query(`ALTER TABLE tb_play_list_content DROP COLUMN reviewed_date`);
    await queryRunner.query(`ALTER TABLE tb_play_list_content DROP COLUMN reviewer_seq`);
    await queryRunner.query(`ALTER TABLE tb_play_list_content DROP COLUMN approval_status`);
    await queryRunner.query(`ALTER TABLE tb_play_list_content DROP COLUMN requester_seq`);
  }
}
