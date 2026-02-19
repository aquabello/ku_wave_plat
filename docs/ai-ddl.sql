-- =============================================
-- AI 시스템 DDL
-- 실시간 음성인식 + 강의요약
-- 작성일: 2026-02-19
-- 관련문서: docs/ai-realtime-speech-design.md
-- =============================================

-- ※ 실행 전 확인사항:
--   1. tb_space, tb_space_device, tb_preset_command, tb_users 테이블이 존재해야 함
--   2. tb_control_log 테이블이 존재해야 함
--   3. 이 스크립트는 idempotent 하지 않음 (중복 실행 금지)


-- ======================
-- 1. 기존 테이블 변경
-- ======================

-- tb_control_log.trigger_type 컬럼 추가 (실제 DB에 누락되어 있었음 → ADD COLUMN)
-- ※ 이미 컬럼이 존재하는 환경에서는 MODIFY COLUMN으로 변경
ALTER TABLE tb_control_log
  ADD COLUMN trigger_type ENUM('MANUAL','NFC','SCHEDULE','VOICE')
  DEFAULT 'MANUAL' NOT NULL
  COMMENT '트리거 유형 (MANUAL=콘솔, NFC=태깅, SCHEDULE=예약, VOICE=음성명령)'
  AFTER tu_seq;


-- ======================
-- 2. 음성 명령어 매핑
-- ======================

CREATE TABLE tb_ai_voice_command (
    voice_command_seq   INT AUTO_INCREMENT COMMENT '음성명령 시퀀스' PRIMARY KEY,
    space_seq           INT                                  NOT NULL COMMENT '공간 시퀀스',
    keyword             VARCHAR(100)                         NOT NULL COMMENT '음성 키워드 (예: 녹화정지)',
    keyword_aliases     TEXT                                 NULL     COMMENT '별칭 JSON ["녹화 정지","레코딩 스탑"]',
    space_device_seq    INT                                  NOT NULL COMMENT '제어 대상 장비 시퀀스',
    command_seq         INT                                  NOT NULL COMMENT '실행할 명령어 시퀀스',
    min_confidence      FLOAT        DEFAULT 0.85            NOT NULL COMMENT '즉시실행 임계값 (0~1)',
    command_priority    INT          DEFAULT 0               NULL     COMMENT '우선순위 (동일 키워드 시)',
    command_isdel       CHAR         DEFAULT 'N'             NOT NULL COMMENT '삭제 여부',
    reg_date            DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
    upd_date            DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL
                                     ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',

    CONSTRAINT fk_vc_space
        FOREIGN KEY (space_seq) REFERENCES tb_space (space_seq) ON DELETE CASCADE,
    CONSTRAINT fk_vc_space_device
        FOREIGN KEY (space_device_seq) REFERENCES tb_space_device (space_device_seq) ON DELETE CASCADE,
    CONSTRAINT fk_vc_command
        FOREIGN KEY (command_seq) REFERENCES tb_preset_command (command_seq) ON DELETE CASCADE
) COMMENT '음성 명령어 매핑' CHARSET = utf8mb4;

CREATE INDEX idx_vc_space    ON tb_ai_voice_command (space_seq);
CREATE INDEX idx_vc_keyword  ON tb_ai_voice_command (keyword);
CREATE INDEX idx_vc_device   ON tb_ai_voice_command (space_device_seq);
CREATE INDEX idx_vc_isdel    ON tb_ai_voice_command (command_isdel);


-- ======================
-- 3. 음성인식 세션
-- ======================

