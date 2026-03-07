/**
 * 녹화기 관리 시스템 DDL 실행 스크립트
 * 실행: node docs/migrations/recorder-ddl.js
 */
const path = require('path');
const mysql = require(path.join(__dirname, '../../apps/api/node_modules/mysql2/promise'));

async function run() {
  const conn = await mysql.createConnection({
    host: '115.68.220.124',
    port: 3306,
    user: 'ku_wave_plat',
    password: '!ku_wave_plat@',
    database: 'ku_wave_plat',
    multipleStatements: true,
  });

  console.log('DB 연결 성공');

  // 1. 테이블 생성
  const ddlStatements = [
    // -- 1. 녹화기 마스터
    `CREATE TABLE IF NOT EXISTS tb_recorder (
      recorder_seq        INT AUTO_INCREMENT COMMENT '녹화기 시퀀스' PRIMARY KEY,
      space_seq           INT                                     NOT NULL COMMENT '공간 시퀀스',
      recorder_name       VARCHAR(100)                            NOT NULL COMMENT '녹화기명',
      recorder_ip         VARCHAR(45)                             NOT NULL COMMENT '고정 IP',
      recorder_port       INT             DEFAULT 80              NULL     COMMENT '통신 포트',
      recorder_protocol   ENUM('HTTP','ONVIF','RTSP')  DEFAULT 'HTTP' NOT NULL COMMENT '통신 프로토콜',
      recorder_username   VARCHAR(100)                            NULL     COMMENT '녹화기 로그인 ID',
      recorder_password   VARCHAR(255)                            NULL     COMMENT '녹화기 로그인 PW (AES 암호화)',
      recorder_model      VARCHAR(100)                            NULL     COMMENT '녹화기 모델명/제조사',
      recorder_status     ENUM('ONLINE','OFFLINE','ERROR') DEFAULT 'OFFLINE' NOT NULL COMMENT '녹화기 상태',
      current_user_seq    INT                                     NULL     COMMENT '현재 사용 중인 사용자',
      last_health_check   DATETIME                                NULL     COMMENT '마지막 상태 확인 시각',
      recorder_order      INT             DEFAULT 0               NULL     COMMENT '정렬 순서',
      recorder_isdel      CHAR            DEFAULT 'N'             NOT NULL COMMENT '삭제 여부',
      reg_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
      upd_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',
      CONSTRAINT uk_recorder_space UNIQUE (space_seq),
      CONSTRAINT fk_recorder_space FOREIGN KEY (space_seq) REFERENCES tb_space (space_seq) ON DELETE CASCADE,
      CONSTRAINT fk_recorder_current_user FOREIGN KEY (current_user_seq) REFERENCES tb_users (tu_seq) ON DELETE SET NULL
    ) COMMENT '녹화기 마스터' CHARSET = utf8mb4`,

    `CREATE INDEX idx_recorder_ip     ON tb_recorder (recorder_ip)`,
    `CREATE INDEX idx_recorder_status ON tb_recorder (recorder_status)`,
    `CREATE INDEX idx_recorder_isdel  ON tb_recorder (recorder_isdel)`,
    `CREATE INDEX idx_recorder_order  ON tb_recorder (recorder_order)`,

    // -- 2. 녹화기-사용자 매핑
    `CREATE TABLE IF NOT EXISTS tb_recorder_user (
      recorder_user_seq   INT AUTO_INCREMENT COMMENT '시퀀스' PRIMARY KEY,
      recorder_seq        INT                                     NOT NULL COMMENT '녹화기 시퀀스',
      tu_seq              INT                                     NOT NULL COMMENT '사용자(교수) 시퀀스',
      is_default          CHAR            DEFAULT 'N'             NOT NULL COMMENT '기본 사용자 여부',
      recorder_user_isdel CHAR            DEFAULT 'N'             NOT NULL COMMENT '삭제 여부',
      reg_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
      upd_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',
      CONSTRAINT uk_recorder_user UNIQUE (recorder_seq, tu_seq),
      CONSTRAINT fk_ru_recorder FOREIGN KEY (recorder_seq) REFERENCES tb_recorder (recorder_seq) ON DELETE CASCADE,
      CONSTRAINT fk_ru_user FOREIGN KEY (tu_seq) REFERENCES tb_users (tu_seq) ON DELETE CASCADE
    ) COMMENT '녹화기-사용자 매핑' CHARSET = utf8mb4`,

    `CREATE INDEX idx_ru_recorder ON tb_recorder_user (recorder_seq)`,
    `CREATE INDEX idx_ru_user     ON tb_recorder_user (tu_seq)`,
    `CREATE INDEX idx_ru_isdel    ON tb_recorder_user (recorder_user_isdel)`,

    // -- 3. 녹화기 PTZ 프리셋
    `CREATE TABLE IF NOT EXISTS tb_recorder_preset (
      rec_preset_seq      INT AUTO_INCREMENT COMMENT '프리셋 시퀀스' PRIMARY KEY,
      recorder_seq        INT                                     NOT NULL COMMENT '녹화기 시퀀스',
      preset_name         VARCHAR(100)                            NOT NULL COMMENT '프리셋명',
      preset_number       INT                                     NOT NULL COMMENT '녹화기 내부 프리셋 번호',
      pan_value           FLOAT                                   NULL     COMMENT 'Pan 값',
      tilt_value          FLOAT                                   NULL     COMMENT 'Tilt 값',
      zoom_value          FLOAT                                   NULL     COMMENT 'Zoom 값',
      preset_description  TEXT                                    NULL     COMMENT '프리셋 설명',
      preset_order        INT             DEFAULT 0               NULL     COMMENT '정렬 순서',
      preset_isdel        CHAR            DEFAULT 'N'             NOT NULL COMMENT '삭제 여부',
      reg_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
      upd_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',
      CONSTRAINT uk_recorder_preset_number UNIQUE (recorder_seq, preset_number),
      CONSTRAINT fk_rp_recorder FOREIGN KEY (recorder_seq) REFERENCES tb_recorder (recorder_seq) ON DELETE CASCADE
    ) COMMENT '녹화기 PTZ 프리셋' CHARSET = utf8mb4`,

    `CREATE INDEX idx_rp_recorder ON tb_recorder_preset (recorder_seq)`,
    `CREATE INDEX idx_rp_isdel    ON tb_recorder_preset (preset_isdel)`,
    `CREATE INDEX idx_rp_order    ON tb_recorder_preset (preset_order)`,

    // -- 4. FTP 설정
    `CREATE TABLE IF NOT EXISTS tb_ftp_config (
      ftp_config_seq      INT AUTO_INCREMENT COMMENT 'FTP 설정 시퀀스' PRIMARY KEY,
      recorder_seq        INT                                     NULL     COMMENT '녹화기 시퀀스 (NULL=글로벌 기본)',
      ftp_name            VARCHAR(100)                            NOT NULL COMMENT '설정명',
      ftp_host            VARCHAR(255)                            NOT NULL COMMENT 'FTP 호스트',
      ftp_port            INT             DEFAULT 21              NOT NULL COMMENT 'FTP 포트',
      ftp_username        VARCHAR(100)                            NOT NULL COMMENT 'FTP 계정',
      ftp_password        VARCHAR(255)                            NOT NULL COMMENT 'FTP 비밀번호 (AES 암호화)',
      ftp_path            VARCHAR(500)    DEFAULT '/'             NULL     COMMENT '업로드 기본 경로',
      ftp_protocol        ENUM('FTP','SFTP','FTPS') DEFAULT 'FTP' NOT NULL COMMENT '프로토콜',
      ftp_passive_mode    CHAR            DEFAULT 'Y'             NOT NULL COMMENT '패시브 모드 여부',
      is_default          CHAR            DEFAULT 'N'             NOT NULL COMMENT '기본 설정 여부',
      ftp_isdel           CHAR            DEFAULT 'N'             NOT NULL COMMENT '삭제 여부',
      reg_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
      upd_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',
      CONSTRAINT fk_ftp_recorder FOREIGN KEY (recorder_seq) REFERENCES tb_recorder (recorder_seq) ON DELETE CASCADE
    ) COMMENT 'FTP 설정' CHARSET = utf8mb4`,

    `CREATE INDEX idx_ftp_recorder ON tb_ftp_config (recorder_seq)`,
    `CREATE INDEX idx_ftp_default  ON tb_ftp_config (is_default)`,
    `CREATE INDEX idx_ftp_isdel    ON tb_ftp_config (ftp_isdel)`,

    // -- 5. 녹화 세션
    `CREATE TABLE IF NOT EXISTS tb_recording_session (
      rec_session_seq     INT AUTO_INCREMENT COMMENT '세션 시퀀스' PRIMARY KEY,
      recorder_seq        INT                                     NOT NULL COMMENT '녹화기 시퀀스',
      tu_seq              INT                                     NULL     COMMENT '녹화 시작 사용자',
      session_status      ENUM('RECORDING','COMPLETED','FAILED','CANCELLED') NOT NULL COMMENT '세션 상태',
      rec_preset_seq      INT                                     NULL     COMMENT '사용된 프리셋',
      session_title       VARCHAR(200)                            NULL     COMMENT '강의명 / 메모',
      started_at          DATETIME                                NOT NULL COMMENT '녹화 시작 시각',
      ended_at            DATETIME                                NULL     COMMENT '녹화 종료 시각',
      duration_sec        INT                                     NULL     COMMENT '녹화 시간 (초)',
      reg_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
      upd_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',
      CONSTRAINT fk_rs_recorder FOREIGN KEY (recorder_seq) REFERENCES tb_recorder (recorder_seq) ON DELETE CASCADE,
      CONSTRAINT fk_rs_user FOREIGN KEY (tu_seq) REFERENCES tb_users (tu_seq) ON DELETE SET NULL,
      CONSTRAINT fk_rs_preset FOREIGN KEY (rec_preset_seq) REFERENCES tb_recorder_preset (rec_preset_seq) ON DELETE SET NULL
    ) COMMENT '녹화 세션' CHARSET = utf8mb4`,

    `CREATE INDEX idx_rs_recorder  ON tb_recording_session (recorder_seq)`,
    `CREATE INDEX idx_rs_user      ON tb_recording_session (tu_seq)`,
    `CREATE INDEX idx_rs_status    ON tb_recording_session (session_status)`,
    `CREATE INDEX idx_rs_started   ON tb_recording_session (started_at)`,

    // -- 6. 녹화 파일
    `CREATE TABLE IF NOT EXISTS tb_recording_file (
      rec_file_seq        INT AUTO_INCREMENT COMMENT '파일 시퀀스' PRIMARY KEY,
      rec_session_seq     INT                                     NOT NULL COMMENT '세션 시퀀스',
      file_name           VARCHAR(255)                            NOT NULL COMMENT '원본 파일명',
      file_path           VARCHAR(500)                            NULL     COMMENT '녹화기 내 파일 경로',
      file_size           BIGINT                                  NULL     COMMENT '파일 크기 (bytes)',
      file_format         VARCHAR(20)                             NULL     COMMENT '파일 포맷 (mp4, avi)',
      file_duration_sec   INT                                     NULL     COMMENT '영상 길이 (초)',
      ftp_status          ENUM('PENDING','UPLOADING','COMPLETED','FAILED','RETRY') DEFAULT 'PENDING' NOT NULL COMMENT 'FTP 업로드 상태',
      ftp_config_seq      INT                                     NULL     COMMENT 'FTP 설정 시퀀스',
      ftp_uploaded_path   VARCHAR(500)                            NULL     COMMENT 'FTP 업로드 경로',
      ftp_uploaded_at     DATETIME                                NULL     COMMENT '업로드 완료 시각',
      ftp_retry_count     INT             DEFAULT 0               NOT NULL COMMENT '재시도 횟수',
      ftp_error_message   TEXT                                    NULL     COMMENT '업로드 실패 에러',
      file_isdel          CHAR            DEFAULT 'N'             NOT NULL COMMENT '삭제 여부',
      reg_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
      upd_date            DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',
      CONSTRAINT fk_rf_session FOREIGN KEY (rec_session_seq) REFERENCES tb_recording_session (rec_session_seq) ON DELETE CASCADE,
      CONSTRAINT fk_rf_ftp FOREIGN KEY (ftp_config_seq) REFERENCES tb_ftp_config (ftp_config_seq) ON DELETE SET NULL
    ) COMMENT '녹화 파일' CHARSET = utf8mb4`,

    `CREATE INDEX idx_rf_session    ON tb_recording_file (rec_session_seq)`,
    `CREATE INDEX idx_rf_ftp_status ON tb_recording_file (ftp_status)`,
    `CREATE INDEX idx_rf_ftp_config ON tb_recording_file (ftp_config_seq)`,
    `CREATE INDEX idx_rf_isdel      ON tb_recording_file (file_isdel)`,

    // -- 7. 녹화기 명령 로그
    `CREATE TABLE IF NOT EXISTS tb_recorder_log (
      rec_log_seq         INT AUTO_INCREMENT COMMENT '로그 시퀀스' PRIMARY KEY,
      recorder_seq        INT                                     NOT NULL COMMENT '녹화기 시퀀스',
      tu_seq              INT                                     NULL     COMMENT '실행자 시퀀스',
      log_type            ENUM('PTZ','REC_START','REC_STOP','PRESET_APPLY','STATUS_CHECK','POWER') NOT NULL COMMENT '명령 유형',
      command_detail      TEXT                                    NULL     COMMENT '전송 명령 상세 (JSON)',
      result_status       ENUM('SUCCESS','FAIL','TIMEOUT')        NOT NULL COMMENT '실행 결과',
      result_message      TEXT                                    NULL     COMMENT '응답 메시지',
      executed_at         DATETIME        DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '실행 시각',
      CONSTRAINT fk_rl_recorder FOREIGN KEY (recorder_seq) REFERENCES tb_recorder (recorder_seq) ON DELETE CASCADE,
      CONSTRAINT fk_rl_user FOREIGN KEY (tu_seq) REFERENCES tb_users (tu_seq) ON DELETE SET NULL
    ) COMMENT '녹화기 명령 로그' CHARSET = utf8mb4`,

    `CREATE INDEX idx_rl_recorder  ON tb_recorder_log (recorder_seq)`,
    `CREATE INDEX idx_rl_user      ON tb_recorder_log (tu_seq)`,
    `CREATE INDEX idx_rl_type      ON tb_recorder_log (log_type)`,
    `CREATE INDEX idx_rl_status    ON tb_recorder_log (result_status)`,
    `CREATE INDEX idx_rl_executed  ON tb_recorder_log (executed_at)`,
  ];

  for (const sql of ddlStatements) {
    try {
      await conn.execute(sql);
      const match = sql.match(/(?:CREATE TABLE IF NOT EXISTS|CREATE INDEX)\s+(\S+)/i);
      if (match) console.log(`  ✅ ${match[1]}`);
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
        const match = sql.match(/(?:CREATE TABLE IF NOT EXISTS|CREATE INDEX)\s+(\S+)/i);
        console.log(`  ⏭️  ${match?.[1] || 'unknown'} (이미 존재)`);
      } else {
        console.error(`  ❌ 실패: ${err.message}`);
        console.error(`     SQL: ${sql.substring(0, 80)}...`);
      }
    }
  }

  // 2. 메뉴 변경
  console.log('\n--- 메뉴 변경 ---');

  try {
    await conn.execute(
      `UPDATE tb_menu SET menu_name = '녹화기관리', menu_code = 'recorder' WHERE menu_seq = 3`
    );
    console.log('  ✅ GNB 변경: 화면공유 → 녹화기관리');
  } catch (err) {
    console.error(`  ❌ GNB 변경 실패: ${err.message}`);
  }

  try {
    await conn.execute(
      `UPDATE tb_menu SET menu_isdel = 'Y' WHERE parent_seq = 3 AND menu_seq IN (31, 32)`
    );
    console.log('  ✅ 기존 LNB soft delete');
  } catch (err) {
    console.error(`  ❌ 기존 LNB 삭제 실패: ${err.message}`);
  }

  const menuInserts = [
    [31, '녹화기 등록',   'recorder-list',    '/recorder/list',    'LNB', 3, 1],
    [32, '녹화기 제어',   'recorder-control', '/recorder/control', 'LNB', 3, 2],
    [33, '녹화 이력',     'recorder-history', '/recorder/history', 'LNB', 3, 3],
    [34, '녹화파일 관리', 'recorder-files',   '/recorder/files',   'LNB', 3, 4],
    [35, 'FTP 설정',      'recorder-ftp',     '/recorder/ftp',     'LNB', 3, 5],
  ];

  for (const m of menuInserts) {
    try {
      await conn.execute(
        `INSERT INTO tb_menu (menu_seq, menu_name, menu_code, menu_path, menu_type, parent_seq, menu_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           menu_name = VALUES(menu_name),
           menu_code = VALUES(menu_code),
           menu_path = VALUES(menu_path),
           menu_order = VALUES(menu_order),
           menu_isdel = 'N'`,
        m
      );
      console.log(`  ✅ LNB: ${m[1]} (${m[3]})`);
    } catch (err) {
      console.error(`  ❌ LNB ${m[1]} 실패: ${err.message}`);
    }
  }

  // 3. 검증
  console.log('\n--- 검증 ---');
  const [tables] = await conn.execute(
    `SELECT TABLE_NAME, TABLE_COMMENT FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = 'ku_wave_plat'
       AND TABLE_NAME IN ('tb_recorder','tb_recorder_user','tb_recorder_preset','tb_ftp_config','tb_recording_session','tb_recording_file','tb_recorder_log')
     ORDER BY TABLE_NAME`
  );
  console.log(`  생성된 테이블: ${tables.length}/7`);
  tables.forEach(t => console.log(`    - ${t.TABLE_NAME} (${t.TABLE_COMMENT})`));

  const [menus] = await conn.execute(
    `SELECT menu_seq, menu_name, menu_code, menu_path FROM tb_menu WHERE parent_seq = 3 AND menu_isdel = 'N' ORDER BY menu_order`
  );
  console.log(`\n  녹화기관리 LNB 메뉴: ${menus.length}개`);
  menus.forEach(m => console.log(`    - [${m.menu_seq}] ${m.menu_name} → ${m.menu_path}`));

  await conn.end();
  console.log('\n✅ 녹화기 관리 시스템 DDL 적용 완료!');
}

run().catch(err => {
  console.error('스크립트 실행 실패:', err.message);
  process.exit(1);
});
