# ku_ai_pc 강의실 클라이언트 셋업 (systemd + FastAPI)

> **대상**: 강의실 ku_ai_pc (Ubuntu 24.04, 호실별 설치)
> **작성일**: 2026-03-23 (업데이트)
> **방식**: Python venv + systemd 직접 설치, FastAPI HTTP 서버 추가

---

## 1. 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│              강의실 ku_ai_pc (Ubuntu 24.04)                   │
│              호실: ROOM-101 / PC-101                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │            ku_ai_pc (systemd)                          │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │ [신규] FastAPI HTTP 서버 (:9100)                 │   │  │
│  │  │                                                  │   │  │
│  │  │  POST /ai/start  ← ku_wave_plat 호출 (ENTER)    │   │  │
│  │  │  POST /ai/stop   ← ku_wave_plat 호출 (EXIT)     │   │  │
│  │  │  GET  /ai/status                                 │   │  │
│  │  └──────────────────────┬──────────────────────────┘   │  │
│  │                         │ 트리거                        │  │
│  │                         ▼                               │  │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐             │  │
│  │  │ Recorder │  │    STT    │  │  Voice   │             │  │
│  │  │ (PyAudio)│─▶│ (whisper) │─▶│ Detect   │             │  │
│  │  │  마이크   │  │ 실시간    │  │ 명령매칭  │             │  │
│  │  └──────────┘  └───────────┘  └──────────┘             │  │
│  │       │               │             │                   │  │
│  │       │               │             ▼                   │  │
│  │       │               │     ┌──────────────┐            │  │
│  │       │               │     │ ku_wave_plat │            │  │
│  │       │               │     │ API Client   │            │  │
│  │       │               │     │ (httpx)      │────────────┼──┼──▶ ku_wave_plat
│  │       │               │     │              │            │  │    (운영 서버)
│  │       │               │     │ - Session    │            │  │
│  │       │               │     │ - STT Log    │            │  │
│  │       │               │     │ - VoiceCmd   │            │  │
│  │       │               │     └──────────────┘            │  │
│  │       ▼                                                 │  │
│  │  ┌──────────────┐  ┌───────────────────┐                │  │
│  │  │ File Manager │  │ Offline Queue     │                │  │
│  │  │ (WAV 저장)   │  │ (네트워크 단절 시)  │                │  │
│  │  └──────┬───────┘  └───────────────────┘                │  │
│  │         │                                                │  │
│  │         ▼ (종료 시 청크 업로드)                            │  │
│  │    ku_ai_worker (GPU 서버)                               │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────┐  ┌──────────┐                                  │
│  │ logs/    │  │recordings│                                  │
│  └──────────┘  └──────────┘                                  │
│                                                              │
│  [삭제] 키보드 제어 (s: 시작, e: 종료) → 완전 삭제            │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. 변경 사항 요약

### 삭제

```
[전면 삭제]
├── 키보드 입력 제어 (s: 시작, e: 종료)
├── main.py 키보드 리스닝 로직
├── --headless 모드 키보드 분기
└── 수동 시작/종료 관련 모든 코드
    → NFC 태깅(ku_wave_plat)이 시작/종료를 트리거
```

### 신규

```
[신규] FastAPI HTTP 서버 (:9100)
│
├── POST /ai/start — 녹음 + STT + Voice Detect 시작
│   ├── Request:
│   │   {
│   │     "spaceSeq": 1,
│   │     "tuSeq": 5,
│   │     "callbackUrl": "http://운영서버/api/v1/ai-system/ai/callback",
│   │     "wavePlatUrl": "http://운영서버/api/v1"
│   │   }
│   │
│   ├── 내부 동작:
│   │   1. ku_wave_plat에 SpeechSession 생성 → sessionSeq 획득
│   │   2. 마이크 녹음 시작 (PyAudio → WAV)
│   │   3. 실시간 STT 시작 (faster-whisper, 5초 청크)
│   │   4. Voice Detect 시작 (키워드 매칭)
│   │   5. STT 로그 → ku_wave_plat 실시간 전송
│   │   6. Voice Detect 매칭 → ku_wave_plat 명령 실행 요청
│   │
│   └── Response: { "status": "started", "sessionSeq": 42 }
│
├── POST /ai/stop — 녹음 정지 + Worker 전송
│   ├── Request: { "spaceSeq": 1 }
│   │
│   ├── 내부 동작:
│   │   1. 마이크 녹음 정지 + STT 정지
│   │   2. WAV 파일 finalize
│   │   3. ku_ai_worker에 녹음 파일 청크 업로드
│   │      POST {AI_WORKER_URL}/jobs (multipart: audioFile + callbackUrl + sessionSeq)
│   │   4. ku_wave_plat에 Session 종료 통보
│   │      PATCH {wavePlatUrl}/ai-system/speech-sessions/{seq}/end
│   │
│   └── Response: { "status": "stopped", "sessionSeq": 42, "filename": "...", "durationSec": 2700 }
│
└── GET /ai/status — 현재 상태
    └── Response: { "recording": true/false, "sessionSeq": 42, "durationSec": 1200 }
```

