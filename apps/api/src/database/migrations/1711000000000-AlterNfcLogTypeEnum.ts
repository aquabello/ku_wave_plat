import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterNfcLogTypeEnum1711000000000 implements MigrationInterface {
  name = 'AlterNfcLogTypeEnum1711000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tb_nfc_log
        MODIFY COLUMN log_type
          ENUM('ENTER','EXIT','DENIED','UNKNOWN','REGISTER_SAVE','REGISTER_NO','REGISTER_TIMEOUT')
          NOT NULL COMMENT '태깅 유형'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE tb_nfc_log
        MODIFY COLUMN log_type
          ENUM('ENTER','EXIT','DENIED','UNKNOWN')
          NOT NULL COMMENT '태깅 유형'
    `);
  }
}
