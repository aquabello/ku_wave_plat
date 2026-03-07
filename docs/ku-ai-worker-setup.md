# ku_ai_worker - 프로젝트 설정 가이드

> 서버 발급 후 바로 적용 가능한 설정 스크립트 포함
> 관련문서: `docs/ai-system-architecture.md`

---

## 1. 프로젝트 구조

```
ku_ai_worker/
├── api/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 엔트리포인트
│   ├── config.py               # 환경설정 로딩
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── upload.py           # 청크 업로드 API
│   │   ├── jobs.py             # Job 상태/결과 조회 API
│   │   └── health.py           # 서버 헬스체크 API
│   ├── models/
│   │   ├── __init__.py
│   │   ├── recording.py        # ai_recordings 모델
│   │   ├── job.py              # ai_jobs 모델
│   │   └── result.py           # ai_results 모델
│   └── schemas/
│       ├── __init__.py
│       ├── upload.py           # 업로드 요청/응답 스키마
│       ├── job.py              # Job 요청/응답 스키마
│       └── health.py           # 헬스체크 응답 스키마
├── worker/
│   ├── __init__.py
│   ├── consumer.py             # Job Queue Consumer (메인 루프)
│   ├── stt.py                  # Whisper STT 처리
│   ├── summarizer.py           # Ollama 요약 처리
│   ├── callback.py             # Callback Dispatcher (미니PC Push)
│   └── file_manager.py         # 청크 병합, 파일 정리
├── db/
│   ├── __init__.py
│   ├── database.py             # SQLite 연결 관리
│   ├── init.sql                # DDL 스크립트 (아래 포함)
│   └── migrations/             # 마이그레이션 스크립트
├── scripts/
│   ├── setup.sh                # 원클릭 설치 스크립트
│   ├── start.sh                # 서비스 시작
│   └── cleanup.sh              # 오래된 파일 정리 크론
├── tests/
│   ├── test_upload.py
│   ├── test_stt.py
│   └── test_callback.py
├── config.example.yaml         # 설정 템플릿
├── requirements.txt            # Python 의존성
├── Dockerfile                  # Docker 이미지
├── docker-compose.yml          # Docker Compose
├── .env.example                # 환경변수 템플릿
└── README.md
```

---

## 2. SQLite DDL (db/init.sql)

서버 설정 후 아래 스크립트 실행으로 DB 즉시 생성.

```sql
-- =============================================
-- ku_ai_worker SQLite DDL
-- 작성일: 2026-02-23
-- =============================================

-- 녹음 파일 메타데이터
CREATE TABLE IF NOT EXISTS ai_recordings (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    upload_id         TEXT    NOT NULL UNIQUE,
    space_code        TEXT    NOT NULL,
    device_code       TEXT    NOT NULL,
    original_filename TEXT    NOT NULL,
    stored_filepath   TEXT,
    file_size         INTEGER DEFAULT 0 NOT NULL,
    duration_seconds  INTEGER,
    upload_status     TEXT    DEFAULT 'INIT' NOT NULL,
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


-- AI 처리 작업 큐
CREATE TABLE IF NOT EXISTS ai_jobs (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    recording_id      INTEGER NOT NULL REFERENCES ai_recordings(id) ON DELETE CASCADE,
    job_id            TEXT    NOT NULL UNIQUE,
    status            TEXT    DEFAULT 'PENDING' NOT NULL,
    priority          INTEGER DEFAULT 5 NOT NULL,
    worker_id         TEXT,
    retry_count       INTEGER DEFAULT 0 NOT NULL,
    max_retries       INTEGER DEFAULT 3 NOT NULL,
    stt_model         TEXT    DEFAULT 'large-v3',
    llm_model         TEXT    DEFAULT 'llama3',
    error_code        TEXT,
    error_message     TEXT,
    -- Callback (미니PC Push)
    callback_url      TEXT,
    callback_status   TEXT    DEFAULT 'PENDING',
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


-- AI 처리 결과
CREATE TABLE IF NOT EXISTS ai_results (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id             INTEGER NOT NULL UNIQUE REFERENCES ai_jobs(id) ON DELETE CASCADE,
    stt_text           TEXT,
    stt_segments       TEXT,
    stt_language       TEXT,
    stt_confidence     REAL,
    stt_duration_ms    INTEGER,
    summary_text       TEXT,
    summary_keywords   TEXT,
    summary_duration_ms INTEGER,
    delivery_status    TEXT    DEFAULT 'PENDING' NOT NULL,
    delivered_at       TEXT,
    created_at         TEXT    DEFAULT (datetime('now')) NOT NULL,
    updated_at         TEXT    DEFAULT (datetime('now')) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_result_delivery ON ai_results (delivery_status);
```

---