### 유지 (변경 없음)

```
├── PyAudio 녹음 모듈 (마이크 → WAV)
├── faster-whisper STT 모듈 (실시간 청크 변환)
├── Voice Detect 모듈 (키워드 매칭)
├── API Client (ku_wave_plat 통신, httpx)
├── Uploader (ku_ai_worker 통신, httpx)
└── Offline Queue (네트워크 단절 시 재시도)
```

---

## 3. Voice Detect 명령어 실행 흐름 (강의 중)

```
[실시간 루프 — 강의 중]

마이크 음성 입력
    │
    ▼
faster-whisper STT (5초 청크)
    │
    ├──▶ STT 로그 → ku_wave_plat 전송
    │    POST /api/v1/ai-system/speech-sessions/:seq/logs
    │    {segmentText, segmentStartSec, segmentEndSec, confidence}
    │
    ▼
Voice Detect (키워드 매칭)
    │
    │  예: "스크린 올려" 감지 (confidence ≥ 0.85)
    │
    ▼
ku_ai_pc → ku_wave_plat 요청
    POST /api/v1/ai-system/voice-commands/execute
    {voiceCommandSeq, recognizedText, matchedKeyword, matchScore, sessionSeq}
    │
    ▼
ku_wave_plat 내부:
    VoiceCommandsService.executeCommand()
    → ControlService.execute()
    → TCP 9090 → IoT 컨트롤러
    → 스크린 올림 실행
    → tb_ai_command_log 저장
```

---

## 4. 요구사항

| 항목 | 최소 | 권장 |
|------|------|------|
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| CPU | Intel i5 | Intel i7 |
| RAM | 8 GB | 16 GB |
| Disk | 128 GB SSD | 256 GB SSD |
| Audio | 마이크 입력 (3.5mm) | USB 마이크 |
| GPU | 없어도 됨 (CPU STT) | NVIDIA GPU (STT 가속) |
| Network | 유선 LAN | 유선 LAN |

---

## 5. 셋업 스크립트 구조

```
ku_ai_pc/
└── scripts/
    ├── 01-base-setup.sh          # OS 기본 + Python + 시스템 패키지
    ├── 02-app-install.sh         # venv + 의존성 + .env 생성
    ├── 03-service-setup.sh       # systemd 등록 + 헬스모니터 cron
    ├── 04-gpu-setup.sh           # NVIDIA GPU 가속 (선택)
    ├── update.sh                 # 업데이트 스크립트
    ├── deploy-prod.sh            # 원격 배포 (개발PC → ku_ai_pc)
    └── prod.sh                   # [기존] 운영 실행
```

---

## 6. 스크립트 상세

### 01-base-setup.sh — OS + Python + 시스템 패키지

