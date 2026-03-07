-- =============================================
-- ku_wave_plat MariaDB - AI 시스템 전체 스키마 생성
-- 작성일: 2026-02-23
-- 실행대상: 각 호실 ku_wave_plat 로컬 MariaDB (22대 동일 실행)
-- 실행방법: mysql -h localhost -u DB_USER -p ku_wave_plat < ai-system-mariadb.sql
-- 관련문서: docs/ai-system-architecture.md
-- =============================================

-- ※ 사전 확인:
--   1. tb_space, tb_space_device, tb_preset_command, tb_users 테이블 존재 필수
--   2. tb_control_log 테이블 존재 필수
--   3. IF NOT EXISTS 사용으로 안전하게 재실행 가능

-- 사전 확인 쿼리 (실행 전 수동 확인용)
-- SELECT VERSION();
-- USE ku_wave_plat;
-- SHOW TABLES LIKE 'tb_ai_%';
-- SHOW TABLES LIKE 'tb_space%';
-- SHOW TABLES LIKE 'tb_control_log';


-- ======================
-- 0. 기존 테이블 변경
-- ======================

-- tb_control_log.trigger_type 컬럼 추가 (음성명령 트리거 지원)
-- ※ 이미 존재하면 무시됨 (프로시저로 안전 처리)
DROP PROCEDURE IF EXISTS add_trigger_type_column;
DELIMITER //
CREATE PROCEDURE add_trigger_type_column()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'tb_control_log'
          AND COLUMN_NAME = 'trigger_type'
    ) THEN
        ALTER TABLE tb_control_log
            ADD COLUMN trigger_type ENUM('MANUAL','NFC','SCHEDULE','VOICE')
                DEFAULT 'MANUAL' NOT NULL
                COMMENT '트리거 유형 (MANUAL=콘솔, NFC=태깅, SCHEDULE=예약, VOICE=음성명령)'
                AFTER tu_seq;
    END IF;
END //
DELIMITER ;
CALL add_trigger_type_column();
DROP PROCEDURE IF EXISTS add_trigger_type_column;


-- ======================
-- 1. tb_ai_voice_command (음성 명령어 매핑)
-- ======================
-- 용도: 음성 키워드 → 장비 제어 명령 매핑
-- 호출: Console(등록/수정), miniPC(조회/캐싱)

CREATE TABLE IF NOT EXISTS tb_ai_voice_command
(
    voice_command_seq INT AUTO_INCREMENT COMMENT '음성명령 시퀀스' PRIMARY KEY,
    space_seq         INT                                  NOT NULL COMMENT '공간 시퀀스',
    keyword           VARCHAR(100)                         NOT NULL COMMENT '음성 키워드 (예: 스크린 올려)',
    keyword_aliases   TEXT                                 NULL     COMMENT '별칭 JSON ["화면 올려","스크린 업"]',
    space_device_seq  INT                                  NOT NULL COMMENT '제어 대상 장비 시퀀스',
    command_seq       INT                                  NOT NULL COMMENT '실행할 명령어 시퀀스',
    min_confidence    FLOAT        DEFAULT 0.85            NOT NULL COMMENT '즉시실행 임계값 (0~1)',
    command_priority  INT          DEFAULT 0               NULL     COMMENT '우선순위 (동일 키워드 시)',
    command_isdel     CHAR         DEFAULT 'N'             NOT NULL COMMENT '삭제 여부',
    reg_date          DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
    upd_date          DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL
                                   ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',
    CONSTRAINT fk_vc_space
        FOREIGN KEY (space_seq) REFERENCES tb_space (space_seq) ON DELETE CASCADE,
    CONSTRAINT fk_vc_space_device
        FOREIGN KEY (space_device_seq) REFERENCES tb_space_device (space_device_seq) ON DELETE CASCADE,
    CONSTRAINT fk_vc_command
        FOREIGN KEY (command_seq) REFERENCES tb_preset_command (command_seq) ON DELETE CASCADE
)
    COMMENT '음성 명령어 매핑' CHARSET = utf8mb4;

CREATE INDEX idx_vc_space   ON tb_ai_voice_command (space_seq);
CREATE INDEX idx_vc_keyword ON tb_ai_voice_command (keyword);
CREATE INDEX idx_vc_device  ON tb_ai_voice_command (space_device_seq);
CREATE INDEX idx_vc_isdel   ON tb_ai_voice_command (command_isdel);


