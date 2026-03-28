-- ============================================================================
-- KU-WAVE-PLAT Database Initialization Script
-- ============================================================================
-- Version : 2.0.0
-- Date    : 2026-03-22
-- Tables  : 41 tables across 8 domains
-- Domains :
--   1. 시스템/인증      (3) : tb_setting, tb_users, tb_activity_log
--   2. RBAC            (2) : tb_menu, tb_menu_users
--   3. 물리 계층        (3) : tb_building, tb_space, tb_user_building
--   4. IoT 컨트롤러     (5) : tb_device_preset, tb_preset_command,
--                             tb_space_device, tb_socket_command, tb_control_log
--   5. NFC/RFID        (4) : tb_nfc_reader, tb_nfc_card, tb_nfc_log,
--                             tb_nfc_reader_command
--   6. 디스플레이/DID   (11) : tb_content, tb_play_list, tb_play_list_content,
--                             tb_content_approval_log, tb_player,
--                             tb_player_heartbeat_log, tb_player_group,
--                             tb_player_group_member, tb_player_playlist,
--                             tb_group_playlist, tb_play_log
--   7. 녹화기           (7) : tb_recorder, tb_recorder_user, tb_recorder_preset,
--                             tb_ftp_config, tb_recording_session,
--                             tb_recording_file, tb_recorder_log
--   8. AI 시스템        (6) : tb_ai_worker_server, tb_ai_voice_command,
--                             tb_ai_speech_session, tb_ai_speech_log,
--                             tb_ai_command_log, tb_ai_lecture_summary
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================================
-- DROP TABLES (reverse dependency order)
-- ============================================================================

-- Domain 8: AI 시스템
DROP TABLE IF EXISTS `tb_ai_lecture_summary`;
DROP TABLE IF EXISTS `tb_ai_command_log`;
DROP TABLE IF EXISTS `tb_ai_speech_log`;
DROP TABLE IF EXISTS `tb_ai_speech_session`;
DROP TABLE IF EXISTS `tb_ai_voice_command`;
DROP TABLE IF EXISTS `tb_ai_worker_server`;

-- Domain 7: 녹화기
DROP TABLE IF EXISTS `tb_recorder_log`;
DROP TABLE IF EXISTS `tb_recording_file`;
DROP TABLE IF EXISTS `tb_recording_session`;
DROP TABLE IF EXISTS `tb_ftp_config`;
DROP TABLE IF EXISTS `tb_recorder_preset`;
DROP TABLE IF EXISTS `tb_recorder_user`;
DROP TABLE IF EXISTS `tb_recorder`;

-- Domain 6: 디스플레이/DID
DROP TABLE IF EXISTS `tb_play_log`;
DROP TABLE IF EXISTS `tb_group_playlist`;
DROP TABLE IF EXISTS `tb_player_playlist`;
DROP TABLE IF EXISTS `tb_player_group_member`;
DROP TABLE IF EXISTS `tb_player_group`;
DROP TABLE IF EXISTS `tb_player_heartbeat_log`;
DROP TABLE IF EXISTS `tb_player`;
DROP TABLE IF EXISTS `tb_content_approval_log`;
DROP TABLE IF EXISTS `tb_play_list_content`;
DROP TABLE IF EXISTS `tb_play_list`;
DROP TABLE IF EXISTS `tb_content`;

-- Domain 5: NFC/RFID
DROP TABLE IF EXISTS `tb_nfc_reader_command`;
DROP TABLE IF EXISTS `tb_nfc_log`;
DROP TABLE IF EXISTS `tb_nfc_card`;
DROP TABLE IF EXISTS `tb_nfc_reader`;

-- Domain 4: IoT 컨트롤러
DROP TABLE IF EXISTS `tb_control_log`;
DROP TABLE IF EXISTS `tb_socket_command`;
DROP TABLE IF EXISTS `tb_space_device`;
DROP TABLE IF EXISTS `tb_preset_command`;
DROP TABLE IF EXISTS `tb_device_preset`;

-- Domain 3: 물리 계층
DROP TABLE IF EXISTS `tb_user_building`;
DROP TABLE IF EXISTS `tb_space`;
DROP TABLE IF EXISTS `tb_building`;

-- Domain 2: RBAC
DROP TABLE IF EXISTS `tb_menu_users`;
DROP TABLE IF EXISTS `tb_menu`;

-- Domain 1: 시스템/인증
DROP TABLE IF EXISTS `tb_activity_log`;
DROP TABLE IF EXISTS `tb_users`;
DROP TABLE IF EXISTS `tb_setting`;


-- ============================================================================
-- DOMAIN 1: 시스템/인증 (3 tables)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- tb_setting — 환경설정
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_setting` (
  `ts_seq`           INT           NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `ts_api_time`      VARCHAR(10)   NULL     COMMENT 'API 실행 시간',
  `ts_player_time`   VARCHAR(10)   NULL     DEFAULT '1' COMMENT '플레이어 실행 주기',
  `ts_screen_start`  VARCHAR(10)   NULL     COMMENT '스크린 세이버 시작',
  `ts_screen_end`    VARCHAR(10)   NULL     COMMENT '스크린 세이버 종료',
  `ts_player_ver`    VARCHAR(10)   NULL     DEFAULT '1.0.0' COMMENT '플레이어 버전',
  `ts_player_link`   VARCHAR(255)  NULL     COMMENT '플레이어 다운로드 링크',
  `ts_watcher_ver`   VARCHAR(10)   NULL     DEFAULT '1.0.0' COMMENT '와처 버전',
  `ts_watcher_link`  VARCHAR(255)  NULL     COMMENT '와처 다운로드 링크',
  `ts_notice_link`   VARCHAR(255)  NULL     COMMENT '공지사항 링크',
  `ts_intro_link`    VARCHAR(255)  NULL     COMMENT '인트로 링크',
  `ts_default_image` VARCHAR(255)  NULL     COMMENT 'DID 플레이어 기본 이미지 경로',
  `reg_date`         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  PRIMARY KEY (`ts_seq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='환경설정';


-- ----------------------------------------------------------------------------
-- tb_users — 회원
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_users` (
  `tu_seq`             INT           NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `tu_id`              VARCHAR(20)   NULL     COMMENT '아이디',
  `tu_pw`              VARCHAR(255)  NULL     COMMENT '패스워드 (bcrypt)',
  `tu_name`            VARCHAR(50)   NULL     COMMENT '이름',
  `tu_phone`           VARCHAR(15)   NULL     COMMENT '휴대폰',
  `tu_email`           VARCHAR(50)   NULL     COMMENT '이메일',
  `tu_isdel`           CHAR(1)       NULL     COMMENT '삭제여부',
  `tu_step`            CHAR(2)       NULL     COMMENT '상태',
  `tu_type`            CHAR(6)       NULL     COMMENT '타입',
  `tu_approved_date`   DATETIME      NULL     COMMENT '승인일',
  `tu_content_yn`      ENUM('Y','N') NULL     DEFAULT 'Y' COMMENT '콘텐츠 권한',
  `tu_work_type`       VARCHAR(10)   NULL     COMMENT '근무 유형',
  `tu_last_access_date` DATETIME     NULL     COMMENT '최근 접속일',
  `tu_log`             TEXT          NULL     COMMENT '로그',
  `tu_new_noti`        CHAR(1)       NULL     COMMENT '새 알림',
  `tu_access_token`    VARCHAR(300)  NULL     COMMENT '액세스 토큰',
  `tu_refresh_token`   VARCHAR(500)  NULL     COMMENT '리프레시 토큰',
  `tu_push_token`      VARCHAR(100)  NULL     COMMENT '푸시 토큰',
  `tu_device_name`     VARCHAR(50)   NULL     COMMENT '디바이스명',
  `tu_app_ver`         VARCHAR(10)   NULL     COMMENT '앱 버전',
  `si_seq`             INT           NULL     COMMENT '사이트 시퀀스',
  `reg_date`           DATETIME      NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `tu_token_ver`       INT           NOT NULL DEFAULT 1 COMMENT '토큰 버전 (Refresh Rotation)',
  PRIMARY KEY (`tu_seq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='회원';