```bash
#!/bin/bash
# ku_ai_pc 기본 설정
# Usage: sudo ./scripts/01-base-setup.sh
set -euo pipefail

echo "=== [1/3] ku_ai_pc 기본 설정 ==="

# --- 시스템 업데이트 ---
apt-get update && apt-get upgrade -y

# --- 필수 패키지 ---
apt-get install -y \
    python3 python3-venv python3-dev python3-pip \
    portaudio19-dev \
    build-essential \
    curl wget git \
    ufw fail2ban htop \
    alsa-utils

# --- 방화벽 (SSH + FastAPI) ---
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 9100/tcp   # [신규] FastAPI AI 제어 서버
ufw --force enable
echo "✅ 방화벽: SSH(22) + FastAPI(9100) 개방"

# --- fail2ban ---
systemctl enable fail2ban
systemctl start fail2ban

# --- 전용 유저 생성 ---
if ! id "ku" &> /dev/null; then
    useradd -m -s /bin/bash ku
    usermod -aG audio ku
    echo "✅ ku 유저 생성 (audio 그룹)"
else
    echo "✅ ku 유저 이미 존재"
fi

# --- 프로젝트 디렉토리 ---
mkdir -p /opt/ku_ai_pc
mkdir -p /opt/ku_ai_pc/logs
mkdir -p /opt/ku_ai_pc/recordings
chown -R ku:ku /opt/ku_ai_pc
echo "✅ 프로젝트 디렉토리: /opt/ku_ai_pc"

# --- 마이크 확인 ---
echo ""
echo "🎤 오디오 입력 디바이스 목록:"
arecord -l 2>/dev/null || echo "⚠️  오디오 디바이스 미감지 (마이크 연결 확인)"

echo ""
echo "=== 기본 설정 완료 ==="
echo "다음: sudo -u ku ./scripts/02-app-install.sh"
```

---

### 02-app-install.sh — venv + 의존성 + .env

```bash
#!/bin/bash
# ku_ai_pc 앱 설치
# Usage: ./scripts/02-app-install.sh  (ku 유저로 실행)
set -euo pipefail

echo "=== [2/3] ku_ai_pc 앱 설치 ==="

INSTALL_DIR="/opt/ku_ai_pc"
cd "$INSTALL_DIR"

# --- Python 가상환경 ---
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo "✅ Python 가상환경 생성"
else
    echo "✅ 가상환경 이미 존재"
fi

source .venv/bin/activate

# --- pip 업그레이드 ---
pip install --upgrade pip

# --- 의존성 설치 (FastAPI 추가) ---
echo "📦 패키지 설치 (STT + FastAPI)..."
pip install -e ".[stt]"
pip install fastapi uvicorn[standard]
echo "✅ 의존성 설치 완료"

# --- .env 생성 ---
if [ ! -f ".env" ]; then
    cat > .env << 'ENVEOF'
# ==========================================
# ku_ai_pc 운영 환경변수 (호실별 수정 필요)
# ==========================================

# === 호실 정보 (호실마다 다름) ===
ROOM_CODE=ROOM-101
DEVICE_CODE=PC-101
SPACE_SEQ=1

# === FastAPI 서버 [신규] ===
AI_PC_PORT=9100

# === ku_wave_plat 연결 ===
WAVE_PLAT_URL=http://운영서버IP/api/v1
WAVE_PLAT_USERNAME=minipc
WAVE_PLAT_PASSWORD=CHANGE_ME

# === ku_ai_worker 연결 (GPU 서버) ===
AI_WORKER_URL=http://GPU서버IP:9000
AI_WORKER_API_KEY=CHANGE_ME

# === STT 설정 ===
# CPU 모드 (기본)
STT_ENGINE=whisper
STT_MODEL=tiny
STT_LANGUAGE=ko
STT_DEVICE=cpu
STT_COMPUTE_TYPE=int8
# GPU 모드 (04-gpu-setup.sh 실행 후)
# STT_MODEL=large-v3
# STT_DEVICE=cuda
# STT_COMPUTE_TYPE=float16

# === 녹음 설정 ===
AUDIO_SAMPLE_RATE=16000
AUDIO_CHANNELS=1
AUDIO_CHUNK_DURATION=5
RECORDING_DIR=./recordings
MAX_RECORDING_HOURS=4

# === 업로드 설정 ===
UPLOAD_MAX_RETRIES=3
UPLOAD_RETRY_DELAY=10
DELETE_AFTER_UPLOAD=true

# === Voice Detect ===
VOICE_DETECT_ENABLED=true
VOICE_DETECT_MIN_CONFIDENCE=0.85
VOICE_DETECT_COOLDOWN=3

# === 로깅 ===
LOG_LEVEL=INFO
LOG_DIR=./logs
ENVEOF

    echo ""
    echo "⚠️  .env 파일이 생성되었습니다. 반드시 편집하세요:"
    echo "    nano $INSTALL_DIR/.env"
    echo ""
    echo "📌 호실별 변경 필수:"
    echo "   ROOM_CODE      → 호실 코드 (ROOM-101, ROOM-102, ...)"
    echo "   DEVICE_CODE     → 장치 코드 (PC-101, PC-102, ...)"
    echo "   SPACE_SEQ       → 공간 시퀀스 번호"
    echo ""
    echo "📌 공통 변경 필수:"
    echo "   WAVE_PLAT_URL   → ku_wave_plat 운영 서버 IP"
    echo "   WAVE_PLAT_PASSWORD"
    echo "   AI_WORKER_URL   → GPU 서버 IP"
    echo "   AI_WORKER_API_KEY"
    exit 1
fi

# --- 설치 검증 ---
echo ""
echo "📋 설치 검증:"
echo "   Python: $(python3 --version)"
echo "   pip packages: $(pip list --format=columns | wc -l)개"

# FastAPI 확인
python3 -c "
try:
    import fastapi
    print(f'   FastAPI: ✅ {fastapi.__version__}')
except ImportError:
    print('   FastAPI: ❌ 미설치')
"

# STT 엔진 로드 테스트
python3 -c "
try:
    from faster_whisper import WhisperModel
    print('   STT (faster-whisper): ✅ 설치됨')
except ImportError:
    print('   STT (faster-whisper): ❌ 미설치 (pip install faster-whisper)')
"

# 마이크 테스트
python3 -c "
try:
    import pyaudio
    p = pyaudio.PyAudio()
    count = p.get_device_count()
    print(f'   PyAudio 디바이스: {count}개 감지')
    p.terminate()
except Exception as e:
    print(f'   PyAudio: ❌ {e}')
"

echo ""
echo "=== 앱 설치 완료 ==="
echo "다음: sudo ./scripts/03-service-setup.sh"
```

