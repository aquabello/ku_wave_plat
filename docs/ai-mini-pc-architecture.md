# ku_mini_pc Architecture

> 강의실 miniPC 클라이언트 — 녹음, 실시간 STT, Voice Detect, 파일 업로드 시스템 설계 문서

---

## 1. 시스템 개요

### 역할

miniPC는 각 강의실에 설치되는 **Python 클라이언트**로, 다음 4가지 핵심 기능을 수행합니다:

1. **마이크 녹음** — 강의 음성을 .wav 파일로 저장
2. **실시간 STT** — CPU 기반 faster-whisper로 음성→텍스트 변환 (자막용)
3. **Voice Detect** — 음성명령 키워드 감지 → ku_wave_plat API 호출 → 장비 제어
4. **파일 업로드** — 강의 종료 후 .wav를 ku_ai_worker GPU 서버에 직접 청크 업로드

### 배포 규모

- **22대** 강의실에 동일 코드 배포
- 각 miniPC는 같은 네트워크의 **ku_wave_plat 로컬 서버**(localhost 또는 고정 IP)와 1:1 통신

### 하드웨어 스펙

| 항목 | 스펙 | 비고 |
|------|------|------|
| CPU | **Intel i3** | faster-whisper CPU 모드 전용 |
| RAM | **16GB** | whisper ~1GB + pyaudio + Python 런타임 |
| Storage | **128GB HDD** | .wav 임시 저장 (업로드 후 삭제) |
| GPU | **없음** | CPU Only — CUDA 미사용 |
| OS | ubuntu | 24.04 |
| 마이크 | USB 마이크 또는 내장 마이크 | pyaudio 호환 |
| Network | 1Gbps 유선 (교내 LAN) | ku_wave_plat, ku_ai_worker와 통신 |

### 하드웨어 제약에 따른 설계 결정

| 제약 | 영향 | 대응 |
|------|------|------|
| **GPU 없음** | faster-whisper GPU 가속 불가 | CPU 모드 + tiny/base 모델 사용 |
| **i3 CPU** | 연산 성능 제한 | small 모델 실시간 불가 → tiny/base로 제한 |
| **128GB HDD** | 저장 공간 제한 | 업로드 완료 후 즉시 삭제, 최대 3일 보관 |
| **HDD (SSD 아님)** | I/O 속도 제한 | 녹음 버퍼 크기 조정, 순차 쓰기 최적화 |

---

## 2. STT 모델 선정

### CPU Only 환경 벤치마크 (i3 기준 예상치)

| 모델 | RAM 사용 | 처리 비율 (10초 음성) | 실시간 가능 | 인식률 |
|------|----------|----------------------|------------|--------|
| **tiny** | ~1GB | **1x~2x** (~10~20초) | **O (권장)** | ~75% |
| **base** | ~1.5GB | **2x~3x** (~20~30초) | **△ (조건부)** | ~80% |
| **small** | ~2.5GB | **4x~8x** (~40~80초) | **X (불가)** | ~85% |
| medium | ~5GB | 10x+ | X | ~88% |
| large-v3 | ~10GB | 20x+ | X | ~95% |

### 결정: large-v3 모델 기본, base 모델 옵션

```
[기본] faster-whisper tiny (CPU)
  - 실시간 자막: 충분 (75% 인식률)
  - Voice Detect: 충분 (짧은 키워드 매칭)
  - RAM: ~1GB (16GB 중 여유 충분)

[옵션] faster-whisper base (CPU)
  - i3 성능에 따라 실시간 가능 여부 벤치마크 후 결정
  - 인식률 ~80%로 향상

[정밀 STT는 GPU 서버 담당]
  ku_ai_worker (Whisper large-v3, GPU) → 95%+ 인식률
  → 강의 종료 후 .wav 업로드 → 배치 처리
```

### STT 모델 플러그인 구조 (Hot-Swap 설계)

STT 모델은 운영 중 교체 가능한 플러그인 구조로 설계합니다.
`.env` 변경 + 재시작만으로 모델을 전환할 수 있어야 하며, 향후 Whisper 외 다른 STT 엔진 추가도 고려합니다.

```python
# stt/base.py — STT 엔진 추상 인터페이스

from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class SttResult:
    text: str
    confidence: float
    start_sec: float
    end_sec: float
    language: str = "ko"

class BaseSttEngine(ABC):
    """STT 엔진 추상 클래스 — 모든 STT 구현체가 따르는 인터페이스"""

    @abstractmethod
    def load_model(self) -> None:
        """모델 로드 (초기화 시 1회)"""

    @abstractmethod
    def transcribe_chunk(self, audio_chunk: np.ndarray) -> SttResult:
        """오디오 청크 → 텍스트 변환"""

    @abstractmethod
    def unload_model(self) -> None:
        """모델 언로드 (메모리 해제)"""

    @abstractmethod
    def get_info(self) -> dict:
        """현재 모델 정보 반환 (이름, 크기, 디바이스 등)"""


# stt/whisper_engine.py — faster-whisper 구현체

class WhisperSttEngine(BaseSttEngine):
    """faster-whisper 기반 STT 엔진"""

    def __init__(self, model: str = "tiny", device: str = "cpu", compute_type: str = "int8"):
        self.model_name = model
        self.device = device
        self.compute_type = compute_type
        self._model: WhisperModel | None = None

    def load_model(self) -> None:
        self._model = WhisperModel(self.model_name, device=self.device, compute_type=self.compute_type)

    def unload_model(self) -> None:
        del self._model
        self._model = None


# stt/engine_factory.py — 팩토리 패턴으로 엔진 생성

STT_ENGINES = {
    "whisper": WhisperSttEngine,
    # 향후 확장:
    # "vosk": VoskSttEngine,
    # "google": GoogleSttEngine,
}

def create_stt_engine(engine_type: str = "whisper", **kwargs) -> BaseSttEngine:
    """설정 기반 STT 엔진 팩토리"""
    engine_class = STT_ENGINES.get(engine_type)
    if not engine_class:
        raise ValueError(f"Unknown STT engine: {engine_type}. Available: {list(STT_ENGINES.keys())}")
    return engine_class(**kwargs)
```

