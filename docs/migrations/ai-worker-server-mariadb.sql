-- =============================================
-- ku_wave_plat MariaDB - AI Worker 서버 테이블 생성
-- 작성일: 2026-02-23
-- 실행대상: ku_wave_plat MariaDB (외부 개발 DB)
-- 실행방법: mysql -h DB_HOST -u DB_USER -p ku_wave_plat < ai-worker-server-mariadb.sql
-- =============================================

-- 사전 확인
-- SELECT VERSION();
-- USE ku_wave_plat;
-- SHOW TABLES LIKE 'tb_ai_%';


-- ======================
-- 1. tb_ai_worker_server (AI Worker 서버 등록)
-- ======================

CREATE TABLE IF NOT EXISTS tb_ai_worker_server
(
    worker_server_seq   INT AUTO_INCREMENT COMMENT 'Worker 서버 시퀀스' PRIMARY KEY,
    server_name         VARCHAR(100)                            NOT NULL COMMENT '서버명 (예: GPU서버-1호)',
    server_url          VARCHAR(255)                            NOT NULL COMMENT '서버 URL (http://10.0.1.50:8080)',
    api_key             VARCHAR(255)                            NOT NULL COMMENT 'API 인증키 (Worker 발급)',
    callback_secret     VARCHAR(255)                            NULL     COMMENT 'Webhook 검증용 Secret',
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
-- 2. 실행 확인
-- ======================

SELECT '=== tb_ai_worker_server 생성 완료 ===' AS result;
DESCRIBE tb_ai_worker_server;
SELECT COUNT(*) AS row_count FROM tb_ai_worker_server;