---

### 03-service-setup.sh — systemd + 헬스모니터

```bash
#!/bin/bash
# systemd 서비스 등록 + 헬스 모니터링 cron
# Usage: sudo ./scripts/03-service-setup.sh
set -euo pipefail

echo "=== [3/3] systemd 서비스 + 헬스 모니터 설정 ==="

INSTALL_DIR="/opt/ku_ai_pc"

# --- systemd 서비스 등록 (FastAPI 모드) ---
cat > /etc/systemd/system/ku-ai-pc.service << EOF
[Unit]
Description=KU AI PC Client (FastAPI + 녹음/STT/Voice Detect)
After=network-online.target sound.target
Wants=network-online.target

[Service]
Type=simple
User=ku
Group=ku
WorkingDirectory=${INSTALL_DIR}
ExecStart=${INSTALL_DIR}/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 9100
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

# 리소스 제한
MemoryMax=2G
CPUQuota=80%

# 로그
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ku-ai-pc

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ku-ai-pc
echo "✅ systemd 서비스 등록 (ku-ai-pc → uvicorn :9100)"

# --- 헬스 모니터링 스크립트 ---
cat > ${INSTALL_DIR}/scripts/health-monitor.sh << 'HEALTHEOF'
#!/bin/bash
# 헬스 모니터링 (cron 5분마다 실행)
LOG="/opt/ku_ai_pc/logs/health-monitor.log"
MAX_RESTART=3
COUNT_FILE="/tmp/ku_ai_pc_restart_count"
NOW=$(date '+%Y-%m-%d %H:%M:%S')

# systemd 서비스 체크
if systemctl is-active --quiet ku-ai-pc; then
    # HTTP 헬스체크 추가
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9100/ai/status 2>/dev/null || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        echo 0 > "$COUNT_FILE"
        exit 0
    fi
    echo "[$NOW] HTTP 헬스체크 실패 ($HTTP_STATUS)" >> "$LOG"
fi

COUNT=$(cat "$COUNT_FILE" 2>/dev/null || echo 0)

if [ "$COUNT" -ge "$MAX_RESTART" ]; then
    echo "[$NOW] CRITICAL: 재시작 ${MAX_RESTART}회 초과. 수동 확인 필요." >> "$LOG"
    exit 1
fi

echo "[$NOW] 서비스 다운 → 재시작 (${COUNT}/${MAX_RESTART})" >> "$LOG"
systemctl restart ku-ai-pc
echo $((COUNT + 1)) > "$COUNT_FILE"
HEALTHEOF

chmod +x ${INSTALL_DIR}/scripts/health-monitor.sh

# --- 녹음 파일 자동 정리 스크립트 ---
cat > ${INSTALL_DIR}/scripts/cleanup-recordings.sh << 'CLEANEOF'
#!/bin/bash
# 3일 이상 된 녹음 파일 정리 (업로드 완료된 파일만)
RECORDING_DIR="/opt/ku_ai_pc/recordings"
LOG="/opt/ku_ai_pc/logs/cleanup.log"
NOW=$(date '+%Y-%m-%d %H:%M:%S')

DELETED=$(find "$RECORDING_DIR" -name "*.wav" -mtime +3 -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$NOW] 녹음 파일 ${DELETED}개 정리" >> "$LOG"
fi
CLEANEOF

chmod +x ${INSTALL_DIR}/scripts/cleanup-recordings.sh

# --- cron 등록 ---
CRON_HEALTH="*/5 * * * * ${INSTALL_DIR}/scripts/health-monitor.sh"
CRON_CLEANUP="0 4 * * * ${INSTALL_DIR}/scripts/cleanup-recordings.sh"

(crontab -l 2>/dev/null | grep -v "health-monitor.sh" | grep -v "cleanup-recordings.sh"
echo "$CRON_HEALTH"
echo "$CRON_CLEANUP") | crontab -

echo "✅ cron 등록:"
echo "   헬스 모니터: 5분마다 (systemd + HTTP 체크)"
echo "   녹음 정리:   매일 04:00 (3일 이상)"

# --- 서비스 시작 ---
echo ""
read -p "지금 서비스를 시작하시겠습니까? (y/N): " START_NOW
if [ "$START_NOW" = "y" ] || [ "$START_NOW" = "Y" ]; then
    systemctl start ku-ai-pc
    sleep 3
    systemctl status ku-ai-pc --no-pager

    # FastAPI 헬스체크
    echo ""
    sleep 2
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9100/ai/status 2>/dev/null || echo "000")
    [ "$HTTP_STATUS" = "200" ] && echo "✅ FastAPI OK (http://localhost:9100)" || echo "⚠️  FastAPI: $HTTP_STATUS"
fi

echo ""
echo "=== 서비스 설정 완료 ==="
echo ""
echo "📌 서비스 제어:"
echo "   시작:   sudo systemctl start ku-ai-pc"
echo "   중지:   sudo systemctl stop ku-ai-pc"
echo "   재시작: sudo systemctl restart ku-ai-pc"
echo "   상태:   sudo systemctl status ku-ai-pc"
echo "   로그:   journalctl -u ku-ai-pc -f"
echo "   API:    curl http://localhost:9100/ai/status"
```