-- ======================
-- 2. tb_ai_speech_session (음성인식 세션)
-- ======================
-- 용도: 강의 시작~종료 단위 STT 세션 관리
-- 호출: miniPC(생성/종료)

CREATE TABLE IF NOT EXISTS tb_ai_speech_session
(
    session_seq        INT AUTO_INCREMENT COMMENT '세션 시퀀스' PRIMARY KEY,
    space_seq          INT                                  NOT NULL COMMENT '공간 시퀀스',
    tu_seq             INT                                  NULL     COMMENT '강의자 시퀀스',
    session_status     ENUM('ACTIVE','PAUSED','ENDED')
                                    DEFAULT 'ACTIVE'       NOT NULL COMMENT '세션 상태',
    stt_engine         VARCHAR(50)  DEFAULT 'faster-whisper' NULL    COMMENT 'STT 엔진명',
    stt_model          VARCHAR(50)  DEFAULT 'small'          NULL    COMMENT 'STT 모델명',
    started_at         DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '시작 시각',
    ended_at           DATETIME                             NULL     COMMENT '종료 시각',
    total_duration_sec INT                                  NULL     COMMENT '총 세션 시간 (초)',
    total_segments     INT          DEFAULT 0               NULL     COMMENT '총 인식 구간 수',
    total_commands     INT          DEFAULT 0               NULL     COMMENT '총 명령 실행 수',
    recording_filename VARCHAR(255)                         NULL     COMMENT '녹음 파일명',
    summary_seq        INT                                  NULL     COMMENT '연결된 강의요약 시퀀스',
    session_isdel      CHAR         DEFAULT 'N'             NOT NULL COMMENT '삭제 여부',
    reg_date           DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
    upd_date           DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL
                                    ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',
    CONSTRAINT fk_ss_space
        FOREIGN KEY (space_seq) REFERENCES tb_space (space_seq) ON DELETE CASCADE,
    CONSTRAINT fk_ss_user
        FOREIGN KEY (tu_seq) REFERENCES tb_users (tu_seq) ON DELETE SET NULL
)
    COMMENT '음성인식 세션' CHARSET = utf8mb4;

CREATE INDEX idx_ss_space   ON tb_ai_speech_session (space_seq);
CREATE INDEX idx_ss_user    ON tb_ai_speech_session (tu_seq);
CREATE INDEX idx_ss_status  ON tb_ai_speech_session (session_status);
CREATE INDEX idx_ss_started ON tb_ai_speech_session (started_at);
CREATE INDEX idx_ss_isdel   ON tb_ai_speech_session (session_isdel);


-- ======================
-- 3. tb_ai_speech_log (음성인식 로그)
-- ======================
-- 용도: 실시간 STT 텍스트 구간별 저장
-- 호출: miniPC(저장)

CREATE TABLE IF NOT EXISTS tb_ai_speech_log
(
    speech_log_seq    INT AUTO_INCREMENT COMMENT '음성로그 시퀀스' PRIMARY KEY,
    session_seq       INT                                  NOT NULL COMMENT '세션 시퀀스',
    segment_text      TEXT                                 NOT NULL COMMENT '인식된 텍스트',
    segment_start_sec FLOAT                                NULL     COMMENT '구간 시작 (초)',
    segment_end_sec   FLOAT                                NULL     COMMENT '구간 종료 (초)',
    confidence        FLOAT                                NULL     COMMENT 'STT 신뢰도 (0~1)',
    is_command        CHAR         DEFAULT 'N'             NOT NULL COMMENT '명령어 인식 여부',
    created_at        DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '생성일시',
    CONSTRAINT fk_sl_session
        FOREIGN KEY (session_seq) REFERENCES tb_ai_speech_session (session_seq) ON DELETE CASCADE
)
    COMMENT '음성인식 로그' CHARSET = utf8mb4;

CREATE INDEX idx_sl_session ON tb_ai_speech_log (session_seq);
CREATE INDEX idx_sl_command ON tb_ai_speech_log (is_command);
CREATE INDEX idx_sl_created ON tb_ai_speech_log (created_at);


-- ======================
-- 4. tb_ai_command_log (음성 명령 실행 로그)
-- ======================
-- 용도: Voice Detect → 장비 제어 실행 결과 저장
-- 호출: ku_wave_plat API (POST /commands/execute에서 자동 저장)