## 3. 설정 파일 (config.example.yaml)

```yaml
# ku_ai_worker 설정
server:
  host: "0.0.0.0"
  port: 8080
  workers: 1

# DB
database:
  path: "./data/ku_ai_worker.db"

# 파일 저장
storage:
  base_path: "/data/ai-recordings"
  chunk_size_mb: 100
  max_file_size_gb: 3
  retention_days_completed: 7
  retention_days_failed: 3

# Whisper STT
whisper:
  model: "large-v3"
  device: "cuda"          # cuda | cpu
  compute_type: "float16" # float16 | int8
  language: "ko"          # null = auto detect
  beam_size: 5

# Ollama 요약
ollama:
  base_url: "http://localhost:11434"
  model: "llama3"
  timeout_seconds: 300
  prompt_template: |
    다음 강의 내용을 한국어로 요약해주세요.
    - 핵심 내용을 3~5문장으로 요약
    - 주요 키워드 5~10개 추출
    - JSON 형식으로 응답: {"summary": "...", "keywords": [...]}

    강의 내용:
    {text}

# Job Queue
queue:
  max_concurrent: 1
  retry_max: 3
  retry_delay_seconds: 60

# Callback
callback:
  timeout_seconds: 10
  retry_max: 3
  retry_delay_seconds: 30

# 보안
security:
  api_key: "CHANGE_ME_ON_DEPLOY"
  callback_secret: "CHANGE_ME_ON_DEPLOY"

# 로깅
logging:
  level: "INFO"          # DEBUG | INFO | WARNING | ERROR
  file: "./logs/worker.log"
  max_size_mb: 100
  backup_count: 5
```

---

## 4. Docker 설정

### Dockerfile

```dockerfile
FROM nvidia/cuda:12.2.0-runtime-ubuntu22.04

WORKDIR /app

# 시스템 패키지
RUN apt-get update && apt-get install -y \
    python3.11 python3.11-pip python3.11-venv \
    ffmpeg curl \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# 앱 코드
COPY . .

# 디렉토리 생성
RUN mkdir -p /data/ai-recordings/{uploads,completed,results,archive} \
    && mkdir -p /app/data /app/logs

# Ollama 설치 (컨테이너 내)
RUN curl -fsSL https://ollama.com/install.sh | sh

EXPOSE 8080

CMD ["python3", "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### docker-compose.yml

```yaml
version: "3.8"

services:
  ai-worker:
    build: .
    container_name: ku_ai_worker
    ports:
      - "8080:8080"
    volumes:
      - ./data:/app/data                    # SQLite DB
      - ./logs:/app/logs                    # 로그
      - ai-recordings:/data/ai-recordings  # 녹음 파일
      - ./config.yaml:/app/config.yaml     # 설정
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      - CUDA_VISIBLE_DEVICES=0
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/health"]
      interval: 60s
      timeout: 10s
      retries: 3

  ollama:
    image: ollama/ollama:latest
    container_name: ku_ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

volumes:
  ai-recordings:
    driver: local
  ollama-data:
    driver: local
```

---

## 5. Python 의존성 (requirements.txt)

```
# Web Framework
fastapi==0.115.0
uvicorn[standard]==0.32.0
python-multipart==0.0.12

# Whisper STT
faster-whisper==1.1.0
# torch, torchaudio는 CUDA 버전에 맞게 별도 설치

# Ollama Client
ollama==0.4.0

# DB
aiosqlite==0.20.0

# 유틸리티
pyyaml==6.0.2
httpx==0.27.0          # Callback HTTP 클라이언트
pydantic==2.10.0
python-dotenv==1.0.1
apscheduler==3.10.4    # 파일 정리 크론

# 로깅
loguru==0.7.3
```

---

## 6. 환경변수 (.env.example)

```bash
# ku_ai_worker 환경변수

# 서버
HOST=0.0.0.0
PORT=8080

# DB
DATABASE_PATH=./data/ku_ai_worker.db

# 파일 저장 경로
STORAGE_BASE_PATH=/data/ai-recordings

# Whisper
WHISPER_MODEL=large-v3
WHISPER_DEVICE=cuda

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# 보안
API_KEY=CHANGE_ME
CALLBACK_SECRET=CHANGE_ME

# 로그
LOG_LEVEL=INFO
```

---

## 7. 원클릭 설치 스크립트 (scripts/setup.sh)

```bash
#!/bin/bash
set -e

echo "=== ku_ai_worker 설치 시작 ==="

# 1. 디렉토리 생성
echo "[1/6] 디렉토리 생성..."
mkdir -p data logs
mkdir -p /data/ai-recordings/{uploads,completed,results,archive}

# 2. Python 가상환경
echo "[2/6] Python 가상환경 설정..."
python3 -m venv venv
source venv/bin/activate