---

### 04-gpu-setup.sh — NVIDIA GPU 가속 (선택)

```bash
#!/bin/bash
# NVIDIA GPU 설치 (faster-whisper 가속)
# Usage: sudo ./scripts/04-gpu-setup.sh
set -euo pipefail

echo "=== GPU 가속 설정 (선택) ==="

if ! lspci | grep -i nvidia > /dev/null; then
    echo "❌ NVIDIA GPU 미감지. CPU 모드를 사용하세요."
    echo "   .env → STT_DEVICE=cpu, STT_MODEL=tiny"
    exit 0
fi

echo "✅ NVIDIA GPU 감지: $(lspci | grep -i nvidia | head -1)"

apt-get update
apt-get install -y nvidia-driver-550 nvidia-cuda-toolkit

INSTALL_DIR="/opt/ku_ai_pc"
source ${INSTALL_DIR}/.venv/bin/activate
pip install nvidia-cublas-cu12 nvidia-cudnn-cu12

echo ""
echo "✅ GPU 설치 완료"
echo ""
echo "⚠️  재부팅 필요: sudo reboot"
echo ""
echo "재부팅 후:"
echo "  1. nvidia-smi 로 GPU 확인"
echo "  2. .env 수정:"
echo "     STT_DEVICE=cuda"
echo "     STT_COMPUTE_TYPE=float16"
echo "     STT_MODEL=large-v3"
echo "  3. sudo systemctl restart ku-ai-pc"
```

---

## 7. 환경변수 (.env) — 호실별 다른 값