**모델 전환 시나리오**:

| 시나리오 | 변경 방법 | 재시작 필요 |
|---------|----------|------------|
| tiny → base 업그레이드 | `.env`에서 `STT_MODEL=base` | Yes |
| Whisper → Vosk 전환 | `.env`에서 `STT_ENGINE=vosk` | Yes |
| 모델 벤치마크 | `scripts/benchmark_stt.py --model base` | No (독립 실행) |

**환경변수 추가** (`.env`):
```env
STT_ENGINE=whisper                    # whisper / vosk (향후)
STT_MODEL=tiny                        # tiny / base / small
STT_DEVICE=cpu                        # cpu / cuda (GPU 있을 경우)
STT_COMPUTE_TYPE=int8                 # int8 / float16 / float32
```

### 듀얼 STT 전략

| 단계 | 위치 | 모델 | 목적 | 인식률 |
|------|------|------|------|--------|
| **강의 중** (실시간) | miniPC CPU | tiny/base | 자막 + 음성명령 감지 | ~75-80% |
| **강의 후** (배치) | ku_ai_worker GPU | large-v3 | 정밀 STT + 요약 | ~95%+ |

---

## 3. 프로젝트 구조

### 별도 레포 (ku_wave_plat 모노레포와 분리)

```
ku_mini_pc/                          ← Python 프로젝트 (별도 Git 레포)
├── README.md                        # 설치/실행 가이드
├── pyproject.toml                   # 프로젝트 메타 + 의존성 (Poetry/uv)
├── .env.example                     # 환경변수 템플릿
├── .env                             # 호실별 환경변수 (Git 미포함)
│
├── config/
│   ├── __init__.py
│   └── settings.py                  # 환경변수 로드 + 설정 클래스
│
├── recorder/                        # 🎤 마이크 녹음 모듈
│   ├── __init__.py
│   ├── audio_recorder.py            # pyaudio 녹음 (WAV 저장)
│   ├── audio_config.py              # 오디오 설정 (샘플레이트, 채널 등)
│   └── file_manager.py              # 녹음 파일 관리 (경로, 삭제, 용량 체크)
│
├── stt/                             # 🗣️ 실시간 STT 모듈
│   ├── __init__.py
│   ├── stt_engine.py                # faster-whisper 래퍼 (CPU 모드)
│   ├── stream_processor.py          # 실시간 오디오 스트림 → 텍스트 변환
│   └── subtitle_buffer.py           # 자막 텍스트 버퍼 (UI 연동)
│
├── voice_detect/                    # ⚡ Voice Detect (음성명령 감지)
│   ├── __init__.py
│   ├── command_matcher.py           # 키워드 매칭 엔진 (fuzzy match)
│   ├── command_cache.py             # 명령어 사전 캐싱 (시작 시 API 조회)
│   └── command_executor.py          # ku_wave_plat API 호출 → 장비 제어 요청
│
├── uploader/                        # 📤 파일 업로드 모듈
│   ├── __init__.py
│   ├── chunk_uploader.py            # 청크 업로드 (ku_ai_worker 직접)
│   ├── upload_manager.py            # 업로드 상태 관리 + 재시도
│   └── offline_queue.py             # 오프라인 큐 (네트워크 장애 시 버퍼)
│
├── api_client/                      # 🔗 API 클라이언트
│   ├── __init__.py
│   ├── wave_plat_client.py          # ku_wave_plat API (세션/로그/명령)
│   ├── ai_worker_client.py          # ku_ai_worker API (업로드/상태)
│   └── auth.py                      # JWT 토큰 관리 (자동 갱신)
│
├── ui/                              # 🖥️ 교사용 UI (옵션)
│   ├── __init__.py
│   ├── main_window.py               # 메인 윈도우 (강의 시작/종료)
│   ├── subtitle_overlay.py          # 자막 오버레이 표시
│   └── status_indicator.py          # 상태 표시 (녹음 중, STT 동작 등)
│
├── core/                            # 🔧 코어 유틸리티
│   ├── __init__.py
│   ├── session_manager.py           # 강의 세션 라이프사이클 관리
│   ├── event_bus.py                 # 내부 이벤트 버스 (모듈 간 통신)
│   ├── logger.py                    # 로깅 설정
│   └── health_check.py              # 자체 헬스체크 + 서버 연결 확인
│
├── scripts/                         # 유틸리티 스크립트
│   ├── benchmark_stt.py             # STT 모델 벤치마크 (tiny/base 비교)
│   ├── test_microphone.py           # 마이크 테스트
│   ├── test_upload.py               # 업로드 테스트
│   └── setup_autostart.py           # 자동 시작 설정 (systemd/Windows 서비스)
│
├── tests/                           # 테스트
│   ├── test_recorder.py
│   ├── test_stt.py
│   ├── test_voice_detect.py
│   ├── test_uploader.py
│   └── test_api_client.py
│
└── main.py                          # 엔트리포인트
```