-- ----------------------------------------------------------------------------
-- tb_activity_log — 활동 로그
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_activity_log` (
  `log_seq`        BIGINT        NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `tu_seq`         INT           NULL     COMMENT '사용자 시퀀스',
  `tu_id`          VARCHAR(20)   NULL     COMMENT '사용자 아이디',
  `tu_name`        VARCHAR(50)   NULL     COMMENT '사용자 이름',
  `http_method`    VARCHAR(10)   NOT NULL COMMENT 'HTTP 메서드',
  `request_url`    VARCHAR(500)  NOT NULL COMMENT '요청 URL',
  `action_name`    VARCHAR(100)  NULL     COMMENT '액션명',
  `status_code`    INT           NULL     COMMENT 'HTTP 상태코드',
  `request_body`   LONGTEXT      NULL     COMMENT '요청 본문',
  `response_body`  LONGTEXT      NULL     COMMENT '응답 본문',
  `ip_address`     VARCHAR(45)   NULL     COMMENT 'IP 주소',
  `user_agent`     VARCHAR(500)  NULL     COMMENT 'User-Agent',
  `duration_ms`    INT           NULL     COMMENT '처리 시간(ms)',
  `reg_date`       DATETIME      NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  PRIMARY KEY (`log_seq`),
  INDEX `idx_activity_log_tu_seq` (`tu_seq`),
  INDEX `idx_activity_log_reg_date` (`reg_date`),
  INDEX `idx_activity_log_http_method` (`http_method`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='활동 로그';


-- ============================================================================
-- DOMAIN 2: RBAC (2 tables)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- tb_menu — 메뉴 마스터
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_menu` (
  `menu_seq`    INT                NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `menu_name`   VARCHAR(50)        NOT NULL COMMENT '메뉴명',
  `menu_code`   VARCHAR(50)        NOT NULL COMMENT '메뉴 코드',
  `menu_path`   VARCHAR(255)       NULL     COMMENT '메뉴 경로',
  `menu_type`   ENUM('GNB','LNB')  NOT NULL COMMENT '메뉴 유형',
  `parent_seq`  INT                NULL     COMMENT '상위 메뉴 시퀀스',
  `menu_order`  INT                NULL     DEFAULT 0 COMMENT '정렬 순서',
  `menu_isdel`  CHAR(1)            NULL     DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`    DATETIME           NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  PRIMARY KEY (`menu_seq`),
  UNIQUE KEY `uk_menu_code` (`menu_code`),
  INDEX `idx_menu_type` (`menu_type`),
  INDEX `idx_menu_parent_seq` (`parent_seq`),
  INDEX `idx_menu_order` (`menu_order`),
  CONSTRAINT `fk_menu_parent` FOREIGN KEY (`parent_seq`) REFERENCES `tb_menu` (`menu_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='메뉴 마스터';


-- ----------------------------------------------------------------------------
-- tb_menu_users — 사용자별 메뉴 권한
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_menu_users` (
  `mu_seq`    INT      NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `tu_seq`    INT      NOT NULL COMMENT '사용자 시퀀스',
  `menu_seq`  INT      NOT NULL COMMENT '메뉴 시퀀스',
  `reg_date`  DATETIME NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  PRIMARY KEY (`mu_seq`),
  UNIQUE KEY `uk_menu_users` (`tu_seq`, `menu_seq`),
  CONSTRAINT `fk_menu_users_tu` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_menu_users_menu` FOREIGN KEY (`menu_seq`) REFERENCES `tb_menu` (`menu_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자별 메뉴 권한';


-- ============================================================================
-- DOMAIN 3: 물리 계층 (3 tables)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- tb_building — 건물 마스터
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_building` (
  `building_seq`           INT           NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `building_name`          VARCHAR(100)  NOT NULL COMMENT '건물명',
  `building_code`          VARCHAR(50)   NOT NULL COMMENT '건물 코드',
  `building_location`      TEXT          NULL     COMMENT '건물 위치',
  `building_floor_count`   INT           NULL     DEFAULT 0 COMMENT '층수',
  `building_order`         INT           NULL     DEFAULT 0 COMMENT '정렬 순서',
  `building_manager_name`  VARCHAR(100)  NULL     COMMENT '관리자명',
  `building_manager_phone` VARCHAR(20)   NULL     COMMENT '관리자 연락처',
  `building_isdel`         CHAR(1)       NULL     DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`               DATETIME      NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`               DATETIME      NULL     DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`building_seq`),
  UNIQUE KEY `uk_building_code` (`building_code`),
  INDEX `idx_building_isdel` (`building_isdel`),
  INDEX `idx_building_name` (`building_name`),
  INDEX `idx_building_order` (`building_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='건물 마스터';


-- ----------------------------------------------------------------------------
-- tb_space — 공간 마스터
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_space` (
  `space_seq`         INT           NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `building_seq`      INT           NOT NULL COMMENT '건물 시퀀스',
  `space_name`        VARCHAR(100)  NOT NULL COMMENT '공간명',
  `space_code`        VARCHAR(50)   NOT NULL COMMENT '공간 코드',
  `space_floor`       VARCHAR(10)   NULL     COMMENT '층',
  `space_type`        VARCHAR(20)   NULL     COMMENT '공간 유형',
  `space_capacity`    INT           NULL     DEFAULT 0 COMMENT '수용 인원',
  `space_description` TEXT          NULL     COMMENT '공간 설명',
  `space_order`       INT           NULL     DEFAULT 0 COMMENT '정렬 순서',
  `space_isdel`       CHAR(1)       NULL     DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`          DATETIME      NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`          DATETIME      NULL     DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`space_seq`),
  UNIQUE KEY `uk_space_code` (`space_code`),
  INDEX `idx_space_building` (`building_seq`),
  INDEX `idx_space_isdel` (`space_isdel`),
  CONSTRAINT `fk_space_building` FOREIGN KEY (`building_seq`) REFERENCES `tb_building` (`building_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공간 마스터';


-- ----------------------------------------------------------------------------
-- tb_user_building — 사용자-건물 권한
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_user_building` (
  `tub_seq`      INT      NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `tu_seq`       INT      NOT NULL COMMENT '사용자 시퀀스',
  `building_seq` INT      NOT NULL COMMENT '건물 시퀀스',
  `reg_date`     DATETIME NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`     DATETIME NULL     DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`tub_seq`),
  UNIQUE KEY `uk_user_building` (`tu_seq`, `building_seq`),
  CONSTRAINT `fk_user_building_tu` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_building_building` FOREIGN KEY (`building_seq`) REFERENCES `tb_building` (`building_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자-건물 권한';


-- ============================================================================
-- DOMAIN 4: IoT 컨트롤러 (5 tables)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- tb_device_preset — 장비 프리셋
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_device_preset` (
  `preset_seq`         INT                                       NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `preset_name`        VARCHAR(100)                              NOT NULL COMMENT '프리셋명',
  `protocol_type`      ENUM('TCP','UDP','WOL','HTTP','RS232')    NOT NULL COMMENT '프로토콜 타입',
  `comm_ip`            VARCHAR(45)                               NULL     COMMENT '통신 서버 IP',
  `comm_port`          INT                                       NULL     COMMENT '통신 포트',
  `preset_description` TEXT                                      NULL     COMMENT '프리셋 설명',
  `preset_order`       INT                                       NULL     DEFAULT 0 COMMENT '정렬 순서',
  `preset_isdel`       CHAR(1)                                   NULL     DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`           DATETIME                                  NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`           DATETIME                                  NULL     DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`preset_seq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='장비 프리셋';


-- ----------------------------------------------------------------------------
-- tb_preset_command — 프리셋 명령어
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_preset_command` (
  `command_seq`   INT           NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `preset_seq`    INT           NOT NULL COMMENT '프리셋 시퀀스',
  `command_name`  VARCHAR(100)  NOT NULL COMMENT '명령어명',
  `command_code`  VARCHAR(500)  NOT NULL COMMENT '명령어 코드',
  `command_type`  VARCHAR(20)   NULL     DEFAULT 'CUSTOM' COMMENT '명령어 유형',
  `command_order` INT           NULL     DEFAULT 0 COMMENT '정렬 순서',
  `command_isdel` CHAR(1)       NULL     DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`      DATETIME      NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`      DATETIME      NULL     DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`command_seq`),
  INDEX `idx_preset_command_preset` (`preset_seq`),
  CONSTRAINT `fk_preset_command_preset` FOREIGN KEY (`preset_seq`) REFERENCES `tb_device_preset` (`preset_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='프리셋 명령어';


-- ----------------------------------------------------------------------------
-- tb_space_device — 공간-장비 매핑
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_space_device` (
  `space_device_seq` INT                        NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `space_seq`        INT                        NOT NULL COMMENT '공간 시퀀스',
  `preset_seq`       INT                        NOT NULL COMMENT '프리셋 시퀀스',
  `device_name`      VARCHAR(100)               NOT NULL COMMENT '장비명',
  `device_ip`        VARCHAR(45)                NOT NULL COMMENT '장비 IP',
  `device_port`      INT                        NOT NULL COMMENT '장비 포트',
  `device_status`    ENUM('ACTIVE','INACTIVE')  NULL     DEFAULT 'ACTIVE' COMMENT '장비 상태',
  `device_order`     INT                        NULL     DEFAULT 0 COMMENT '정렬 순서',
  `device_isdel`     CHAR(1)                    NULL     DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`         DATETIME                   NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`         DATETIME                   NULL     DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`space_device_seq`),
  INDEX `idx_space_device_space` (`space_seq`),
  INDEX `idx_space_device_preset` (`preset_seq`),
  CONSTRAINT `fk_space_device_space` FOREIGN KEY (`space_seq`) REFERENCES `tb_space` (`space_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_space_device_preset` FOREIGN KEY (`preset_seq`) REFERENCES `tb_device_preset` (`preset_seq`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='공간-장비 매핑';


-- ----------------------------------------------------------------------------
-- tb_socket_command — 소켓 명령어 마스터
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_socket_command` (
  `socket_cmd_seq`  INT           NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `cmd_label`       VARCHAR(100)  NOT NULL COMMENT '명령어 라벨',
  `cmd_hex`         VARCHAR(500)  NOT NULL COMMENT '명령어 HEX',
  `cmd_category`    VARCHAR(50)   NOT NULL COMMENT '명령어 카테고리',
  `cmd_description` VARCHAR(500)  NULL     COMMENT '명령어 설명',
  `cmd_order`       INT           NULL     DEFAULT 0 COMMENT '정렬 순서',
  `cmd_isdel`       CHAR(1)       NULL     DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`        DATETIME      NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`        DATETIME      NULL     DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`socket_cmd_seq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='소켓 명령어 마스터';


-- ----------------------------------------------------------------------------
-- tb_control_log — 제어 로그
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_control_log` (
  `log_seq`          INT                                           NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `space_device_seq` INT                                           NOT NULL COMMENT '공간-장비 시퀀스',
  `command_seq`      INT                                           NOT NULL COMMENT '명령어 시퀀스',
  `tu_seq`           INT                                           NOT NULL COMMENT '사용자 시퀀스',
  `trigger_type`     ENUM('MANUAL','NFC','SCHEDULE','VOICE')       NOT NULL DEFAULT 'MANUAL' COMMENT '트리거 유형',
  `result_status`    ENUM('SUCCESS','FAIL','TIMEOUT')              NOT NULL COMMENT '실행 결과',
  `result_message`   TEXT                                          NULL     COMMENT '결과 메시지',
  `executed_at`      DATETIME                                      NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '실행 시각',
  PRIMARY KEY (`log_seq`),
  INDEX `idx_control_log_device` (`space_device_seq`),
  INDEX `idx_control_log_user` (`tu_seq`),
  INDEX `idx_control_log_executed` (`executed_at`),
  CONSTRAINT `fk_control_log_device` FOREIGN KEY (`space_device_seq`) REFERENCES `tb_space_device` (`space_device_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_control_log_command` FOREIGN KEY (`command_seq`) REFERENCES `tb_preset_command` (`command_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_control_log_user` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='제어 로그';


-- ============================================================================
-- DOMAIN 5: NFC/RFID (4 tables)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- tb_nfc_reader — NFC 리더기
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_nfc_reader` (
  `reader_seq`     INT                        NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `space_seq`      INT                        NOT NULL COMMENT '공간 시퀀스',
  `reader_name`    VARCHAR(100)               NOT NULL COMMENT '리더기명',
  `reader_code`    VARCHAR(50)                NOT NULL COMMENT '리더기 코드',
  `reader_serial`  VARCHAR(100)               NULL     COMMENT '시리얼 번호',
  `reader_api_key` VARCHAR(100)               NOT NULL COMMENT 'API 키',
  `reader_status`  ENUM('ACTIVE','INACTIVE')  NULL     DEFAULT 'ACTIVE' COMMENT '리더기 상태',
  `reader_isdel`   CHAR(1)                    NULL     DEFAULT 'N' COMMENT '삭제여부',
  `reader_tag_status`   ENUM('ENTER','EXIT')  NULL     DEFAULT NULL COMMENT '태깅상태 (입실/퇴실)',
  `reader_tag_card_seq` INT                   NULL     DEFAULT NULL COMMENT '현재 태깅한 카드 seq',
  `reg_date`       DATETIME                   NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`       DATETIME                   NULL     DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`reader_seq`),
  UNIQUE KEY `uk_reader_code` (`reader_code`),
  UNIQUE KEY `uk_reader_api_key` (`reader_api_key`),
  INDEX `idx_nfc_reader_space` (`space_seq`),
  CONSTRAINT `fk_nfc_reader_space` FOREIGN KEY (`space_seq`) REFERENCES `tb_space` (`space_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='NFC 리더기';


-- ----------------------------------------------------------------------------
-- tb_nfc_card — NFC 카드
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_nfc_card` (
  `card_seq`        INT                                   NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `tu_seq`          INT                                   NOT NULL COMMENT '사용자 시퀀스',
  `card_identifier` VARCHAR(64)                           NOT NULL COMMENT '카드 식별자',
  `card_aid`        VARCHAR(32)                           NULL     COMMENT 'AID',
  `card_label`      VARCHAR(100)                          NULL     COMMENT '카드 라벨',
  `card_type`       ENUM('CARD','PHONE')                  NULL     DEFAULT 'CARD' COMMENT '카드 유형',
  `card_status`     ENUM('ACTIVE','INACTIVE','BLOCKED')   NULL     DEFAULT 'ACTIVE' COMMENT '카드 상태',
  `card_isdel`      CHAR(1)                               NULL     DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`        DATETIME                              NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`        DATETIME                              NULL     DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`card_seq`),
  UNIQUE KEY `uk_card_identifier` (`card_identifier`),
  INDEX `idx_nfc_card_user` (`tu_seq`),
  CONSTRAINT `fk_nfc_card_user` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='NFC 카드';


-- ----------------------------------------------------------------------------
-- tb_nfc_log — NFC 태깅 로그
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_nfc_log` (
  `nfc_log_seq`    INT                                        NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `reader_seq`     INT                                        NOT NULL COMMENT '리더기 시퀀스',
  `card_seq`       INT                                        NULL     COMMENT '카드 시퀀스',
  `tu_seq`         INT                                        NULL     COMMENT '사용자 시퀀스',
  `space_seq`      INT                                        NOT NULL COMMENT '공간 시퀀스',
  `log_type`       ENUM('ENTER','EXIT','DENIED','UNKNOWN')    NOT NULL COMMENT '로그 유형',
  `tag_identifier` VARCHAR(64)                                NOT NULL COMMENT '태그 식별자',
  `tag_aid`        VARCHAR(32)                                NULL     COMMENT '태그 AID',
  `control_result` ENUM('SUCCESS','FAIL','PARTIAL','SKIPPED') NULL     COMMENT '제어 결과',
  `control_detail` TEXT                                       NULL     COMMENT '제어 상세',
  `tagged_at`      DATETIME                                   NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '태깅 시각',
  PRIMARY KEY (`nfc_log_seq`),
  INDEX `idx_nfc_log_reader` (`reader_seq`),
  INDEX `idx_nfc_log_card` (`card_seq`),
  INDEX `idx_nfc_log_user` (`tu_seq`),
  INDEX `idx_nfc_log_space` (`space_seq`),
  INDEX `idx_nfc_log_tagged_at` (`tagged_at`),
  CONSTRAINT `fk_nfc_log_reader` FOREIGN KEY (`reader_seq`) REFERENCES `tb_nfc_reader` (`reader_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_nfc_log_card` FOREIGN KEY (`card_seq`) REFERENCES `tb_nfc_card` (`card_seq`) ON DELETE SET NULL,
  CONSTRAINT `fk_nfc_log_user` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL,
  CONSTRAINT `fk_nfc_log_space` FOREIGN KEY (`space_seq`) REFERENCES `tb_space` (`space_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='NFC 태깅 로그';


-- ----------------------------------------------------------------------------
-- tb_nfc_reader_command — NFC 리더기 명령어 매핑
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_nfc_reader_command` (
  `reader_command_seq` INT      NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `reader_seq`         INT      NOT NULL COMMENT '리더기 시퀀스',
  `space_device_seq`   INT      NOT NULL COMMENT '공간-장비 시퀀스',
  `enter_command_seq`  INT      NULL     COMMENT '입장 명령어 시퀀스',
  `exit_command_seq`   INT      NULL     COMMENT '퇴장 명령어 시퀀스',
  `command_isdel`      CHAR(1)  NOT NULL DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`reader_command_seq`),
  UNIQUE KEY `uk_reader_device` (`reader_seq`, `space_device_seq`),
  CONSTRAINT `fk_reader_cmd_reader` FOREIGN KEY (`reader_seq`) REFERENCES `tb_nfc_reader` (`reader_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_reader_cmd_device` FOREIGN KEY (`space_device_seq`) REFERENCES `tb_space_device` (`space_device_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_reader_cmd_enter` FOREIGN KEY (`enter_command_seq`) REFERENCES `tb_preset_command` (`command_seq`) ON DELETE SET NULL,
  CONSTRAINT `fk_reader_cmd_exit` FOREIGN KEY (`exit_command_seq`) REFERENCES `tb_preset_command` (`command_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='NFC 리더기 명령어 매핑';


-- ============================================================================
-- DOMAIN 6: 디스플레이/DID (11 tables)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- tb_content — 콘텐츠
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_content` (
  `content_seq`         INT                                     NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `content_name`        VARCHAR(100)                            NOT NULL COMMENT '콘텐츠명',
  `content_code`        VARCHAR(50)                             NOT NULL COMMENT '콘텐츠 코드',
  `content_type`        ENUM('VIDEO','IMAGE','HTML','STREAM')   NOT NULL COMMENT '콘텐츠 유형',
  `content_file_path`   VARCHAR(500)                            NULL     COMMENT '파일 경로',
  `content_url`         VARCHAR(500)                            NULL     COMMENT 'URL',
  `content_duration`    INT                                     NULL     COMMENT '재생 시간(초)',
  `content_orientation` ENUM('LANDSCAPE','PORTRAIT','BOTH')     NOT NULL DEFAULT 'BOTH' COMMENT '화면 방향',
  `content_category`    VARCHAR(50)                             NULL     COMMENT '카테고리',
  `content_tags`        VARCHAR(500)                            NULL     COMMENT '태그',
  `valid_from`          DATETIME                                NULL     COMMENT '유효 시작일',
  `valid_to`            DATETIME                                NULL     COMMENT '유효 종료일',
  `play_count`          INT                                     NOT NULL DEFAULT 0 COMMENT '재생 횟수',
  `content_status`      ENUM('ACTIVE','INACTIVE')               NOT NULL DEFAULT 'ACTIVE' COMMENT '콘텐츠 상태',
  `content_width`       INT                                     NULL     COMMENT '너비(px)',
  `content_height`      INT                                     NULL     COMMENT '높이(px)',
  `content_size`        BIGINT                                  NULL     COMMENT '파일 크기(bytes)',
  `content_mime_type`   VARCHAR(100)                            NULL     COMMENT 'MIME 타입',
  `content_thumbnail`   VARCHAR(500)                            NULL     COMMENT '썸네일 경로',
  `content_description` TEXT                                    NULL     COMMENT '콘텐츠 설명',
  `content_order`       INT                                     NOT NULL DEFAULT 0 COMMENT '정렬 순서',
  `content_isdel`       CHAR(1)                                 NOT NULL DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`            DATETIME                                NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`            DATETIME                                NULL     DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`content_seq`),
  UNIQUE KEY `uk_content_code` (`content_code`),
  INDEX `idx_content_type` (`content_type`),
  INDEX `idx_content_status` (`content_status`),
  INDEX `idx_content_isdel` (`content_isdel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='콘텐츠';


-- ----------------------------------------------------------------------------
-- tb_play_list — 플레이리스트
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_play_list` (
  `playlist_seq`           INT                                            NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `playlist_name`          VARCHAR(100)                                   NOT NULL COMMENT '플레이리스트명',
  `playlist_code`          VARCHAR(50)                                    NOT NULL COMMENT '플레이리스트 코드',
  `playlist_type`          ENUM('NORMAL','EMERGENCY','ANNOUNCEMENT')      NOT NULL DEFAULT 'NORMAL' COMMENT '유형',
  `playlist_priority`      TINYINT                                        NOT NULL DEFAULT 0 COMMENT '우선순위',
  `playlist_duration`      INT                                            NULL     COMMENT '총 재생 시간(초)',
  `playlist_loop`          CHAR(1)                                        NOT NULL DEFAULT 'Y' COMMENT '반복 재생',
  `playlist_random`        CHAR(1)                                        NOT NULL DEFAULT 'N' COMMENT '랜덤 재생',
  `playlist_screen_layout` ENUM('1x1','1x2','1x3','1x4','2x2','2x4','1x8')                 NOT NULL DEFAULT '1x1' COMMENT '화면 레이아웃',
  `playlist_status`        ENUM('ACTIVE','INACTIVE')                      NOT NULL DEFAULT 'ACTIVE' COMMENT '상태',
  `playlist_description`   TEXT                                           NULL     COMMENT '설명',
  `playlist_order`         INT                                            NOT NULL DEFAULT 0 COMMENT '정렬 순서',
  `playlist_isdel`         CHAR(1)                                        NOT NULL DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`               DATETIME                                       NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`               DATETIME                                       NULL     DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`playlist_seq`),
  UNIQUE KEY `uk_playlist_code` (`playlist_code`),
  INDEX `idx_playlist_status` (`playlist_status`),
  INDEX `idx_playlist_isdel` (`playlist_isdel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='플레이리스트';


-- ----------------------------------------------------------------------------
-- tb_play_list_content — 플레이리스트-콘텐츠 매핑 + 승인
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_play_list_content` (
  `plc_seq`             INT                                    NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `playlist_seq`        INT                                    NOT NULL COMMENT '플레이리스트 시퀀스',
  `content_seq`         INT                                    NOT NULL COMMENT '콘텐츠 시퀀스',
  `play_order`          INT                                    NOT NULL DEFAULT 0 COMMENT '재생 순서',
  `play_duration`       INT                                    NULL     COMMENT '재생 시간(초)',
  `transition_effect`   VARCHAR(50)                            NULL     COMMENT '전환 효과',
  `transition_duration` INT                                    NOT NULL DEFAULT 0 COMMENT '전환 시간(ms)',
  `zone_number`         TINYINT                                NOT NULL DEFAULT 1 COMMENT '존 번호',
  `zone_width`          DECIMAL(5,2)                           NOT NULL DEFAULT 100.00 COMMENT '존 너비(%)',
  `zone_height`         DECIMAL(5,2)                           NOT NULL DEFAULT 100.00 COMMENT '존 높이(%)',
  `zone_x_position`     DECIMAL(5,2)                           NOT NULL DEFAULT 0.00 COMMENT '존 X 위치(%)',
  `zone_y_position`     DECIMAL(5,2)                           NOT NULL DEFAULT 0.00 COMMENT '존 Y 위치(%)',
  `plc_isdel`           CHAR(1)                                NOT NULL DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`            DATETIME                               NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `requester_seq`       INT                                    NULL     COMMENT '요청자 시퀀스',
  `approval_status`     ENUM('PENDING','APPROVED','REJECTED')  NOT NULL DEFAULT 'PENDING' COMMENT '승인 상태',
  `reviewer_seq`        INT                                    NULL     COMMENT '검토자 시퀀스',
  `reviewed_date`       DATETIME                               NULL     COMMENT '검토일',
  `reject_reason`       TEXT                                   NULL     COMMENT '반려 사유',
  PRIMARY KEY (`plc_seq`),
  INDEX `idx_plc_playlist` (`playlist_seq`),
  INDEX `idx_plc_content` (`content_seq`),
  INDEX `idx_plc_approval` (`approval_status`),
  CONSTRAINT `fk_plc_playlist` FOREIGN KEY (`playlist_seq`) REFERENCES `tb_play_list` (`playlist_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_plc_content` FOREIGN KEY (`content_seq`) REFERENCES `tb_content` (`content_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_plc_requester` FOREIGN KEY (`requester_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL,
  CONSTRAINT `fk_plc_reviewer` FOREIGN KEY (`reviewer_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='플레이리스트-콘텐츠 매핑';


-- ----------------------------------------------------------------------------
-- tb_content_approval_log — 콘텐츠 승인 이력
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_content_approval_log` (
  `log_seq`    INT                                       NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `plc_seq`    INT                                       NOT NULL COMMENT '플레이리스트-콘텐츠 시퀀스',
  `action`     ENUM('APPROVED','REJECTED','CANCELLED')   NOT NULL COMMENT '액션',
  `actor_seq`  INT                                       NULL     COMMENT '실행자 시퀀스',
  `reason`     TEXT                                      NULL     COMMENT '사유',
  `created_at` DATETIME                                  NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '생성일',
  PRIMARY KEY (`log_seq`),
  INDEX `idx_approval_log_plc` (`plc_seq`),
  CONSTRAINT `fk_approval_log_plc` FOREIGN KEY (`plc_seq`) REFERENCES `tb_play_list_content` (`plc_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_approval_log_actor` FOREIGN KEY (`actor_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='콘텐츠 승인 이력';


-- ----------------------------------------------------------------------------
-- tb_player — 디스플레이 장치
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_player` (
  `player_seq`           INT                                                  NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `player_name`          VARCHAR(100)                                         NOT NULL COMMENT '플레이어명',
  `player_code`          VARCHAR(50)                                          NOT NULL COMMENT '플레이어 코드',
  `player_did`           VARCHAR(100)                                         NULL     COMMENT '디바이스 ID',
  `player_mac`           VARCHAR(17)                                          NULL     COMMENT 'MAC 주소',
  `building_seq`         INT                                                  NOT NULL COMMENT '건물 시퀀스',
  `space_seq`            INT                                                  NULL     COMMENT '공간 시퀀스',
  `playlist_seq`         INT                                                  NULL     COMMENT '플레이리스트 시퀀스',
  `player_ip`            VARCHAR(45)                                          NOT NULL COMMENT 'IP 주소',
  `player_port`          INT                                                  NOT NULL DEFAULT 9090 COMMENT '포트',
  `player_api_key`       VARCHAR(100)                                         NOT NULL COMMENT 'API 키',
  `player_secret`        VARCHAR(255)                                         NULL     COMMENT '시크릿',
  `player_approval`      ENUM('PENDING','APPROVED','REJECTED')                NOT NULL DEFAULT 'PENDING' COMMENT '승인 상태',
  `approved_by`          INT                                                  NULL     COMMENT '승인자 시퀀스',
  `approved_at`          DATETIME                                             NULL     COMMENT '승인일',
  `reject_reason`        TEXT                                                 NULL     COMMENT '반려 사유',
  `player_status`        ENUM('ONLINE','OFFLINE','ERROR','MAINTENANCE')       NOT NULL DEFAULT 'OFFLINE' COMMENT '플레이어 상태',
  `last_heartbeat_at`    DATETIME                                             NULL     COMMENT '마지막 하트비트',
  `last_content_played`  VARCHAR(255)                                         NULL     COMMENT '마지막 재생 콘텐츠',
  `player_version`       VARCHAR(20)                                          NULL     COMMENT '플레이어 버전',
  `player_resolution`    VARCHAR(20)                                          NULL     COMMENT '해상도',
  `player_orientation`   ENUM('LANDSCAPE','PORTRAIT')                         NOT NULL DEFAULT 'LANDSCAPE' COMMENT '화면 방향',
  `default_volume`       TINYINT                                              NOT NULL DEFAULT 50 COMMENT '기본 볼륨',
  `player_description`   TEXT                                                 NULL     COMMENT '플레이어 설명',
  `player_order`         INT                                                  NOT NULL DEFAULT 0 COMMENT '정렬 순서',
  `player_isdel`         CHAR(1)                                              NOT NULL DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`             DATETIME                                             NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`             DATETIME                                             NULL     DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`player_seq`),
  UNIQUE KEY `uk_player_code` (`player_code`),
  UNIQUE KEY `uk_player_api_key` (`player_api_key`),
  INDEX `idx_player_building` (`building_seq`),
  INDEX `idx_player_space` (`space_seq`),
  INDEX `idx_player_status` (`player_status`),
  INDEX `idx_player_approval` (`player_approval`),
  INDEX `idx_player_isdel` (`player_isdel`),
  CONSTRAINT `fk_player_building` FOREIGN KEY (`building_seq`) REFERENCES `tb_building` (`building_seq`),
  CONSTRAINT `fk_player_space` FOREIGN KEY (`space_seq`) REFERENCES `tb_space` (`space_seq`),
  CONSTRAINT `fk_player_playlist` FOREIGN KEY (`playlist_seq`) REFERENCES `tb_play_list` (`playlist_seq`),
  CONSTRAINT `fk_player_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `tb_users` (`tu_seq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='디스플레이 장치';


-- ----------------------------------------------------------------------------
-- tb_player_heartbeat_log — 플레이어 헬스체크 로그
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_player_heartbeat_log` (
  `heartbeat_seq`    INT           NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `player_seq`       INT           NOT NULL COMMENT '플레이어 시퀀스',
  `heartbeat_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '하트비트 시각',
  `player_ip`        VARCHAR(45)   NULL     COMMENT 'IP 주소',
  `player_version`   VARCHAR(20)   NULL     COMMENT '플레이어 버전',
  `cpu_usage`        DECIMAL(5,2)  NULL     COMMENT 'CPU 사용률(%)',
  `memory_usage`     DECIMAL(5,2)  NULL     COMMENT '메모리 사용률(%)',
  `disk_usage`       DECIMAL(5,2)  NULL     COMMENT '디스크 사용률(%)',
  `display_status`   VARCHAR(10)   NULL     COMMENT '디스플레이 상태',
  `resolution`       VARCHAR(20)   NULL     COMMENT '해상도',
  `orientation`      VARCHAR(10)   NULL     COMMENT '화면 방향',
  `volume`           TINYINT       NULL     COMMENT '볼륨',
  `network_type`     VARCHAR(10)   NULL     COMMENT '네트워크 유형',
  `network_speed`    INT           NULL     COMMENT '네트워크 속도',
  `uptime`           BIGINT        NULL     COMMENT '가동 시간(초)',
  `storage_free`     BIGINT        NULL     COMMENT '여유 저장공간(bytes)',
  `os_version`       VARCHAR(50)   NULL     COMMENT 'OS 버전',
  `last_download_at` DATETIME      NULL     COMMENT '마지막 다운로드 시각',
  `current_playlist` INT           NULL     COMMENT '현재 플레이리스트',
  `current_content`  VARCHAR(255)  NULL     COMMENT '현재 콘텐츠',
  `error_message`    TEXT          NULL     COMMENT '에러 메시지',
  PRIMARY KEY (`heartbeat_seq`),
  INDEX `idx_heartbeat_player` (`player_seq`),
  INDEX `idx_heartbeat_at` (`heartbeat_at`),
  CONSTRAINT `fk_heartbeat_player` FOREIGN KEY (`player_seq`) REFERENCES `tb_player` (`player_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='플레이어 헬스체크 로그';


-- ----------------------------------------------------------------------------
-- tb_player_group — 플레이어 그룹
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_player_group` (
  `group_seq`         INT           NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `group_name`        VARCHAR(100)  NOT NULL COMMENT '그룹명',
  `group_code`        VARCHAR(50)   NOT NULL COMMENT '그룹 코드',
  `building_seq`      INT           NULL     COMMENT '건물 시퀀스',
  `group_description` TEXT          NULL     COMMENT '그룹 설명',
  `group_order`       INT           NOT NULL DEFAULT 0 COMMENT '정렬 순서',
  `group_isdel`       CHAR(1)       NOT NULL DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`          DATETIME      NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`          DATETIME      NULL     DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`group_seq`),
  UNIQUE KEY `uk_group_code` (`group_code`),
  INDEX `idx_group_building` (`building_seq`),
  CONSTRAINT `fk_player_group_building` FOREIGN KEY (`building_seq`) REFERENCES `tb_building` (`building_seq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='플레이어 그룹';


-- ----------------------------------------------------------------------------
-- tb_player_group_member — 그룹 멤버
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_player_group_member` (
  `pgm_seq`    INT      NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `group_seq`  INT      NOT NULL COMMENT '그룹 시퀀스',
  `player_seq` INT      NOT NULL COMMENT '플레이어 시퀀스',
  `pgm_isdel`  CHAR(1)  NOT NULL DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`   DATETIME NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  PRIMARY KEY (`pgm_seq`),
  INDEX `idx_pgm_group` (`group_seq`),
  INDEX `idx_pgm_player` (`player_seq`),
  CONSTRAINT `fk_pgm_group` FOREIGN KEY (`group_seq`) REFERENCES `tb_player_group` (`group_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_pgm_player` FOREIGN KEY (`player_seq`) REFERENCES `tb_player` (`player_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='그룹 멤버';


-- ----------------------------------------------------------------------------
-- tb_player_playlist — 플레이어-플레이리스트 할당
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_player_playlist` (
  `pp_seq`              INT                        NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `player_seq`          INT                        NOT NULL COMMENT '플레이어 시퀀스',
  `playlist_seq`        INT                        NOT NULL COMMENT '플레이리스트 시퀀스',
  `pp_priority`         TINYINT                    NULL     DEFAULT 0 COMMENT '우선순위',
  `schedule_start_time` TIME                       NULL     COMMENT '스케줄 시작 시간',
  `schedule_end_time`   TIME                       NULL     COMMENT '스케줄 종료 시간',
  `schedule_days`       VARCHAR(14)                NULL     COMMENT '스케줄 요일',
  `pp_status`           ENUM('ACTIVE','INACTIVE')  NULL     DEFAULT 'ACTIVE' COMMENT '상태',
  `pp_isdel`            CHAR(1)                    NULL     DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`            DATETIME                   NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`            DATETIME                   NULL     DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`pp_seq`),
  INDEX `idx_pp_player` (`player_seq`),
  INDEX `idx_pp_playlist` (`playlist_seq`),
  CONSTRAINT `fk_pp_player` FOREIGN KEY (`player_seq`) REFERENCES `tb_player` (`player_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_pp_playlist` FOREIGN KEY (`playlist_seq`) REFERENCES `tb_play_list` (`playlist_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='플레이어-플레이리스트 할당';


-- ----------------------------------------------------------------------------
-- tb_group_playlist — 그룹-플레이리스트 할당
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_group_playlist` (
  `gp_seq`              INT                        NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `group_seq`           INT                        NOT NULL COMMENT '그룹 시퀀스',
  `playlist_seq`        INT                        NOT NULL COMMENT '플레이리스트 시퀀스',
  `gp_priority`         TINYINT                    NULL     DEFAULT 0 COMMENT '우선순위',
  `schedule_start_time` TIME                       NULL     COMMENT '스케줄 시작 시간',
  `schedule_end_time`   TIME                       NULL     COMMENT '스케줄 종료 시간',
  `schedule_days`       VARCHAR(14)                NULL     COMMENT '스케줄 요일',
  `gp_status`           ENUM('ACTIVE','INACTIVE')  NULL     DEFAULT 'ACTIVE' COMMENT '상태',
  `gp_isdel`            CHAR(1)                    NULL     DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`            DATETIME                   NULL     DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`            DATETIME                   NULL     DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`gp_seq`),
  INDEX `idx_gp_group` (`group_seq`),
  INDEX `idx_gp_playlist` (`playlist_seq`),
  CONSTRAINT `fk_gp_group` FOREIGN KEY (`group_seq`) REFERENCES `tb_player_group` (`group_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_gp_playlist` FOREIGN KEY (`playlist_seq`) REFERENCES `tb_play_list` (`playlist_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='그룹-플레이리스트 할당';


-- ----------------------------------------------------------------------------
-- tb_play_log — 재생 로그
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_play_log` (
  `log_seq`         BIGINT                                NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `player_seq`      INT                                   NOT NULL COMMENT '플레이어 시퀀스',
  `playlist_seq`    INT                                   NULL     COMMENT '플레이리스트 시퀀스',
  `content_seq`     INT                                   NOT NULL COMMENT '콘텐츠 시퀀스',
  `zone_number`     TINYINT                               NOT NULL DEFAULT 1 COMMENT '존 번호',
  `play_started_at` DATETIME                              NOT NULL COMMENT '재생 시작 시각',
  `play_ended_at`   DATETIME                              NULL     COMMENT '재생 종료 시각',
  `play_duration`   INT                                   NULL     COMMENT '재생 시간(초)',
  `play_status`     ENUM('COMPLETED','SKIPPED','ERROR')   NOT NULL COMMENT '재생 상태',
  `error_message`   TEXT                                  NULL     COMMENT '에러 메시지',
  PRIMARY KEY (`log_seq`),
  INDEX `idx_play_log_player` (`player_seq`),
  INDEX `idx_play_log_content` (`content_seq`),
  INDEX `idx_play_log_started` (`play_started_at`),
  CONSTRAINT `fk_play_log_player` FOREIGN KEY (`player_seq`) REFERENCES `tb_player` (`player_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_play_log_playlist` FOREIGN KEY (`playlist_seq`) REFERENCES `tb_play_list` (`playlist_seq`) ON DELETE SET NULL,
  CONSTRAINT `fk_play_log_content` FOREIGN KEY (`content_seq`) REFERENCES `tb_content` (`content_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='재생 로그';


-- ============================================================================
-- DOMAIN 7: 녹화기 (7 tables)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- tb_recorder — 녹화기 마스터
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_recorder` (
  `recorder_seq`      INT                                  NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `space_seq`         INT                                  NOT NULL COMMENT '공간 시퀀스',
  `recorder_name`     VARCHAR(100)                         NOT NULL COMMENT '녹화기명',
  `recorder_ip`       VARCHAR(45)                          NOT NULL COMMENT 'IP 주소',
  `recorder_port`     INT                                  NULL     DEFAULT 80 COMMENT '포트',
  `recorder_protocol` ENUM('HTTP','ONVIF','RTSP')          NOT NULL DEFAULT 'HTTP' COMMENT '프로토콜',
  `recorder_username` VARCHAR(100)                         NULL     COMMENT '사용자명',
  `recorder_password` VARCHAR(255)                         NULL     COMMENT '비밀번호',
  `recorder_model`    VARCHAR(100)                         NULL     COMMENT '모델명',
  `recorder_status`   ENUM('ONLINE','OFFLINE','ERROR')     NOT NULL DEFAULT 'OFFLINE' COMMENT '녹화기 상태',
  `current_user_seq`  INT                                  NULL     COMMENT '현재 사용자 시퀀스',
  `last_health_check` DATETIME                             NULL     COMMENT '마지막 헬스체크',
  `recorder_order`    INT                                  NULL     DEFAULT 0 COMMENT '정렬 순서',
  `recorder_isdel`    CHAR(1)                              NOT NULL DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`          DATETIME                             NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`          DATETIME                             NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`recorder_seq`),
  UNIQUE KEY `uk_recorder_space` (`space_seq`),
  INDEX `idx_recorder_status` (`recorder_status`),
  INDEX `idx_recorder_isdel` (`recorder_isdel`),
  CONSTRAINT `fk_recorder_space` FOREIGN KEY (`space_seq`) REFERENCES `tb_space` (`space_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_recorder_current_user` FOREIGN KEY (`current_user_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='녹화기 마스터';


-- ----------------------------------------------------------------------------
-- tb_recorder_user — 녹화기-사용자 매핑
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_recorder_user` (
  `recorder_user_seq`   INT      NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `recorder_seq`        INT      NOT NULL COMMENT '녹화기 시퀀스',
  `tu_seq`              INT      NOT NULL COMMENT '사용자 시퀀스',
  `is_default`          CHAR(1)  NOT NULL DEFAULT 'N' COMMENT '기본 여부',
  `recorder_user_isdel` CHAR(1)  NOT NULL DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`recorder_user_seq`),
  UNIQUE KEY `uk_recorder_user` (`recorder_seq`, `tu_seq`),
  CONSTRAINT `fk_recorder_user_recorder` FOREIGN KEY (`recorder_seq`) REFERENCES `tb_recorder` (`recorder_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_recorder_user_tu` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='녹화기-사용자 매핑';


-- ----------------------------------------------------------------------------
-- tb_recorder_preset — PTZ 프리셋
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_recorder_preset` (
  `rec_preset_seq`     INT           NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `recorder_seq`       INT           NOT NULL COMMENT '녹화기 시퀀스',
  `preset_name`        VARCHAR(100)  NOT NULL COMMENT '프리셋명',
  `preset_number`      INT           NOT NULL COMMENT '프리셋 번호',
  `pan_value`          FLOAT         NULL     COMMENT 'Pan 값',
  `tilt_value`         FLOAT         NULL     COMMENT 'Tilt 값',
  `zoom_value`         FLOAT         NULL     COMMENT 'Zoom 값',
  `preset_description` TEXT          NULL     COMMENT '프리셋 설명',
  `preset_order`       INT           NULL     DEFAULT 0 COMMENT '정렬 순서',
  `preset_isdel`       CHAR(1)       NOT NULL DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`           DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`rec_preset_seq`),
  UNIQUE KEY `uk_recorder_preset_number` (`recorder_seq`, `preset_number`),
  CONSTRAINT `fk_recorder_preset_recorder` FOREIGN KEY (`recorder_seq`) REFERENCES `tb_recorder` (`recorder_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='PTZ 프리셋';


-- ----------------------------------------------------------------------------
-- tb_ftp_config — FTP 설정
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_ftp_config` (
  `ftp_config_seq`   INT                          NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `recorder_seq`     INT                          NULL     COMMENT '녹화기 시퀀스',
  `ftp_name`         VARCHAR(100)                 NOT NULL COMMENT 'FTP명',
  `ftp_host`         VARCHAR(255)                 NOT NULL COMMENT '호스트',
  `ftp_port`         INT                          NOT NULL DEFAULT 21 COMMENT '포트',
  `ftp_username`     VARCHAR(100)                 NOT NULL COMMENT '사용자명',
  `ftp_password`     VARCHAR(255)                 NOT NULL COMMENT '비밀번호',
  `ftp_path`         VARCHAR(500)                 NULL     DEFAULT '/' COMMENT '경로',
  `ftp_protocol`     ENUM('FTP','SFTP','FTPS')    NOT NULL DEFAULT 'FTP' COMMENT '프로토콜',
  `ftp_passive_mode` CHAR(1)                      NOT NULL DEFAULT 'Y' COMMENT '패시브 모드',
  `is_default`       CHAR(1)                      NOT NULL DEFAULT 'N' COMMENT '기본 여부',
  `ftp_isdel`        CHAR(1)                      NOT NULL DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`         DATETIME                     NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`         DATETIME                     NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`ftp_config_seq`),
  INDEX `idx_ftp_config_recorder` (`recorder_seq`),
  CONSTRAINT `fk_ftp_config_recorder` FOREIGN KEY (`recorder_seq`) REFERENCES `tb_recorder` (`recorder_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='FTP 설정';


-- ----------------------------------------------------------------------------
-- tb_recording_session — 녹화 세션
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_recording_session` (
  `rec_session_seq` INT                                                NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `recorder_seq`    INT                                                NOT NULL COMMENT '녹화기 시퀀스',
  `tu_seq`          INT                                                NULL     COMMENT '사용자 시퀀스',
  `session_status`  ENUM('RECORDING','COMPLETED','FAILED','CANCELLED') NOT NULL COMMENT '세션 상태',
  `rec_preset_seq`  INT                                                NULL     COMMENT 'PTZ 프리셋 시퀀스',
  `session_title`   VARCHAR(200)                                       NULL     COMMENT '세션 제목',
  `started_at`      DATETIME                                           NOT NULL COMMENT '시작 시각',
  `ended_at`        DATETIME                                           NULL     COMMENT '종료 시각',
  `duration_sec`    INT                                                NULL     COMMENT '녹화 시간(초)',
  `reg_date`        DATETIME                                           NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`        DATETIME                                           NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`rec_session_seq`),
  INDEX `idx_rec_session_recorder` (`recorder_seq`),
  INDEX `idx_rec_session_user` (`tu_seq`),
  INDEX `idx_rec_session_status` (`session_status`),
  CONSTRAINT `fk_rec_session_recorder` FOREIGN KEY (`recorder_seq`) REFERENCES `tb_recorder` (`recorder_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_rec_session_user` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL,
  CONSTRAINT `fk_rec_session_preset` FOREIGN KEY (`rec_preset_seq`) REFERENCES `tb_recorder_preset` (`rec_preset_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='녹화 세션';


-- ----------------------------------------------------------------------------
-- tb_recording_file — 녹화 파일
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_recording_file` (
  `rec_file_seq`     INT                                                       NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `rec_session_seq`  INT                                                       NOT NULL COMMENT '녹화 세션 시퀀스',
  `file_name`        VARCHAR(255)                                              NOT NULL COMMENT '파일명',
  `file_path`        VARCHAR(500)                                              NULL     COMMENT '파일 경로',
  `file_size`        BIGINT                                                    NULL     COMMENT '파일 크기(bytes)',
  `file_format`      VARCHAR(20)                                               NULL     COMMENT '파일 포맷',
  `file_duration_sec` INT                                                      NULL     COMMENT '파일 길이(초)',
  `ftp_status`       ENUM('PENDING','UPLOADING','COMPLETED','FAILED','RETRY')  NOT NULL DEFAULT 'PENDING' COMMENT 'FTP 상태',
  `ftp_config_seq`   INT                                                       NULL     COMMENT 'FTP 설정 시퀀스',
  `ftp_uploaded_path` VARCHAR(500)                                             NULL     COMMENT 'FTP 업로드 경로',
  `ftp_uploaded_at`  DATETIME                                                  NULL     COMMENT 'FTP 업로드 시각',
  `ftp_retry_count`  INT                                                       NOT NULL DEFAULT 0 COMMENT 'FTP 재시도 횟수',
  `ftp_error_message` TEXT                                                     NULL     COMMENT 'FTP 에러 메시지',
  `file_isdel`       CHAR(1)                                                   NOT NULL DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`         DATETIME                                                  NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`         DATETIME                                                  NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`rec_file_seq`),
  INDEX `idx_rec_file_session` (`rec_session_seq`),
  INDEX `idx_rec_file_ftp_status` (`ftp_status`),
  CONSTRAINT `fk_rec_file_session` FOREIGN KEY (`rec_session_seq`) REFERENCES `tb_recording_session` (`rec_session_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_rec_file_ftp_config` FOREIGN KEY (`ftp_config_seq`) REFERENCES `tb_ftp_config` (`ftp_config_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='녹화 파일';


-- ----------------------------------------------------------------------------
-- tb_recorder_log — 녹화기 명령 로그
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_recorder_log` (
  `rec_log_seq`    INT                                                              NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `recorder_seq`   INT                                                              NOT NULL COMMENT '녹화기 시퀀스',
  `tu_seq`         INT                                                              NULL     COMMENT '사용자 시퀀스',
  `log_type`       ENUM('PTZ','REC_START','REC_STOP','PRESET_APPLY','STATUS_CHECK','POWER') NOT NULL COMMENT '로그 유형',
  `command_detail` TEXT                                                             NULL     COMMENT '명령어 상세',
  `result_status`  ENUM('SUCCESS','FAIL','TIMEOUT')                                NOT NULL COMMENT '실행 결과',
  `result_message` TEXT                                                             NULL     COMMENT '결과 메시지',
  `executed_at`    DATETIME                                                         NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '실행 시각',
  PRIMARY KEY (`rec_log_seq`),
  INDEX `idx_rec_log_recorder` (`recorder_seq`),
  INDEX `idx_rec_log_user` (`tu_seq`),
  INDEX `idx_rec_log_executed` (`executed_at`),
  CONSTRAINT `fk_rec_log_recorder` FOREIGN KEY (`recorder_seq`) REFERENCES `tb_recorder` (`recorder_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_rec_log_user` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='녹화기 명령 로그';


-- ============================================================================
-- DOMAIN 8: AI 시스템 (6 tables)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- tb_ai_worker_server — AI Worker 서버
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_ai_worker_server` (
  `worker_server_seq`   INT                                                  NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `server_name`         VARCHAR(100)                                         NOT NULL COMMENT '서버명',
  `server_url`          VARCHAR(255)                                         NOT NULL COMMENT '서버 URL',
  `api_key`             VARCHAR(255)                                         NOT NULL COMMENT 'API 키',
  `callback_secret`     VARCHAR(255)                                         NULL     COMMENT '콜백 시크릿',
  `server_status`       ENUM('ONLINE','OFFLINE','ERROR','MAINTENANCE')       NOT NULL DEFAULT 'OFFLINE' COMMENT '서버 상태',
  `last_health_check`   DATETIME                                             NULL     COMMENT '마지막 헬스체크',
  `gpu_info`            VARCHAR(200)                                         NULL     COMMENT 'GPU 정보',
  `max_concurrent_jobs` INT                                                  NOT NULL DEFAULT 1 COMMENT '최대 동시 작업 수',
  `default_stt_model`   VARCHAR(50)                                          NULL     DEFAULT 'large-v3' COMMENT '기본 STT 모델',
  `default_llm_model`   VARCHAR(50)                                          NULL     DEFAULT 'llama3' COMMENT '기본 LLM 모델',
  `server_isdel`        CHAR(1)                                              NOT NULL DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`            DATETIME                                             NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`            DATETIME                                             NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`worker_server_seq`),
  UNIQUE KEY `uk_worker_server_url` (`server_url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI Worker 서버';


-- ----------------------------------------------------------------------------
-- tb_ai_voice_command — 음성 명령어 매핑
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_ai_voice_command` (
  `voice_command_seq` INT           NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `space_seq`         INT           NOT NULL COMMENT '공간 시퀀스',
  `keyword`           VARCHAR(100)  NOT NULL COMMENT '키워드',
  `keyword_aliases`   TEXT          NULL     COMMENT '키워드 별칭',
  `space_device_seq`  INT           NOT NULL COMMENT '공간-장비 시퀀스',
  `command_seq`       INT           NOT NULL COMMENT '명령어 시퀀스',
  `min_confidence`    FLOAT         NOT NULL DEFAULT 0.85 COMMENT '최소 신뢰도',
  `command_priority`  INT           NULL     DEFAULT 0 COMMENT '명령어 우선순위',
  `command_isdel`     CHAR(1)       NOT NULL DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`voice_command_seq`),
  INDEX `idx_voice_cmd_space` (`space_seq`),
  INDEX `idx_voice_cmd_device` (`space_device_seq`),
  CONSTRAINT `fk_voice_cmd_space` FOREIGN KEY (`space_seq`) REFERENCES `tb_space` (`space_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_voice_cmd_device` FOREIGN KEY (`space_device_seq`) REFERENCES `tb_space_device` (`space_device_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_voice_cmd_command` FOREIGN KEY (`command_seq`) REFERENCES `tb_preset_command` (`command_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='음성 명령어 매핑';


-- ----------------------------------------------------------------------------
-- tb_ai_speech_session — 음성인식 세션
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_ai_speech_session` (
  `session_seq`        INT                             NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `space_seq`          INT                             NOT NULL COMMENT '공간 시퀀스',
  `tu_seq`             INT                             NULL     COMMENT '사용자 시퀀스',
  `session_status`     ENUM('ACTIVE','PAUSED','ENDED') NOT NULL DEFAULT 'ACTIVE' COMMENT '세션 상태',
  `stt_engine`         VARCHAR(50)                     NULL     DEFAULT 'faster-whisper' COMMENT 'STT 엔진',
  `stt_model`          VARCHAR(50)                     NULL     DEFAULT 'small' COMMENT 'STT 모델',
  `started_at`         DATETIME                        NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '시작 시각',
  `ended_at`           DATETIME                        NULL     COMMENT '종료 시각',
  `total_duration_sec` INT                             NULL     COMMENT '총 시간(초)',
  `total_segments`     INT                             NULL     DEFAULT 0 COMMENT '총 세그먼트 수',
  `total_commands`     INT                             NULL     DEFAULT 0 COMMENT '총 명령 수',
  `recording_filename` VARCHAR(255)                    NULL     COMMENT '녹음 파일명',
  `summary_seq`        INT                             NULL     COMMENT '요약 시퀀스',
  `session_isdel`      CHAR(1)                         NOT NULL DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`           DATETIME                        NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`           DATETIME                        NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`session_seq`),
  INDEX `idx_speech_session_space` (`space_seq`),
  INDEX `idx_speech_session_user` (`tu_seq`),
  INDEX `idx_speech_session_status` (`session_status`),
  CONSTRAINT `fk_speech_session_space` FOREIGN KEY (`space_seq`) REFERENCES `tb_space` (`space_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_speech_session_user` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='음성인식 세션';


-- ----------------------------------------------------------------------------
-- tb_ai_speech_log — 음성인식 로그
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_ai_speech_log` (
  `speech_log_seq`    INT      NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `session_seq`       INT      NOT NULL COMMENT '세션 시퀀스',
  `segment_text`      TEXT     NOT NULL COMMENT '인식 텍스트',
  `segment_start_sec` FLOAT    NULL     COMMENT '시작 시간(초)',
  `segment_end_sec`   FLOAT    NULL     COMMENT '종료 시간(초)',
  `confidence`        FLOAT    NULL     COMMENT '신뢰도',
  `is_command`        CHAR(1)  NOT NULL DEFAULT 'N' COMMENT '명령 여부',
  `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '생성일',
  PRIMARY KEY (`speech_log_seq`),
  INDEX `idx_speech_log_session` (`session_seq`),
  CONSTRAINT `fk_speech_log_session` FOREIGN KEY (`session_seq`) REFERENCES `tb_ai_speech_session` (`session_seq`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='음성인식 로그';


-- ----------------------------------------------------------------------------
-- tb_ai_command_log — 음성 명령 실행 로그
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_ai_command_log` (
  `command_log_seq`   INT                                                    NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `session_seq`       INT                                                    NOT NULL COMMENT '세션 시퀀스',
  `voice_command_seq` INT                                                    NULL     COMMENT '음성 명령어 시퀀스',
  `recognized_text`   VARCHAR(200)                                           NOT NULL COMMENT '인식된 텍스트',
  `matched_keyword`   VARCHAR(100)                                           NULL     COMMENT '매칭된 키워드',
  `match_score`       FLOAT                                                  NULL     COMMENT '매칭 점수',
  `verify_source`     ENUM('LOCAL_VOSK','REMOTE_WHISPER')                    NULL     COMMENT '검증 소스',
  `execution_status`  ENUM('MATCHED','EXECUTED','FAILED','NO_MATCH')         NOT NULL COMMENT '실행 상태',
  `execution_result`  TEXT                                                   NULL     COMMENT '실행 결과',
  `created_at`        DATETIME                                               NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '생성일',
  PRIMARY KEY (`command_log_seq`),
  INDEX `idx_cmd_log_session` (`session_seq`),
  INDEX `idx_cmd_log_voice_cmd` (`voice_command_seq`),
  CONSTRAINT `fk_cmd_log_session` FOREIGN KEY (`session_seq`) REFERENCES `tb_ai_speech_session` (`session_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_cmd_log_voice_cmd` FOREIGN KEY (`voice_command_seq`) REFERENCES `tb_ai_voice_command` (`voice_command_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='음성 명령 실행 로그';


-- ----------------------------------------------------------------------------
-- tb_ai_lecture_summary — 강의요약
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tb_ai_lecture_summary` (
  `summary_seq`        INT                                                      NOT NULL AUTO_INCREMENT COMMENT '시퀀스',
  `space_seq`          INT                                                      NOT NULL COMMENT '공간 시퀀스',
  `tu_seq`             INT                                                      NULL     COMMENT '사용자 시퀀스',
  `device_code`        VARCHAR(50)                                              NOT NULL COMMENT '디바이스 코드',
  `job_id`             VARCHAR(36)                                              NOT NULL COMMENT 'Job ID',
  `recording_title`    VARCHAR(200)                                             NULL     COMMENT '녹음 제목',
  `recording_filename` VARCHAR(255)                                             NOT NULL COMMENT '녹음 파일명',
  `duration_seconds`   INT                                                      NULL     COMMENT '녹음 길이(초)',
  `recorded_at`        DATETIME                                                 NULL     COMMENT '녹음일',
  `stt_text`           LONGTEXT                                                 NULL     COMMENT 'STT 텍스트',
  `stt_language`       VARCHAR(10)                                              NULL     COMMENT 'STT 언어',
  `stt_confidence`     FLOAT                                                    NULL     COMMENT 'STT 신뢰도',
  `summary_text`       LONGTEXT                                                 NULL     COMMENT '요약 텍스트',
  `summary_keywords`   TEXT                                                     NULL     COMMENT '요약 키워드',
  `process_status`     ENUM('UPLOADING','PROCESSING','COMPLETED','FAILED')      NOT NULL DEFAULT 'UPLOADING' COMMENT '처리 상태',
  `completed_at`       DATETIME                                                 NULL     COMMENT '완료일',
  `session_seq`        INT                                                      NULL     COMMENT '세션 시퀀스',
  `summary_isdel`      CHAR(1)                                                  NOT NULL DEFAULT 'N' COMMENT '삭제여부',
  `reg_date`           DATETIME                                                 NOT NULL DEFAULT CURRENT_TIMESTAMP() COMMENT '등록일',
  `upd_date`           DATETIME                                                 NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일',
  PRIMARY KEY (`summary_seq`),
  UNIQUE KEY `uk_lecture_summary_job_id` (`job_id`),
  INDEX `idx_lecture_summary_space` (`space_seq`),
  INDEX `idx_lecture_summary_user` (`tu_seq`),
  INDEX `idx_lecture_summary_status` (`process_status`),
  CONSTRAINT `fk_lecture_summary_space` FOREIGN KEY (`space_seq`) REFERENCES `tb_space` (`space_seq`) ON DELETE CASCADE,
  CONSTRAINT `fk_lecture_summary_user` FOREIGN KEY (`tu_seq`) REFERENCES `tb_users` (`tu_seq`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='강의요약';


-- ============================================================================
-- SEED DATA (운영 필수)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. tb_setting — 기본 설정
-- ----------------------------------------------------------------------------
INSERT INTO `tb_setting` (`ts_seq`, `ts_api_time`, `ts_player_time`, `ts_player_ver`, `ts_watcher_ver`, `reg_date`)
VALUES (1, '30', '1', '1.0.0', '1.0.0', NOW());

-- ----------------------------------------------------------------------------
-- 2. tb_users — admin 계정 (password: !konkuk@)
-- ----------------------------------------------------------------------------
INSERT INTO `tb_users` (`tu_seq`, `tu_id`, `tu_pw`, `tu_name`, `tu_phone`, `tu_email`, `tu_isdel`, `tu_step`, `tu_type`, `tu_approved_date`, `reg_date`)
VALUES (1, 'admin', '$2b$10$x55JtEt43CKG5t9rDt8zj.FXpwDrBrm1GFgnWPy7PXEonKM3xXjwi', '관리자', '010-0000-0000', 'kuwave@konkuk.ac.kr', 'N', 'OK', 'SUPER', NOW(), NOW());

-- ----------------------------------------------------------------------------
-- 3. tb_menu — GNB 7개 + LNB 메뉴
-- ----------------------------------------------------------------------------

-- GNB (Top-level navigation)
INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
(1, '컨트롤러', 'controller', NULL, 'GNB', NULL, 1),
(2, 'RFID', 'rfid', NULL, 'GNB', NULL, 2),
(3, '녹화기관리', 'recorder', NULL, 'GNB', NULL, 3),
-- (4, 'AI시스템', 'ai-system', NULL, 'GNB', NULL, 4),  -- 비활성화
(5, '디스플레이', 'display', NULL, 'GNB', NULL, 5),
(6, '회원관리', 'member', NULL, 'GNB', NULL, 6),
(7, '환경설정', 'settings', NULL, 'GNB', NULL, 7);

-- LNB: 컨트롤러 하위
INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
(11, '하드웨어 설정', 'controller-hardware', '/controller/hardware', 'LNB', 1, 1),
(12, '제어관리', 'controller-control', '/controller/control', 'LNB', 1, 2);

-- LNB: RFID 하위
INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
(21, '리더기 관리', 'rfid-reader', '/rfid/readers', 'LNB', 2, 1),
(22, '태그 관리', 'rfid-tag', '/rfid/tags', 'LNB', 2, 2),
(23, '로그', 'rfid-log', '/rfid/logs', 'LNB', 2, 3);

-- LNB: 녹화기관리 하위
INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
(31, '녹화기 등록', 'recorder-list', '/recorder/list', 'LNB', 3, 1),
(32, '녹화기 제어', 'recorder-control', '/recorder/control', 'LNB', 3, 2),
(33, '녹화 이력', 'recorder-history', '/recorder/history', 'LNB', 3, 3),
(34, '녹화파일 관리', 'recorder-files', '/recorder/files', 'LNB', 3, 4),
(35, 'FTP 설정', 'recorder-ftp', '/recorder/ftp', 'LNB', 3, 5);

-- LNB: AI시스템 하위 (비활성화)
-- INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
-- (41, '강의요약', 'ai-lecture-summary', '/ai-system/lecture-summary', 'LNB', 4, 1),
-- (42, '실시간 음성인식', 'ai-speech', '/ai-system/speech', 'LNB', 4, 2),
-- (43, '음성 명령', 'ai-voice-commands', '/ai-system/voice-commands', 'LNB', 4, 3),
-- (44, 'Worker 서버', 'ai-worker-servers', '/ai-system/worker-servers', 'LNB', 4, 4);

-- LNB: 디스플레이 하위
INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
(51, '플레이어', 'display-player', '/display/player', 'LNB', 5, 1),
(52, '리스트관리', 'display-list', '/display/list', 'LNB', 5, 2),
(53, '콘텐츠관리', 'display-content', '/display/content', 'LNB', 5, 3);

-- LNB: 회원관리 하위
INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
(61, '사용자 목록', 'member-list', '/members', 'LNB', 6, 1),
(62, '권한 관리', 'member-permissions', '/members/permissions', 'LNB', 6, 2),
(63, '활동 로그', 'member-activity', '/members/activity', 'LNB', 6, 3);

-- LNB: 환경설정 하위
INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
(71, '건물관리', 'settings-buildings', '/settings/buildings', 'LNB', 7, 1),
(72, '시스템 설정', 'settings-system', '/settings', 'LNB', 7, 2);

-- 추가 LNB 메뉴
INSERT INTO `tb_menu` (`menu_seq`, `menu_name`, `menu_code`, `menu_path`, `menu_type`, `parent_seq`, `menu_order`) VALUES
(73, '콘텐츠 승인', 'display-content-approval', '/display/content-approval', 'LNB', 5, 4),
(74, '소켓연동', 'controller-socket', '/controller/socket', 'LNB', 1, 3);

-- ----------------------------------------------------------------------------
-- 4. tb_menu_users — admin에게 모든 메뉴 권한
-- ----------------------------------------------------------------------------
-- admin(tu_seq=1)에게 전체 메뉴 권한
INSERT INTO `tb_menu_users` (`tu_seq`, `menu_seq`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7),
(1, 11), (1, 12),
(1, 21), (1, 22), (1, 23),
(1, 31), (1, 32), (1, 33), (1, 34), (1, 35),
(1, 41), (1, 42),
(1, 51), (1, 52), (1, 53),
(1, 61), (1, 62), (1, 63),
(1, 71), (1, 72),
(1, 73), (1, 74);

-- ----------------------------------------------------------------------------
-- 5. tb_building — 산학협동관
-- ----------------------------------------------------------------------------
INSERT INTO `tb_building` (`building_seq`, `building_name`, `building_code`, `building_location`, `building_floor_count`, `building_order`)
VALUES (1, '산학협동관', 'BLD-001', '서울시 광진구 능동로 120', 5, 1);

-- ----------------------------------------------------------------------------
-- 6. tb_user_building — admin에게 건물 권한
-- ----------------------------------------------------------------------------
INSERT INTO `tb_user_building` (`tub_seq`, `tu_seq`, `building_seq`)
VALUES (1, 1, 1);

-- ----------------------------------------------------------------------------
-- 7. tb_space — 산학협동관 호실
-- ----------------------------------------------------------------------------
INSERT INTO `tb_space` (`space_seq`, `building_seq`, `space_name`, `space_code`, `space_floor`, `space_type`, `space_capacity`, `space_order`) VALUES
(1, 1, '201호', 'SPC-001', '2', '강의실', 40, 1);

-- ----------------------------------------------------------------------------
-- 8. tb_device_preset — 장비 프리셋
-- ----------------------------------------------------------------------------
INSERT INTO `tb_device_preset` (`preset_seq`, `preset_name`, `protocol_type`, `comm_ip`, `comm_port`, `preset_description`, `preset_order`) VALUES
(1, '프로젝터', 'TCP', '117.16.139.145', 9090, '강의실용 프로젝터', 1),
(2, '전자칠판', 'TCP', '117.16.139.145', 9090, '전자칠판', 2),
(3, '녹화기', 'TCP', '117.16.139.145', 6060, '녹화기', 3),
(4, '스크린', 'TCP', '117.16.139.145', 9090, '스크린 프리셋', 4);

-- ----------------------------------------------------------------------------
-- 9. tb_preset_command — 프리셋 명령어
-- ----------------------------------------------------------------------------
INSERT INTO `tb_preset_command` (`command_seq`, `preset_seq`, `command_name`, `command_code`, `command_type`, `command_order`) VALUES
-- 프로젝터
(1, 1, '프로젝터-켜기', 'EF3031C2303230303130303031FFFFFCFF', 'POWER_ON', 0),
(2, 1, '프로젝터-끄기', 'EF3031C2303230303230303031FFFFFCFF', 'POWER_OFF', 1),
-- 전자칠판
(3, 2, '칠판켜기 ON', 'EF3031C2303130303130303031FFFFFCFF', 'POWER_ON', 0),
(4, 2, '칠판끄기 OFF', 'EF3031C2303130303230303031FFFFFCFF', 'POWER_OFF', 1),
-- 녹화기
(5, 3, '녹화시작', '3000000DCDA90000010000027A', 'POWER_ON', 0),
(6, 3, '녹화정지', '4000000DCDA90000010000027A', 'CUSTOM', 1),
(7, 3, '일시정지', '5000000DCDA90000010000027A', 'CUSTOM', 2),
-- 스크린
(8, 4, '스크린 DOWN', 'EF 30 31 C1 30 31 30 30 30 30 30 30 31 C1 30 32 30 30 31 30 30 30 31 FF FF FC FF', 'POWER_ON', 0),
(9, 4, '스크린 STOP', 'EF 30 31 C1 30 31 30 30 30 30 30 30 31 C1 30 32 30 30 30 30 30 30 31 FF FF FC FF', 'CUSTOM', 1),
(10, 4, '스크린 UP', 'EF 30 31 C1 30 32 30 30 30 30 30 30 31 C1 30 31 30 30 31 30 30 30 31 FF FF FC FF', 'POWER_OFF', 2);

-- ----------------------------------------------------------------------------
-- 10. tb_socket_command — NFC 소켓 명령어
-- ----------------------------------------------------------------------------
INSERT INTO `tb_socket_command` (`socket_cmd_seq`, `cmd_label`, `cmd_hex`, `cmd_category`, `cmd_description`, `cmd_order`) VALUES
(1, 'NFC 페이지 전환', 'EEB111001B03E6100100FFFCFFFF', 'NFC', 'TX — 컨트롤러를 NFC 페이지로 전환', 1),
(2, 'MAIN 페이지 전환', 'EEB111000103E6100100FFFCFFFF', 'NFC', 'TX — NFC 페이지에서 MAIN으로 전환', 2);

-- ----------------------------------------------------------------------------
-- 11. tb_recorder — 녹화기 (호실당 1대, space_seq와 매핑)
-- ----------------------------------------------------------------------------
INSERT INTO `tb_recorder` (`recorder_seq`, `space_seq`, `recorder_name`, `recorder_ip`, `recorder_port`, `recorder_protocol`, `recorder_model`, `recorder_status`) VALUES
(1, 1, 'BON 녹화기', '192.168.1.2', 6060, 'HTTP', 'BON BR-500', 'OFFLINE');

-- ----------------------------------------------------------------------------
-- 12. tb_ftp_config — FTP 설정 (글로벌 기본 1개)
-- ----------------------------------------------------------------------------
INSERT INTO `tb_ftp_config` (`ftp_config_seq`, `recorder_seq`, `ftp_name`, `ftp_host`, `ftp_port`, `ftp_username`, `ftp_password`, `ftp_path`, `ftp_protocol`, `ftp_passive_mode`, `is_default`) VALUES
(1, NULL, '기본 FTP', '117.16.145.227', 21, 'kuwave', 'kuwave', '/', 'FTP', 'Y', 'Y');

-- ----------------------------------------------------------------------------
-- 13. tb_nfc_reader — NFC 리더기 초기 데이터
-- ----------------------------------------------------------------------------
INSERT INTO `tb_nfc_reader` (`reader_seq`, `space_seq`, `reader_name`, `reader_code`, `reader_api_key`, `reader_status`) VALUES
(1, 1, 'ACR122U', 'RDR-001', 'rdr_3db60088-be2b-484d-8972-56ac3bbf4aca', 'ACTIVE');

-- ----------------------------------------------------------------------------
-- 14. tb_ai_worker_server — GPU 서버
-- ----------------------------------------------------------------------------
INSERT INTO `tb_ai_worker_server` (`worker_server_seq`, `server_name`, `server_url`, `api_key`, `callback_secret`, `server_status`, `gpu_info`, `max_concurrent_jobs`, `default_stt_model`, `default_llm_model`) VALUES
(1, '건국대 AI GPU 서버', 'http://203.252.151.52:9000', '4b9a528ac855348e01efee832f64f3d933b57d75f40aaa3b', 'ku-wave-callback-secret-2026', 'ONLINE', 'GPU Server', 1, 'large-v3', 'llama3');


SET FOREIGN_KEY_CHECKS = 1;

-- init_database.sql complete: 41 tables, seed data updated