# 3. 의존성 설치
echo "[3/6] Python 패키지 설치..."
pip install --upgrade pip
pip install -r requirements.txt

# 4. PyTorch + CUDA 설치 (별도)
echo "[4/6] PyTorch CUDA 설치..."
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121

# 5. DB 초기화
echo "[5/6] SQLite DB 초기화..."
sqlite3 data/ku_ai_worker.db < db/init.sql

# 6. 설정 파일 복사
echo "[6/6] 설정 파일..."
if [ ! -f config.yaml ]; then
  cp config.example.yaml config.yaml
  echo "  ⚠️  config.yaml을 수정해주세요 (API_KEY, CALLBACK_SECRET)"
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "  ⚠️  .env를 수정해주세요"
fi

echo ""
echo "=== 설치 완료 ==="
echo "실행: source venv/bin/activate && python -m uvicorn api.main:app --host 0.0.0.0 --port 8080"
echo "Docker: docker compose up -d"
```

---

## 8. API 엔드포인트 요약

### 미니PC → ku_ai_worker

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/upload/init` | 업로드 시작, upload_id 발급 + **callback_url 수신** |
| PUT | `/api/upload/{upload_id}/chunk/{number}` | 청크 업로드 |
| POST | `/api/upload/{upload_id}/complete` | 업로드 완료, Job 등록 |
| GET | `/api/jobs/{job_id}/status` | 처리 상태 조회 (백업용) |
| GET | `/api/jobs/{job_id}/result` | 처리 결과 조회 (백업용) |

### ku_wave_plat API → ku_ai_worker (Proxy)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/health` | 서버 상태 + GPU/메모리/큐 현황 |
| GET | `/api/jobs/queue` | 대기열 현황 (모니터링용) |
| POST | `/api/jobs/{job_id}/cancel` | Job 취소 |

### ku_ai_worker → 미니PC (Callback)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `http://{miniPC_ip}:9090/callback` | 처리 완료 결과 전달 |

### Callback Payload

```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "result": {
    "stt_text": "오늘 강의에서는 데이터구조의...",
    "stt_language": "ko",
    "stt_confidence": 0.92,
    "summary_text": "본 강의는 데이터구조의 기본 개념을 다루며...",
    "summary_keywords": ["데이터구조", "연결리스트", "트리"]
  }
}
```

### Upload Init - callback_url 전달

```json
POST /api/upload/init
{
  "space_code": "SPC-101",
  "device_code": "PC-101",
  "filename": "20260223001.wav",
  "file_size": 1610612736,
  "chunk_size": 104857600,
  "duration_seconds": 5400,
  "recorded_at": "2026-02-23T09:00:00",
  "callback_url": "http://192.168.1.101:9090/callback"
}
```

---

## 9. 파일 정리 크론 (scripts/cleanup.sh)

```bash
#!/bin/bash
# 매일 새벽 3시 실행: 0 3 * * * /app/scripts/cleanup.sh

STORAGE="/data/ai-recordings"
DB="/app/data/ku_ai_worker.db"

echo "[$(date)] 파일 정리 시작"

# 완료 후 7일 지난 원본 파일 삭제
find $STORAGE/completed -type f -mtime +7 -delete
echo "  completed: 7일 이상 파일 삭제"

# 실패 후 3일 지난 원본 파일 삭제
find $STORAGE/archive -type f -mtime +3 -delete
echo "  archive: 3일 이상 파일 삭제"

# 업로드 미완료 청크 (1일 이상) 삭제
find $STORAGE/uploads -type d -mtime +1 -exec rm -rf {} + 2>/dev/null
echo "  uploads: 미완료 청크 삭제"

echo "[$(date)] 파일 정리 완료"
```

---

## 10. 서버 발급 후 체크리스트

- [ ] GPU 드라이버 설치 (nvidia-smi 확인)
- [ ] Docker + NVIDIA Container Toolkit 설치
- [ ] `git clone` → `ku_ai_worker` 레포
- [ ] `cp config.example.yaml config.yaml` → API_KEY, SECRET 설정
- [ ] `cp .env.example .env` → 환경변수 설정
- [ ] `docker compose up -d` 실행
- [ ] `docker exec ku_ollama ollama pull llama3` (LLM 모델 다운로드)
- [ ] `curl http://GPU서버IP:8080/api/health` 동작 확인
- [ ] ku_wave_plat 콘솔에서 Worker 서버 등록 (서버URL + API Key)
- [ ] 미니PC에서 테스트 업로드 실행

---

## 변경 이력

| 일자 | 내용 | 작성자 |
|------|------|--------|
| 2026-02-23 | 초안 - 프로젝트 구조 + Docker + DDL + 설정 | DB Architect |
