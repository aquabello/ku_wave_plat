-- =============================================
-- ku_ai_worker SQLite - 전체 스키마 생성
-- 작성일: 2026-02-23
-- 실행대상: ku_ai_worker 서버 내 SQLite
-- 실행방법: sqlite3 /app/data/ku_ai_worker.db < ku-ai-worker-sqlite.sql
-- =============================================


-- ======================
-- 1. ai_recordings (녹음 파일 메타데이터)
-- ======================

CREATE TABLE IF NOT EXISTS ai_recordings (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    upload_id         TEXT    NOT NULL UNIQUE,
    space_code        TEXT    NOT NULL,
    device_code       TEXT    NOT NULL,
    original_filename TEXT    NOT NULL,
    stored_filepath   TEXT,
    file_size         INTEGER DEFAULT 0 NOT NULL,
    duration_seconds  INTEGER,
    upload_status     TEXT    DEFAULT 'INIT' NOT NULL,  -- INIT / UPLOADING / COMPLETED / FAILED
    chunk_total       INTEGER DEFAULT 0,
    chunk_uploaded    INTEGER DEFAULT 0,
    recorded_at       TEXT,
    uploaded_at       TEXT,
    created_at        TEXT    DEFAULT (datetime('now')) NOT NULL,
    updated_at        TEXT    DEFAULT (datetime('now')) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rec_device ON ai_recordings (device_code);
CREATE INDEX IF NOT EXISTS idx_rec_status ON ai_recordings (upload_status);
CREATE INDEX IF NOT EXISTS idx_rec_date   ON ai_recordings (recorded_at);


-- ======================
-- 2. ai_jobs (AI 처리 작업 큐)
-- ======================

CREATE TABLE IF NOT EXISTS ai_jobs (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    recording_id      INTEGER NOT NULL REFERENCES ai_recordings(id) ON DELETE CASCADE,
    job_id            TEXT    NOT NULL UNIQUE,
    status            TEXT    DEFAULT 'PENDING' NOT NULL,
        -- PENDING / STT_PROCESSING / SUMMARIZING / COMPLETED / FAILED / CANCELLED
    priority          INTEGER DEFAULT 5 NOT NULL,       -- 1=최고, 10=최저
    worker_id         TEXT,
    retry_count       INTEGER DEFAULT 0 NOT NULL,
    max_retries       INTEGER DEFAULT 3 NOT NULL,
    stt_model         TEXT    DEFAULT 'large-v3',
    llm_model         TEXT    DEFAULT 'llama3',
    error_code        TEXT,
    error_message     TEXT,
    -- Callback (미니PC Push)
    callback_url      TEXT,                             -- http://{miniPC_ip}:9090/callback
    callback_status   TEXT    DEFAULT 'PENDING',        -- PENDING / SENT / FAILED
    callback_at       TEXT,
    --
    started_at        TEXT,
    completed_at      TEXT,
    created_at        TEXT    DEFAULT (datetime('now')) NOT NULL,
    updated_at        TEXT    DEFAULT (datetime('now')) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_job_recording ON ai_jobs (recording_id);
CREATE INDEX IF NOT EXISTS idx_job_status    ON ai_jobs (status);
CREATE INDEX IF NOT EXISTS idx_job_pending   ON ai_jobs (status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_job_callback  ON ai_jobs (callback_status);


-- ======================
-- 3. ai_results (AI 처리 결과)
-- ======================

CREATE TABLE IF NOT EXISTS ai_results (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id             INTEGER NOT NULL UNIQUE REFERENCES ai_jobs(id) ON DELETE CASCADE,
    stt_text           TEXT,
    stt_segments       TEXT,       -- JSON: [{"start":0.0,"end":5.2,"text":"..."},...]
    stt_language       TEXT,       -- ko, en 등
    stt_confidence     REAL,       -- 0~1
    stt_duration_ms    INTEGER,
    summary_text       TEXT,
    summary_keywords   TEXT,       -- JSON: ["키워드1","키워드2",...]
    summary_duration_ms INTEGER,
    delivery_status    TEXT    DEFAULT 'PENDING' NOT NULL,  -- PENDING / DELIVERED
    delivered_at       TEXT,
    created_at         TEXT    DEFAULT (datetime('now')) NOT NULL,
    updated_at         TEXT    DEFAULT (datetime('now')) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_result_delivery ON ai_results (delivery_status);


-- ======================
-- 4. 실행 확인
-- ======================

SELECT '=== ku_ai_worker SQLite 스키마 생성 완료 ===' AS result;

SELECT name, type FROM sqlite_master
WHERE type = 'table' AND name LIKE 'ai_%'
ORDER BY name;