CREATE TABLE IF NOT EXISTS tb_ai_command_log
(
    command_log_seq   INT AUTO_INCREMENT COMMENT '명령로그 시퀀스' PRIMARY KEY,
    session_seq       INT                                  NOT NULL COMMENT '세션 시퀀스',
    voice_command_seq INT                                  NULL     COMMENT '매칭된 음성명령 시퀀스',
    recognized_text   VARCHAR(200)                         NOT NULL COMMENT '인식된 원문',
    matched_keyword   VARCHAR(100)                         NULL     COMMENT '매칭된 키워드',
    match_score       FLOAT                                NULL     COMMENT '매칭 점수 (0~1)',
    verify_source     ENUM('LOCAL_VOSK','REMOTE_WHISPER')  NULL     COMMENT '확정 소스',
    execution_status  ENUM('MATCHED','EXECUTED','FAILED','NO_MATCH')
                                                           NOT NULL COMMENT '실행 상태',
    execution_result  TEXT                                 NULL     COMMENT '실행 결과 JSON',
    created_at        DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '실행 시각',
    CONSTRAINT fk_cl_session
        FOREIGN KEY (session_seq) REFERENCES tb_ai_speech_session (session_seq) ON DELETE CASCADE,
    CONSTRAINT fk_cl_voice_command
        FOREIGN KEY (voice_command_seq) REFERENCES tb_ai_voice_command (voice_command_seq) ON DELETE SET NULL
)
    COMMENT '음성 명령 실행 로그' CHARSET = utf8mb4;

CREATE INDEX idx_cl_session       ON tb_ai_command_log (session_seq);
CREATE INDEX idx_cl_voice_command ON tb_ai_command_log (voice_command_seq);
CREATE INDEX idx_cl_status        ON tb_ai_command_log (execution_status);
CREATE INDEX idx_cl_created       ON tb_ai_command_log (created_at);


-- ======================
-- 5. tb_ai_lecture_summary (강의요약 결과)
-- ======================
-- 용도: 강의 녹음 → AI STT + 요약 결과 저장
-- 호출: miniPC(레코드 생성), Callback(결과 저장)
-- 프로세스: miniPC 생성(UPLOADING) → 상태변경(PROCESSING) → Callback(COMPLETED)

CREATE TABLE IF NOT EXISTS tb_ai_lecture_summary
(
    summary_seq        INT AUTO_INCREMENT COMMENT '시퀀스' PRIMARY KEY,
    space_seq          INT                                  NOT NULL COMMENT '공간 시퀀스',
    tu_seq             INT                                  NULL     COMMENT '강의자 시퀀스',
    device_code        VARCHAR(50)                          NOT NULL COMMENT '미니PC 식별자',
    job_id             VARCHAR(36)                          NOT NULL COMMENT 'ku_ai_worker Job UUID',
    recording_title    VARCHAR(200)                         NULL     COMMENT '강의 제목',
    recording_filename VARCHAR(255)                         NOT NULL COMMENT '원본 파일명',
    duration_seconds   INT                                  NULL     COMMENT '녹음 길이 (초)',
    recorded_at        DATETIME                             NULL     COMMENT '녹음 시각',
    stt_text           LONGTEXT                             NULL     COMMENT 'STT 전체 텍스트',
    stt_language       VARCHAR(10)                          NULL     COMMENT '감지 언어',
    stt_confidence     FLOAT                                NULL     COMMENT 'STT 신뢰도',
    summary_text       LONGTEXT                             NULL     COMMENT '요약 텍스트',
    summary_keywords   TEXT                                 NULL     COMMENT '키워드 JSON',
    process_status     ENUM('UPLOADING','PROCESSING','COMPLETED','FAILED')
                                    DEFAULT 'UPLOADING'    NOT NULL COMMENT '처리 상태',
    completed_at       DATETIME                             NULL     COMMENT '처리 완료 시각',
    session_seq        INT                                  NULL     COMMENT '연결된 STT 세션 시퀀스',
    summary_isdel      CHAR         DEFAULT 'N'             NOT NULL COMMENT '삭제 여부',
    reg_date           DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
    upd_date           DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL
                                    ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',
    CONSTRAINT uk_job_id UNIQUE (job_id),
    CONSTRAINT fk_summary_space
        FOREIGN KEY (space_seq) REFERENCES tb_space (space_seq) ON DELETE CASCADE,
    CONSTRAINT fk_summary_user
        FOREIGN KEY (tu_seq) REFERENCES tb_users (tu_seq) ON DELETE SET NULL
)
    COMMENT '강의요약 결과' CHARSET = utf8mb4;