| 변수 | 필수 | 호실별 | 예시 |
|------|------|--------|------|
| `ROOM_CODE` | Y | Y | `ROOM-101` |
| `DEVICE_CODE` | Y | Y | `PC-101` |
| `SPACE_SEQ` | Y | Y | `1` |
| `AI_PC_PORT` | Y | N | `9100` |
| `WAVE_PLAT_URL` | Y | N | `http://운영서버IP/api/v1` |
| `WAVE_PLAT_USERNAME` | Y | N | `minipc` |
| `WAVE_PLAT_PASSWORD` | Y | N | 비밀번호 |
| `AI_WORKER_URL` | Y | N | `http://GPU서버IP:9000` |
| `AI_WORKER_API_KEY` | Y | N | API 키 |
| `STT_DEVICE` | N | Y | `cpu` / `cuda` |
| `STT_MODEL` | N | Y | `tiny`(CPU) / `large-v3`(GPU) |
| `STT_COMPUTE_TYPE` | N | Y | `int8`(CPU) / `float16`(GPU) |

> **삭제된 변수**: `CALLBACK_URL` — 더 이상 .env에 고정하지 않음. ku_wave_plat가 `/ai/start` 호출 시 `callbackUrl`을 동적으로 전달.

---

## 8. 실행 순서 (호실당)

```
순서    명령어                                              소요
──────────────────────────────────────────────────────────────
 1     sudo ./scripts/01-base-setup.sh                     ~5분
 2     sudo -u ku ./scripts/02-app-install.sh              ~5분
 3     nano /opt/ku_ai_pc/.env (호실별 설정 수정)           ~3분
 4     sudo ./scripts/03-service-setup.sh                  ~2분
 5     (선택) sudo ./scripts/04-gpu-setup.sh + reboot      ~10분
──────────────────────────────────────────────────────────────
합계    ~15분 (GPU 없을 때) / ~25분 (GPU 포함)
```

---

## 9. 서비스 명령어

```bash
# 서비스 제어
sudo systemctl start ku-ai-pc       # 시작
sudo systemctl stop ku-ai-pc        # 중지
sudo systemctl restart ku-ai-pc     # 재시작
sudo systemctl status ku-ai-pc      # 상태

# 로그
journalctl -u ku-ai-pc -f           # 실시간 로그
journalctl -u ku-ai-pc -n 100       # 최근 100줄
journalctl -u ku-ai-pc --since today # 오늘 로그

# FastAPI 확인
curl http://localhost:9100/ai/status # API 상태 확인

# 부팅 시 자동시작
sudo systemctl enable ku-ai-pc      # 활성화
sudo systemctl disable ku-ai-pc     # 비활성화
```

---

## 10. 다수 호실 배포 (개발PC에서)

```bash
# 최초 설치는 각 ku_ai_pc에서 01~03 스크립트 실행

# 이후 업데이트는 개발PC에서 일괄 배포
./scripts/deploy-prod.sh 192.168.1.50 ku    # 101호
./scripts/deploy-prod.sh 192.168.1.51 ku    # 102호
./scripts/deploy-prod.sh 192.168.1.52 ku    # 103호
```

---

## 11. 트러블슈팅

| 증상 | 확인 | 해결 |
|------|------|------|
| 서비스 안 뜸 | `journalctl -u ku-ai-pc -n 50` | .env 확인 |
| FastAPI 응답 없음 | `curl http://localhost:9100/ai/status` | 포트 충돌, 바인딩 확인 |
| 마이크 인식 안 됨 | `arecord -l` | ALSA 디바이스, `usermod -aG audio ku` |
| STT 모델 로드 실패 | 로그에 메모리 오류 | `STT_MODEL=tiny`로 변경 |
| ku_wave_plat 연결 실패 | `curl http://운영서버IP/api/v1/health` | 네트워크, 서버 상태 |
| ku_ai_worker 업로드 실패 | 로그 확인 | Offline Queue 자동 재시도 |
| 디스크 가득 | `df -h` | `DELETE_AFTER_UPLOAD=true`, cleanup cron 확인 |
| Permission denied | `ls -la /opt/ku_ai_pc` | `chown -R ku:ku /opt/ku_ai_pc` |
| GPU 안 잡힘 | `nvidia-smi` | 드라이버 재설치, 재부팅 |
| 9100 포트 차단 | `ufw status` | `ufw allow 9100/tcp` |