### 분리 근거

| 관점 | ku_wave_plat | ku_mini_pc |
|------|-------------|-----------|
| 언어 | TypeScript (NestJS + Next.js) | **Python** |
| 패키지 관리 | pnpm + Turborepo | **Poetry / uv** |
| 배포 대상 | 서버 1대 | **miniPC 22대** |
| 의존성 | NestJS, React, TypeORM | **pyaudio, faster-whisper, httpx** |
| CI/CD | 웹 배포 (Docker) | **물리 장비 배포 (rsync/ansible)** |
| 하드웨어 | 일반 서버 | **i3 PC + 마이크** |

---

## 4. 환경변수 설정

### .env.example

```env
# ==========================================
# 호실 식별
# ==========================================
ROOM_CODE=ROOM-101                    # 호실 코드
DEVICE_CODE=PC-101                    # miniPC 식별자
SPACE_SEQ=1                           # ku_wave_plat 공간 시퀀스

# ==========================================
# ku_wave_plat 연결 (로컬 서버)
# ==========================================
WAVE_PLAT_URL=http://localhost:8000/api/v1    # 같은 호실 ku_wave_plat
WAVE_PLAT_USERNAME=minipc                      # 로그인 계정
WAVE_PLAT_PASSWORD=minipc1234                  # 로그인 비밀번호

# ==========================================
# ku_ai_worker 연결 (GPU 서버)
# ==========================================
AI_WORKER_URL=http://203.252.151.52:9000      # AI Worker 서버 URL
AI_WORKER_API_KEY=4b9a528ac855348e01efee832f64f3d933b57d75f40aaa3b  # API 인증키
CALLBACK_URL=http://localhost:8000/api/v1/ai-system/ai/callback     # Callback 수신 URL

# ==========================================
# STT 설정
# ==========================================
STT_MODEL=tiny                        # tiny / base (CPU 환경 권장)
STT_LANGUAGE=ko                       # 인식 언어
STT_DEVICE=cpu                        # cpu (GPU 없음)
STT_COMPUTE_TYPE=int8                 # int8 (CPU 최적화)

# ==========================================
# 녹음 설정
# ==========================================
AUDIO_SAMPLE_RATE=16000               # 샘플레이트 (whisper 권장)
AUDIO_CHANNELS=1                      # 모노
AUDIO_CHUNK_DURATION=5                # STT 처리 단위 (초)
RECORDING_DIR=./recordings            # 녹음 파일 저장 경로
MAX_RECORDING_HOURS=4                 # 최대 녹음 시간

# ==========================================
# 업로드 설정
# ==========================================
UPLOAD_CHUNK_SIZE=104857600           # 100MB 청크
UPLOAD_MAX_RETRIES=3                  # 청크 업로드 재시도
UPLOAD_RETRY_DELAY=10                 # 재시도 대기 (초)
DELETE_AFTER_UPLOAD=true              # 업로드 완료 후 파일 삭제

# ==========================================
# Voice Detect 설정
# ==========================================
VOICE_DETECT_ENABLED=true             # 음성명령 감지 활성화
VOICE_DETECT_MIN_CONFIDENCE=0.85      # 최소 매칭 신뢰도
VOICE_DETECT_COOLDOWN=3               # 명령 실행 후 쿨다운 (초)

# ==========================================
# 로깅
# ==========================================
LOG_LEVEL=INFO                        # DEBUG / INFO / WARNING / ERROR
LOG_DIR=./logs                        # 로그 저장 경로
```

---

## 5. 통신 흐름

### miniPC가 참여하는 3개 통신 경로

```
miniPC                        ku_wave_plat (로컬)            ku_ai_worker (GPU)
  │                                 │                              │
  │ ─① Voice Detect ──────────────▶│                              │
  │   POST /commands/execute        │  장비 제어 실행              │
  │ ◀── 실행결과 응답 ──────────── │                              │
  │                                 │                              │
  │ ─② 로그/세션 저장 ────────────▶│                              │
  │   POST /speech-sessions         │  DB 저장                    │
  │   POST /speech-logs             │                              │
  │   POST /lecture-summaries       │                              │
  │                                 │                              │
  │ ─③ .wav 직접 업로드 ──────────┼─────────────────────────────▶│
  │   POST /api/upload/init         │  (ku_wave_plat 미경유)       │
  │   PUT  /api/upload/chunk × N    │                              │
  │   POST /api/upload/complete     │                              │
  │                                 │                              │
  │                                 │ ◀── ④ Callback ──────────── │
  │                                 │   (miniPC 미관여)             │
```

### 통신별 인증 방식