CREATE INDEX idx_summary_space  ON tb_ai_lecture_summary (space_seq);
CREATE INDEX idx_summary_user   ON tb_ai_lecture_summary (tu_seq);
CREATE INDEX idx_summary_device ON tb_ai_lecture_summary (device_code);
CREATE INDEX idx_summary_status ON tb_ai_lecture_summary (process_status);
CREATE INDEX idx_summary_date   ON tb_ai_lecture_summary (recorded_at);
CREATE INDEX idx_summary_isdel  ON tb_ai_lecture_summary (summary_isdel);


-- ======================
-- 6. tb_ai_worker_server (AI Worker 서버 등록)
-- ======================
-- 용도: 중앙 GPU 서버(ku_ai_worker) 정보 관리
-- 호출: Console(등록/관리), Callback 검증 시 callback_secret 참조
-- 22대 모두 동일한 ku_ai_worker 서버 정보 등록

CREATE TABLE IF NOT EXISTS tb_ai_worker_server
(
    worker_server_seq   INT AUTO_INCREMENT COMMENT 'Worker 서버 시퀀스' PRIMARY KEY,
    server_name         VARCHAR(100)                            NOT NULL COMMENT '서버명 (예: GPU서버-1호)',
    server_url          VARCHAR(255)                            NOT NULL COMMENT '서버 URL (http://10.0.0.200:8080)',
    api_key             VARCHAR(255)                            NOT NULL COMMENT 'API 인증키 (Worker 발급)',
    callback_secret     VARCHAR(255)                            NULL     COMMENT 'Webhook 검증용 Secret (HMAC-SHA256)',
    server_status       ENUM('ONLINE','OFFLINE','ERROR','MAINTENANCE')
                                         DEFAULT 'OFFLINE'     NOT NULL COMMENT '서버 상태',
    last_health_check   DATETIME                                NULL     COMMENT '마지막 헬스체크 시각',
    gpu_info            VARCHAR(200)                            NULL     COMMENT 'GPU 정보 (RTX 4070 12GB)',
    max_concurrent_jobs INT              DEFAULT 1              NOT NULL COMMENT '동시 처리 가능 Job 수',
    default_stt_model   VARCHAR(50)      DEFAULT 'large-v3'     NULL     COMMENT '기본 STT 모델',
    default_llm_model   VARCHAR(50)      DEFAULT 'llama3'       NULL     COMMENT '기본 요약 LLM 모델',
    server_isdel        CHAR             DEFAULT 'N'            NOT NULL COMMENT '삭제 여부',
    reg_date            DATETIME         DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
    upd_date            DATETIME         DEFAULT CURRENT_TIMESTAMP() NOT NULL
                                         ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',
    CONSTRAINT uk_server_url UNIQUE (server_url)
)
    COMMENT 'AI Worker 서버' CHARSET = utf8mb4;

CREATE INDEX idx_ws_status ON tb_ai_worker_server (server_status);
CREATE INDEX idx_ws_isdel  ON tb_ai_worker_server (server_isdel);


-- ======================
-- 7. 메뉴 추가
-- ======================

-- AI시스템 > 실시간 음성인식 LNB (중복 방지)
INSERT IGNORE INTO tb_menu (menu_seq, menu_name, menu_code, menu_path, menu_type, parent_seq, menu_order)
VALUES (42, '실시간 음성인식', 'ai-speech', '/ai-system/speech', 'LNB', 4, 2);


-- ======================
-- 8. 실행 확인
-- ======================

SELECT '=== AI 시스템 스키마 생성 완료 ===' AS result;

SELECT TABLE_NAME, TABLE_COMMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME LIKE 'tb_ai_%'
ORDER BY TABLE_NAME;

SELECT
    (SELECT COUNT(*) FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE 'tb_ai_%') AS ai_table_count,
    '6개 테이블 확인' AS expected;

-- 개별 테이블 확인
-- DESCRIBE tb_ai_voice_command;
-- DESCRIBE tb_ai_speech_session;
-- DESCRIBE tb_ai_speech_log;
-- DESCRIBE tb_ai_command_log;
-- DESCRIBE tb_ai_lecture_summary;
-- DESCRIBE tb_ai_worker_server;
-- SELECT * FROM tb_menu WHERE parent_seq = 4;