CREATE TABLE tb_ai_speech_session (
    session_seq         INT AUTO_INCREMENT COMMENT '세션 시퀀스' PRIMARY KEY,
    space_seq           INT                                  NOT NULL COMMENT '공간 시퀀스',
    tu_seq              INT                                  NULL     COMMENT '강의자 시퀀스',
    session_status      ENUM('ACTIVE','PAUSED','ENDED')
                                     DEFAULT 'ACTIVE'       NOT NULL COMMENT '세션 상태',
    stt_engine          VARCHAR(50)  DEFAULT 'faster-whisper' NULL    COMMENT 'STT 엔진명',
    stt_model           VARCHAR(50)  DEFAULT 'small'          NULL    COMMENT 'STT 모델명',
    started_at          DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '시작 시각',
    ended_at            DATETIME                             NULL     COMMENT '종료 시각',
    total_duration_sec  INT                                  NULL     COMMENT '총 세션 시간 (초)',
    total_segments      INT          DEFAULT 0               NULL     COMMENT '총 인식 구간 수',
    total_commands      INT          DEFAULT 0               NULL     COMMENT '총 명령 실행 수',
    recording_filename  VARCHAR(255)                         NULL     COMMENT '녹음 파일명 (녹음 시)',
    summary_seq         INT                                  NULL     COMMENT '연결된 강의요약 시퀀스',
    session_isdel       CHAR         DEFAULT 'N'             NOT NULL COMMENT '삭제 여부',
    reg_date            DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
    upd_date            DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL
                                     ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',

    CONSTRAINT fk_ss_space
        FOREIGN KEY (space_seq) REFERENCES tb_space (space_seq) ON DELETE CASCADE,
    CONSTRAINT fk_ss_user
        FOREIGN KEY (tu_seq) REFERENCES tb_users (tu_seq) ON DELETE SET NULL
) COMMENT '음성인식 세션' CHARSET = utf8mb4;

CREATE INDEX idx_ss_space    ON tb_ai_speech_session (space_seq);
CREATE INDEX idx_ss_user     ON tb_ai_speech_session (tu_seq);
CREATE INDEX idx_ss_status   ON tb_ai_speech_session (session_status);
CREATE INDEX idx_ss_started  ON tb_ai_speech_session (started_at);
CREATE INDEX idx_ss_isdel    ON tb_ai_speech_session (session_isdel);


-- ======================
-- 4. 음성인식 로그
-- ======================

CREATE TABLE tb_ai_speech_log (
    speech_log_seq      INT AUTO_INCREMENT COMMENT '음성로그 시퀀스' PRIMARY KEY,
    session_seq         INT                                  NOT NULL COMMENT '세션 시퀀스',
    segment_text        TEXT                                 NOT NULL COMMENT '인식된 텍스트',
    segment_start_sec   FLOAT                                NULL     COMMENT '구간 시작 (초)',
    segment_end_sec     FLOAT                                NULL     COMMENT '구간 종료 (초)',
    confidence          FLOAT                                NULL     COMMENT 'STT 신뢰도 (0~1)',
    is_command          CHAR         DEFAULT 'N'             NOT NULL COMMENT '명령어 인식 여부',
    created_at          DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '생성일시',

    CONSTRAINT fk_sl_session
        FOREIGN KEY (session_seq) REFERENCES tb_ai_speech_session (session_seq) ON DELETE CASCADE
) COMMENT '음성인식 로그' CHARSET = utf8mb4;

CREATE INDEX idx_sl_session  ON tb_ai_speech_log (session_seq);
CREATE INDEX idx_sl_command  ON tb_ai_speech_log (is_command);
CREATE INDEX idx_sl_created  ON tb_ai_speech_log (created_at);


-- ======================
-- 5. 음성 명령 실행 로그
-- ======================

CREATE TABLE tb_ai_command_log (
    command_log_seq     INT AUTO_INCREMENT COMMENT '명령로그 시퀀스' PRIMARY KEY,
    session_seq         INT                                  NOT NULL COMMENT '세션 시퀀스',
    voice_command_seq   INT                                  NULL     COMMENT '매칭된 음성명령 시퀀스',
    recognized_text     VARCHAR(200)                         NOT NULL COMMENT '인식된 원문',
    matched_keyword     VARCHAR(100)                         NULL     COMMENT '매칭된 키워드',
    match_score         FLOAT                                NULL     COMMENT '매칭 점수 (0~1)',
    verify_source       ENUM('LOCAL_VOSK','REMOTE_WHISPER')  NULL     COMMENT '확정 소스',
    execution_status    ENUM('MATCHED','EXECUTED','FAILED','NO_MATCH')
                                                             NOT NULL COMMENT '실행 상태',
    execution_result    TEXT                                 NULL     COMMENT '실행 결과 JSON',
    created_at          DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '실행 시각',

    CONSTRAINT fk_cl_session
        FOREIGN KEY (session_seq) REFERENCES tb_ai_speech_session (session_seq) ON DELETE CASCADE,
    CONSTRAINT fk_cl_voice_command
        FOREIGN KEY (voice_command_seq) REFERENCES tb_ai_voice_command (voice_command_seq) ON DELETE SET NULL
) COMMENT '음성 명령 실행 로그' CHARSET = utf8mb4;