| 경로 | 대상 | 인증 방식 | 비고 |
|------|------|----------|------|
| miniPC → ku_wave_plat | ①② | **JWT Bearer** | 로그인 후 토큰 자동 갱신 |
| miniPC → ku_ai_worker | ③ | **API Key** (`Authorization: Bearer {api_key}`) | .env에 설정 |
| ku_ai_worker → ku_wave_plat | ④ | **HMAC-SHA256** | miniPC 미관여 |

---

## 6. 강의 세션 라이프사이클

### 전체 흐름 (main.py 관점)

```
[대기 상태]
  │
  ▼ 교사 "강의시작" 클릭
  │
  ├─ 1. 명령어 사전 로드
  │    GET /ai-system/voice-commands?spaceSeq={SPACE_SEQ}
  │    → command_cache에 저장
  │
  ├─ 2. 음성인식 세션 생성
  │    POST /ai-system/speech-sessions
  │    → session_seq 획득
  │
  ├─ 3. 녹음 시작 (별도 스레드)
  │    AudioRecorder.start() → .wav 파일 실시간 기록
  │
  ├─ 4. 실시간 STT 시작 (별도 스레드)
  │    StreamProcessor.start() → 오디오 청크 → 텍스트
  │    │
  │    ├─ 일반 텍스트 → 자막 표시 + speech_log 저장
  │    │   POST /ai-system/speech-logs
  │    │
  │    └─ 키워드 매칭 → Voice Detect 실행
  │        POST /ai-system/commands/execute
  │
  ▼ 교사 "강의종료" 클릭
  │
  ├─ 5. 녹음 중지 → .wav 파일 완성
  │
  ├─ 6. 세션 종료
  │    PUT /ai-system/speech-sessions/{seq}/end
  │
  ├─ 7. 강의요약 레코드 생성
  │    POST /ai-system/lecture-summaries
  │    → summary_seq + job_id 획득
  │
  ├─ 8. ku_ai_worker에 .wav 청크 업로드 (비동기)
  │    POST /api/upload/init (callback_url 포함)
  │    PUT  /api/upload/{id}/chunk × N
  │    POST /api/upload/{id}/complete
  │
  ├─ 9. 상태 변경
  │    PUT /ai-system/lecture-summaries/{seq}/status → PROCESSING
  │
  └─ 10. 업로드 완료 후 .wav 삭제 (DELETE_AFTER_UPLOAD=true)
  │
  ▼
[대기 상태] → 다음 강의 대기
```

---

## 7. 모듈 상세 설계

### 7-1. recorder (마이크 녹음)

녹음 모듈은 교사가 **명시적으로 시작/정지를 제어**하는 구조입니다.
UI에서 녹음 상태가 시각적으로 명확히 구분되어야 하며, 실수로 강의 녹음이 누락되거나 중복 시작되는 것을 방지해야 합니다.

#### 녹음 제어 UI/UX 요구사항

```
┌─────────────────────────────────────────────────────────────┐
│                    KU Wave - 강의 녹음                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [대기 상태]                                                 │
│  ┌──────────────────────┐                                   │
│  │   🎤 강의 시작        │  ← 큰 버튼, 녹색 배경             │
│  │   (클릭하여 녹음 시작) │                                   │
│  └──────────────────────┘                                   │
│                                                             │
│  [녹음 중 상태]                                              │
│  ┌──────────────────────┐                                   │
│  │   ⏹ 강의 종료         │  ← 큰 버튼, 빨간색 배경           │
│  │   녹음 중 01:23:45    │  ← 경과 시간 실시간 표시           │
│  └──────────────────────┘                                   │
│                                                             │
│  ● REC  실시간 음성 레벨 ████████░░░░  ← 오디오 레벨 미터    │
│  📝 자막: "데이터구조의 기본 개념을..."  ← 실시간 STT 자막    │
│  ⚡ 마지막 명령: "스크린 올려" (0.97)    ← Voice Detect 상태  │
│                                                             │
│  [상태 표시줄]                                               │
│  🟢 서버 연결  │  🟢 AI Worker  │  🎤 마이크 정상            │
└─────────────────────────────────────────────────────────────┘
```

**UI 상태 전이**:

| 상태 | 버튼 | 배경색 | 표시 정보 |
|------|------|--------|----------|
| **대기** | `🎤 강의 시작` | 녹색 (#22c55e) | 서버 연결 상태, 마이크 상태 |
| **녹음 중** | `⏹ 강의 종료` | 빨간색 (#ef4444) | 경과 시간, 오디오 레벨, 실시간 자막, 명령 로그 |
| **업로드 중** | 비활성 (스피너) | 회색 | 업로드 진행률 (%, 청크 N/M) |
| **완료** | `🎤 강의 시작` | 녹색 | 이전 강의 요약 (업로드 완료 알림) |

**오동작 방지**:
- 녹음 중 `강의 시작` 버튼 비활성화 (중복 시작 방지)
- `강의 종료` 클릭 시 확인 다이얼로그 표시 ("강의를 종료하시겠습니까?")
- 녹음 중 프로그램 종료 시도 시 경고 ("녹음이 진행 중입니다. 종료하시겠습니까?")
- 마이크 연결 해제 시 즉시 알림 표시 + 재연결 대기

```python
# audio_recorder.py 핵심 인터페이스

class RecordingState(Enum):
    IDLE = "idle"              # 대기 중
    RECORDING = "recording"    # 녹음 중
    UPLOADING = "uploading"    # 업로드 중
    ERROR = "error"            # 오류

class AudioRecorder:
    """pyaudio 기반 WAV 녹음기"""

    def __init__(self, config: AudioConfig):
        self.sample_rate = 16000      # Whisper 권장
        self.channels = 1             # 모노
        self.format = pyaudio.paInt16 # 16bit
        self.chunk_size = 1024        # 버퍼 크기
        self.state = RecordingState.IDLE
        self.elapsed_sec = 0          # 경과 시간
        self.audio_level = 0.0        # 오디오 레벨 (0.0 ~ 1.0)

    def start(self, filepath: str) -> None:
        """녹음 시작 (별도 스레드) — UI에서 '강의 시작' 버튼 클릭 시 호출"""
        if self.state == RecordingState.RECORDING:
            raise RuntimeError("이미 녹음 중입니다")
        self.state = RecordingState.RECORDING

    def stop(self) -> str:
        """녹음 중지 → .wav 파일 경로 반환 — UI에서 '강의 종료' 버튼 클릭 시 호출"""
        if self.state != RecordingState.RECORDING:
            raise RuntimeError("녹음 중이 아닙니다")
        self.state = RecordingState.IDLE

    def get_stream(self) -> Generator[bytes, None, None]:
        """실시간 오디오 스트림 (STT 모듈 연동)"""

    def get_audio_level(self) -> float:
        """현재 오디오 입력 레벨 반환 (UI 레벨 미터 연동, 0.0~1.0)"""

    def get_elapsed_time(self) -> int:
        """녹음 경과 시간 (초) — UI 타이머 연동"""
```

**디스크 용량 관리**:
```
16kHz × 16bit × mono = 32KB/s = ~115MB/시간
3시간 강의 = ~345MB
128GB HDD → 약 300강의 저장 가능 (삭제 안 할 경우)
업로드 후 즉시 삭제 → 항상 여유
```

### 7-2. stt (실시간 STT)

```python
# stt_engine.py 핵심 인터페이스

class SttEngine:
    """faster-whisper CPU 모드 래퍼"""

    def __init__(self, model: str = "tiny", device: str = "cpu"):
        self.model = WhisperModel(
            model,
            device="cpu",
            compute_type="int8"   # CPU 최적화 (float32 대비 4배 빠름)
        )

    def transcribe_chunk(self, audio_chunk: np.ndarray) -> SttResult:
        """오디오 청크 → 텍스트 변환"""
        segments, info = self.model.transcribe(
            audio_chunk,
            language="ko",
            beam_size=1,          # CPU 환경: beam=1이 가장 빠름
            vad_filter=True       # 무음 구간 자동 스킵
        )
        return SttResult(
            text=...,
            confidence=...,
            start_sec=...,
            end_sec=...
        )
```

**CPU 최적화 설정**:

| 설정 | 값 | 이유 |
|------|-----|------|
| `compute_type` | `int8` | CPU에서 float32 대비 ~4배 빠름 |
| `beam_size` | `1` | CPU에서 beam=5는 5배 느림 |
| `vad_filter` | `True` | 무음 구간 스킵으로 처리량 감소 |
| `language` | `"ko"` | 언어 감지 건너뜀 → 속도 향상 |
| 청크 단위 | `5초` | 너무 길면 지연, 너무 짧으면 컨텍스트 부족 |

### 7-3. voice_detect (음성명령 감지)

음성명령 감지 모듈은 STT 텍스트를 실시간으로 분석하여 키워드를 매칭합니다.
**개발/운영 시 디버깅을 위해 콘솔 로그에 마이크 음성 데이터와 STT 처리 과정을 실시간으로 출력**해야 합니다.

#### 콘솔 로그 모니터링 설계

운영자가 터미널에서 miniPC의 동작 상태를 실시간으로 확인할 수 있어야 합니다.

**로그 출력 예시**:
```
[2026-03-18 09:00:01] [AUDIO] 🎤 Level: ████████░░ (0.78) | Chunk #1 (5.0s)
[2026-03-18 09:00:01] [STT]   📝 "오늘 수업에서는 데이터구조를" | conf: 0.82 | 1.2s~4.8s
[2026-03-18 09:00:06] [AUDIO] 🎤 Level: ██████████ (0.95) | Chunk #2 (5.0s)
[2026-03-18 09:00:07] [STT]   📝 "스크린 올려주세요" | conf: 0.91 | 5.1s~7.3s
[2026-03-18 09:00:07] [VOICE] ⚡ MATCH "스크린 올려" → keyword: "스크린 올려" | score: 0.95
[2026-03-18 09:00:07] [VOICE] ✅ EXECUTE → device: 전동스크린 | action: UP | result: OK
[2026-03-18 09:00:12] [AUDIO] 🎤 Level: ░░░░░░░░░░ (0.03) | Chunk #3 (5.0s) [무음]
[2026-03-18 09:00:12] [STT]   ⏭️ VAD skip (무음 구간)
[2026-03-18 09:00:17] [AUDIO] 🎤 Level: ███████░░░ (0.65) | Chunk #4 (5.0s)
[2026-03-18 09:00:18] [STT]   📝 "연결리스트의 장점은" | conf: 0.88 | 12.5s~16.1s
[2026-03-18 09:00:18] [VOICE] 🔍 NO_MATCH "연결리스트의 장점은" → best: "리스트 보여줘" (0.32)
```

**로그 레벨별 출력 항목**:

| 레벨 | 태그 | 출력 내용 | LOG_LEVEL |
|------|------|----------|-----------|
| `AUDIO` | 🎤 | 오디오 입력 레벨 (시각적 바), 청크 번호, 무음 감지 | DEBUG |
| `STT` | 📝 | STT 변환 결과 텍스트, 신뢰도, 시간 구간, VAD 스킵 | INFO |
| `VOICE` | ⚡/✅/❌ | 키워드 매칭 결과, 실행 결과, 매칭 실패 (best score) | INFO |
| `API` | 🔗 | ku_wave_plat API 호출 결과, 응답 시간 | DEBUG |
| `UPLOAD` | 📤 | 청크 업로드 진행, 완료, 실패 | INFO |
| `SYSTEM` | 🔧 | 서버 연결 상태, 모델 로드, 설정 변경 | INFO |

```python
# core/logger.py — 구조화 로깅 설정

from loguru import logger
import sys

def setup_logger(log_level: str = "INFO", log_dir: str = "./logs"):
    """콘솔 + 파일 로깅 설정"""

    # 콘솔 출력 (색상 + 실시간 모니터링용)
    logger.add(
        sys.stderr,
        level=log_level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> "
               "[<level>{extra[tag]}</level>] "
               "{message}",
        colorize=True,
    )

    # 파일 출력 (일별 로테이션, 7일 보관)
    logger.add(
        f"{log_dir}/minipc_{{time:YYYY-MM-DD}}.log",
        level="DEBUG",          # 파일은 항상 DEBUG 레벨
        rotation="00:00",       # 자정마다 새 파일
        retention="7 days",     # 7일 보관
        compression="gz",       # 압축
    )


# 사용 예시 (각 모듈에서)

# recorder 모듈
logger.bind(tag="AUDIO").debug(
    "🎤 Level: {bar} ({level:.2f}) | Chunk #{num} ({dur}s){silence}",
    bar=level_bar, level=audio_level, num=chunk_num, dur=chunk_duration,
    silence=" [무음]" if is_silent else ""
)

# stt 모듈
logger.bind(tag="STT").info(
    '📝 "{text}" | conf: {conf:.2f} | {start:.1f}s~{end:.1f}s',
    text=result.text, conf=result.confidence, start=result.start_sec, end=result.end_sec
)

# voice_detect 모듈
logger.bind(tag="VOICE").info(
    '⚡ MATCH "{text}" → keyword: "{kw}" | score: {score:.2f}',
    text=recognized, kw=matched_keyword, score=match_score
)
logger.bind(tag="VOICE").info(
    '✅ EXECUTE → device: {dev} | action: {act} | result: {res}',
    dev=device_name, act=action, res=result
)
```

**오디오 레벨 시각화 함수**:
```python
def audio_level_bar(level: float, width: int = 10) -> str:
    """0.0~1.0 레벨을 시각적 바로 변환"""
    filled = int(level * width)
    return "█" * filled + "░" * (width - filled)

# 출력: ████████░░ (0.78)
```

**LOG_LEVEL 운영 가이드**:
- `DEBUG`: 개발/디버깅 시 — 모든 오디오 청크, API 요청/응답 포함
- `INFO`: 일반 운영 시 — STT 결과, 명령 매칭/실행, 업로드 상태
- `WARNING`: 최소 운영 시 — 오류, 재시도, 연결 끊김만 표시

```python
# command_matcher.py 핵심 인터페이스

class CommandMatcher:
    """STT 텍스트에서 음성명령 키워드 매칭"""

    def __init__(self, min_confidence: float = 0.85):
        self.commands: list[VoiceCommand] = []    # 캐싱된 명령어 사전
        self.cooldown_sec = 3                      # 연속 실행 방지

    def load_commands(self, space_seq: int) -> None:
        """ku_wave_plat에서 명령어 사전 로드"""
        # GET /ai-system/voice-commands?spaceSeq={space_seq}

    def match(self, text: str) -> MatchResult | None:
        """텍스트에서 키워드 매칭 (fuzzy match)"""
        # 1. 정확 매칭 (keyword, aliases)
        # 2. 유사도 매칭 (difflib.SequenceMatcher)
        # 3. min_confidence 이상이면 MatchResult 반환
        # 4. 매칭 결과를 콘솔 로그에 출력 (MATCH / NO_MATCH)
```

**매칭 전략**:
```
STT 텍스트: "스크린 좀 올려주세요"

1단계: 정확 매칭
  "스크린 올려" in text → 매칭!
  aliases: ["화면 올려", "스크린 업"] → 체크

2단계: 유사도 매칭 (정확 매칭 실패 시)
  "스크린 올려" vs "스크린 좀 올려주세요" → 유사도 0.72
  threshold 0.85 이상만 실행

3단계: 쿨다운 체크
  마지막 실행 후 3초 이내 → 무시 (중복 방지)

* 모든 단계의 결과가 콘솔 로그에 실시간 출력됨
```

### 7-4. uploader (파일 업로드)

```python
# chunk_uploader.py 핵심 인터페이스

class ChunkUploader:
    """ku_ai_worker에 .wav 청크 업로드"""

    def __init__(self, worker_url: str, api_key: str):
        self.worker_url = worker_url
        self.api_key = api_key
        self.chunk_size = 100 * 1024 * 1024  # 100MB

    async def upload(self, filepath: str, callback_url: str) -> UploadResult:
        """
        1. POST /api/upload/init → upload_id 획득
        2. PUT  /api/upload/{id}/chunk/{n} × N회
        3. POST /api/upload/{id}/complete → job_id 획득
        """

    async def _upload_chunk(self, upload_id: str, chunk_num: int, data: bytes):
        """단일 청크 업로드 (재시도 포함)"""
```

**오프라인 큐 (네트워크 장애 대응)**:
```
네트워크 장애 발생
  │
  ├─ 녹음: 계속 (로컬 저장)
  ├─ 실시간 STT: 계속 (로컬 CPU)
  ├─ Voice Detect: 불가 (ku_wave_plat 통신 필요)
  ├─ 업로드: offline_queue에 보관
  │
  ▼ 네트워크 복구
  │
  └─ offline_queue에서 순차 업로드 재시도
     + 밀린 speech_log 일괄 전송
```

### 7-5. api_client (API 클라이언트)

```python
# wave_plat_client.py — ku_wave_plat 통신

class WavePlatClient:
    """ku_wave_plat REST API 클라이언트"""

    def __init__(self, base_url: str):
        self.base_url = base_url
        self.token: str | None = None

    async def login(self, username: str, password: str) -> None:
        """POST /auth/login → JWT 토큰 획득"""

    async def refresh_token(self) -> None:
        """POST /auth/refresh → 토큰 자동 갱신"""

    # 음성인식 세션
    async def create_session(self, dto: CreateSessionDto) -> int:
        """POST /ai-system/speech-sessions → session_seq"""

    async def end_session(self, session_seq: int, dto: EndSessionDto) -> None:
        """PUT /ai-system/speech-sessions/{seq}/end"""

    # STT 로그
    async def save_speech_log(self, dto: SpeechLogDto) -> None:
        """POST /ai-system/speech-logs"""

    # Voice Detect
    async def execute_command(self, dto: ExecuteCommandDto) -> CommandResult:
        """POST /ai-system/commands/execute"""

    async def get_voice_commands(self, space_seq: int) -> list[VoiceCommand]:
        """GET /ai-system/voice-commands?spaceSeq={space_seq}"""

    # 강의요약
    async def create_lecture_summary(self, dto: CreateSummaryDto) -> int:
        """POST /ai-system/lecture-summaries → summary_seq"""

    async def update_summary_status(self, seq: int, status: str) -> None:
        """PUT /ai-system/lecture-summaries/{seq}/status"""


# ai_worker_client.py — ku_ai_worker 통신

class AiWorkerClient:
    """ku_ai_worker 업로드 API 클라이언트"""

    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url       # http://203.252.151.52:9000
        self.api_key = api_key

    async def init_upload(self, dto: InitUploadDto) -> str:
        """POST /api/upload/init → upload_id"""

    async def upload_chunk(self, upload_id: str, chunk_num: int, data: bytes) -> None:
        """PUT /api/upload/{upload_id}/chunk/{chunk_num}"""

    async def complete_upload(self, upload_id: str) -> str:
        """POST /api/upload/{upload_id}/complete → job_id"""

    async def check_health(self) -> HealthStatus:
        """GET /api/health"""
```

---

## 8. 의존성

### Python 패키지

```toml
[project]
name = "ku-mini-pc"
requires-python = ">=3.10"

[project.dependencies]
# 녹음
pyaudio = ">=0.2.14"

# STT
faster-whisper = ">=1.0.0"            # CPU 모드 지원
numpy = ">=1.24"

# HTTP
httpx = ">=0.27"                      # async HTTP 클라이언트
pydantic = ">=2.0"                    # 데이터 모델/검증
pydantic-settings = ">=2.0"           # 환경변수 로드

# UI (옵션)
# tkinter (Python 내장) 또는
# PyQt6 / PySide6

# 유틸리티
python-dotenv = ">=1.0"
loguru = ">=0.7"                      # 구조화 로깅
schedule = ">=1.2"                    # 주기적 작업 (헬스체크 등)

[project.optional-dependencies]
dev = [
    "pytest >= 8.0",
    "pytest-asyncio >= 0.23",
    "ruff >= 0.4",                    # 린터/포매터
]
```

### 시스템 의존성

| OS | 필요 패키지 | 비고 |
|----|------------|------|
| Ubuntu/Debian | `portaudio19-dev python3-dev` | pyaudio 빌드용 |
| Windows | 없음 (pip install pyaudio로 바이너리 설치) | |
| 공통 | Python 3.10+ | faster-whisper 최소 요구 |

---

## 9. 배포 전략

### 22대 동일 코드 배포

```
개발 PC
  │
  ├─ Git Push → GitHub (ku_mini_pc)
  │
  ▼ 배포 (Ansible 또는 수동)
  │
  ├─ miniPC-101 (1호실)  .env: ROOM_CODE=ROOM-101, SPACE_SEQ=1
  ├─ miniPC-102 (2호실)  .env: ROOM_CODE=ROOM-102, SPACE_SEQ=2
  ├─ miniPC-103 (3호실)  .env: ROOM_CODE=ROOM-103, SPACE_SEQ=3
  │   ...
  └─ miniPC-122 (22호실) .env: ROOM_CODE=ROOM-122, SPACE_SEQ=22
```

**호실별 차이점은 `.env` 파일만**:
- `ROOM_CODE`, `DEVICE_CODE`, `SPACE_SEQ`
- `WAVE_PLAT_URL` (각 호실 로컬 서버 IP)
- `CALLBACK_URL` (각 호실 ku_wave_plat 주소)

### 자동 시작 설정

**Linux (systemd)**:
```ini
[Unit]
Description=KU Mini PC Client
After=network.target

[Service]
Type=simple
User=ku
WorkingDirectory=/opt/ku_mini_pc
ExecStart=/opt/ku_mini_pc/.venv/bin/python main.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**Windows (서비스/시작프로그램)**:
```
시작 프로그램 폴더에 바로가기 등록
또는 NSSM으로 Windows 서비스 등록
```

---

## 10. 디스크 용량 관리

### 128GB HDD 예산

```
OS + Python + 모델:  ~15GB
  - OS:              ~10GB
  - Python 환경:     ~2GB
  - whisper tiny 모델: ~75MB
  - whisper base 모델: ~150MB

녹음 파일 (임시):     ~50GB (안전 마진)
  - 16kHz 16bit mono = ~115MB/시간
  - 3시간 강의 = ~345MB
  - 50GB ÷ 345MB = 약 145강의 보관 가능

로그:                 ~5GB
여유:                 ~58GB
```

### 자동 정리 정책

```python
# file_manager.py

class FileManager:
    MAX_RECORDING_AGE_DAYS = 3     # 업로드 완료 후 3일 보관
    MIN_FREE_SPACE_GB = 10         # 최소 여유 공간

    def cleanup(self):
        """주기적 실행 (매 시간)"""
        # 1. 업로드 완료 + 3일 경과 파일 삭제
        # 2. 여유 공간 < 10GB면 가장 오래된 파일부터 삭제
        # 3. 삭제 로그 기록
```

---

## 11. 장애 대응

### 시나리오별 동작

| 장애 상황 | 녹음 | 실시간 STT | Voice Detect | 업로드 | 대응 |
|-----------|------|-----------|-------------|--------|------|
| **네트워크 끊김** | 계속 | 계속 | **불가** | 큐 대기 | 복구 후 자동 재전송 |
| **ku_wave_plat 다운** | 계속 | 계속 | **불가** | 큐 대기 | speech_log 로컬 버퍼 |
| **ku_ai_worker 다운** | 계속 | 계속 | 계속 | **실패** | 재시도 3회 → 큐 보관 |
| **마이크 분리** | **중단** | 중단 | 중단 | - | 알림 표시 + 재연결 대기 |
| **디스크 부족** | **중단** | 계속 | 계속 | 긴급 업로드 | 오래된 파일 강제 삭제 |

### 핵심 원칙

> **어떤 서버가 죽어도 강의 녹음과 실시간 STT는 중단되지 않는다.**

---

## 12. 개발 환경 테스트 (로컬)

### 현재 테스트 환경

```
개발 PC (macOS)
├── ku_wave_plat: http://localhost:8000  (NestJS API 실행 중)
├── ku_ai_worker: http://203.252.151.52:9000  (GPU 서버 — 외부)
└── ku_mini_pc: 로컬 Python 실행 (마이크 없이 파일 입력 테스트 가능)
```

### 마이크 없이 테스트하는 방법

```python
# 실제 마이크 대신 .wav 파일을 입력으로 사용
python scripts/benchmark_stt.py --input sample.wav --model tiny
python scripts/test_upload.py --file sample.wav --worker-url http://203.252.151.52:9000
```

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| `docs/ai-system-architecture.md` | 전체 3서버 시스템 아키텍처 |
| `docs/api/ai-system.api.md` | ku_wave_plat AI API 스펙 (20개 엔드포인트) |
| `docs/ku-ai-worker-setup.md` | ku_ai_worker 설치/설정 가이드 |

---

## 변경 이력

| 일자 | 내용 | 작성자 |
|------|------|--------|
| 2026-03-18 | 초안 작성 — miniPC 전용 아키텍처 설계 | Claude Code |
|            | - i3 + 16GB + 128GB HDD + GPU 없음 기준 |  |
|            | - STT 모델 tiny/base 선정 (CPU 최적화) |  |
|            | - Python 프로젝트 구조 + 모듈 설계 |  |
|            | - 환경변수, 배포, 장애대응 포함 |  |
| 2026-03-18 | NOTE 반영 — 3건 상세 설계 추가 | Claude Code |
|            | - STT 모델 플러그인 구조 (Hot-Swap, Factory 패턴) |  |
|            | - 녹음 시작/정지 UI/UX 상세 (상태 전이, 오동작 방지) |  |
|            | - 콘솔 로그 실시간 모니터링 (오디오 레벨, STT, 명령 매칭) |  |
|            | - OS: Ubuntu 24.04 확정 |  |