CREATE INDEX idx_cl_session       ON tb_ai_command_log (session_seq);
CREATE INDEX idx_cl_voice_command ON tb_ai_command_log (voice_command_seq);
CREATE INDEX idx_cl_status        ON tb_ai_command_log (execution_status);
CREATE INDEX idx_cl_created       ON tb_ai_command_log (created_at);


-- ======================
-- 6. 강의요약 결과
-- ======================

CREATE TABLE tb_ai_lecture_summary (
    summary_seq         INT AUTO_INCREMENT COMMENT '시퀀스' PRIMARY KEY,
    space_seq           INT                                  NOT NULL COMMENT '공간 시퀀스',
    tu_seq              INT                                  NULL     COMMENT '강의자 시퀀스',
    device_code         VARCHAR(50)                          NOT NULL COMMENT '미니PC 식별자',
    job_id              VARCHAR(36)                          NOT NULL COMMENT 'ku_ai_worker Job UUID',
    recording_title     VARCHAR(200)                         NULL     COMMENT '강의 제목',
    recording_filename  VARCHAR(255)                         NOT NULL COMMENT '원본 파일명',
    duration_seconds    INT                                  NULL     COMMENT '녹음 길이 (초)',
    recorded_at         DATETIME                             NULL     COMMENT '녹음 시각',
    stt_text            LONGTEXT                             NULL     COMMENT 'STT 전체 텍스트',
    stt_language        VARCHAR(10)                          NULL     COMMENT '감지 언어',
    stt_confidence      FLOAT                                NULL     COMMENT 'STT 신뢰도',
    summary_text        LONGTEXT                             NULL     COMMENT '요약 텍스트',
    summary_keywords    TEXT                                 NULL     COMMENT '키워드 JSON',
    process_status      ENUM('UPLOADING','PROCESSING','COMPLETED','FAILED')
                                     DEFAULT 'UPLOADING'    NOT NULL COMMENT '처리 상태',
    completed_at        DATETIME                             NULL     COMMENT '처리 완료 시각',
    session_seq         INT                                  NULL     COMMENT '연결된 STT 세션 시퀀스',
    summary_isdel       CHAR         DEFAULT 'N'             NOT NULL COMMENT '삭제 여부',
    reg_date            DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL COMMENT '등록일시',
    upd_date            DATETIME     DEFAULT CURRENT_TIMESTAMP() NOT NULL
                                     ON UPDATE CURRENT_TIMESTAMP() COMMENT '수정일시',

    CONSTRAINT uk_job_id UNIQUE (job_id),
    CONSTRAINT fk_summary_space
        FOREIGN KEY (space_seq) REFERENCES tb_space (space_seq) ON DELETE CASCADE,
    CONSTRAINT fk_summary_user
        FOREIGN KEY (tu_seq) REFERENCES tb_users (tu_seq) ON DELETE SET NULL
) COMMENT '강의요약 결과' CHARSET = utf8mb4;

CREATE INDEX idx_summary_space    ON tb_ai_lecture_summary (space_seq);
CREATE INDEX idx_summary_user     ON tb_ai_lecture_summary (tu_seq);
CREATE INDEX idx_summary_device   ON tb_ai_lecture_summary (device_code);
CREATE INDEX idx_summary_status   ON tb_ai_lecture_summary (process_status);
CREATE INDEX idx_summary_date     ON tb_ai_lecture_summary (recorded_at);
CREATE INDEX idx_summary_isdel    ON tb_ai_lecture_summary (summary_isdel);


-- ======================
-- 7. 메뉴 추가
-- ======================

-- AI시스템 > 실시간 음성인식 LNB 추가
INSERT INTO tb_menu (menu_seq, menu_name, menu_code, menu_path, menu_type, parent_seq, menu_order)
VALUES (42, '실시간 음성인식', 'ai-speech', '/ai-system/speech', 'LNB', 4, 2);


-- ======================
-- 완료 확인
-- ======================
-- 실행 후 아래 쿼리로 확인:
--   SHOW TABLES LIKE 'tb_ai_%';
--   DESCRIBE tb_ai_voice_command;
--   DESCRIBE tb_ai_speech_session;
--   DESCRIBE tb_ai_speech_log;
--   DESCRIBE tb_ai_command_log;
--   DESCRIBE tb_ai_lecture_summary;
--   SHOW COLUMNS FROM tb_control_log LIKE 'trigger_type';
--   SELECT * FROM tb_menu WHERE parent_seq = 4;
