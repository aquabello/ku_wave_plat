# AI 실시간 음성인식 시스템 설계서

> 실시간 음성인식(STT) + 음성 명령어 제어 + 강의요약 통합 시스템
>
> 작성일: 2026-02-19 | 관련문서: `docs/ai-system-architecture.md` (강의요약 상세)

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [기술 스택 결정](#2-기술-스택-결정)
3. [인프라 현황](#3-인프라-현황)
4. [전체 아키텍처](#4-전체-아키텍처)
5. [실시간 음성인식 상세](#5-실시간-음성인식-상세)
6. [음성 명령어 상세](#6-음성-명령어-상세)
7. [강의요약 연동](#7-강의요약-연동)
8. [DB 설계](#8-db-설계)
9. [API 설계](#9-api-설계)
10. [메뉴 구조](#10-메뉴-구조)
11. [FE 개발 업무](#11-fe-개발-업무)
12. [BE 개발 업무](#12-be-개발-업무)
13. [ku_ai_worker 개발 업무](#13-ku_ai_worker-개발-업무)
14. [미니PC 에이전트 개발 업무](#14-미니pc-에이전트-개발-업무)
15. [보안 및 운영](#15-보안-및-운영)

---

## 1. 시스템 개요

### 배경

- 건국대학교 22개 강의실에 미니PC + 마이크 설치 완료
- 중앙 GPU 서버 1대 운영 (ku_ai_worker)
- 교수 강의 중 **실시간 자막 표시** + **음성 명령으로 장비 제어** 필요
- 강의 녹음 파일 **자동 요약** 기능 필요

### 핵심 기능 3가지

```
┌─────────────────────────────────────────────────────────┐
│                    AI 시스템 (3대 기능)                    │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ ① 실시간    │  │ ② 음성      │  │ ③ 강의      │      │
│  │   음성인식   │  │   명령제어   │  │   요약       │      │
│  │             │  │             │  │             │      │
│  │ 교수 발화 → │  │ "스크린올려" │  │ .wav 파일 → │      │
│  │ 실시간 자막  │  │ → 장비 제어  │  │ STT + 요약   │      │
│  │             │  │             │  │             │      │
│  │ 수업 중 상시 │  │ 수업 중 상시 │  │ 수업 후 배치 │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
│                                                           │
│  LNB: 실시간 음성인식        LNB: 강의요약                  │
│  경로: /ai-system/speech     경로: /ai-system/lecture-summary│
└─────────────────────────────────────────────────────────┘
```

---

## 2. 기술 스택 결정

### STT 엔진 비교 (Vosk 탈락 근거)

```
정확도 비교 (한국어, 동일 음성 샘플 기준):

Vosk (vosk-model-ko)          ████████░░░░░░░░░░░░  ~70-75%
whisper.cpp base (CPU)         █████████████░░░░░░░  ~83-85%
Faster-Whisper small (GPU)     ████████████████████░  ~88-90%  ← 실시간용
Faster-Whisper medium (GPU)    █████████████████████  ~92%
Faster-Whisper large-v3 (GPU)  ██████████████████████ ~95%     ← 요약용
```

### 최종 결정: Faster-Whisper (GPU 중심)

| 용도 | 엔진 | 모델 | 위치 | 정확도 |
|------|------|------|------|--------|
| **실시간 STT** | Faster-Whisper | `small` | GPU 서버 | ~90% |
| **강의요약 STT** | Faster-Whisper | `large-v3` | GPU 서버 | ~95% |
| **텍스트 요약** | Ollama | `llama3` | GPU 서버 | - |
| **음성 감지 (VAD)** | Silero-VAD | - | GPU 서버 | - |

### GPU 시간 분리 전략 (Option A 채택)

```
시간대별 GPU 사용 계획:
━━━━━━━━━━━━━━━━━━━━━

  09:00 ─────────────── 18:00 ─────────────── 09:00
  │     수업 시간 (주간)      │   비수업 시간 (야간)   │
  │                           │                       │
  │  ┌───────────────────┐   │  ┌─────────────────┐  │
  │  │ 실시간 STT 전용    │   │  │ 강의요약 배치    │  │
  │  │                   │   │  │                 │  │
  │  │ Faster-Whisper    │   │  │ Whisper large-v3│  │
  │  │ small (~1GB VRAM) │   │  │ (~3GB VRAM)     │  │
  │  │                   │   │  │ +               │  │
  │  │ 12~16개 동시 스트림│   │  │ Ollama llama3   │  │
  │  │                   │   │  │ (~7GB VRAM)     │  │
  │  └───────────────────┘   │  └─────────────────┘  │
  │                           │                       │
  │  VRAM 사용: ~2-3GB       │  VRAM 사용: ~10GB     │
  │  ✅ 충분한 여유           │  ✅ 12GB 내 소화      │
  │                           │                       │

  💡 수업 중 요약 요청 → 큐에 적재 → 야간에 순차 처리
  💡 빈 강의실 시간대에는 틈틈이 요약 처리도 가능
```

---

## 3. 인프라 현황

### GPU 서버 (ku_ai_worker) - 중앙 1대

```
┌─────────────────────────────────────┐
│  GPU 서버 (ku_ai_worker)             │
│                                     │
│  CPU:  8~16코어                      │
│  RAM:  32~64GB                      │
│  GPU:  RTX 4070 (12GB VRAM)         │
│  Disk: 500GB~1TB NVMe SSD          │
│  Net:  1Gbps                        │
│  OS:   Ubuntu + Docker              │
│                                     │
│  실행 서비스:                         │
│  ├── FastAPI (REST + WebSocket)     │
│  ├── Faster-Whisper (STT)           │
│  ├── Silero-VAD (음성감지)           │
│  ├── Ollama (텍스트 요약)            │
│  └── Job Queue (SQLite)             │
└─────────────────────────────────────┘
```

### 미니PC (각 호실) - 22대

```
┌─────────────────────────────────────┐
│  미니PC × 22대 (각 강의실)            │
│                                     │
│  CPU:  Intel i3 (4코어)              │
│  RAM:  8GB                          │
│  Disk: 100GB                        │
│  Net:  ~50Mbps (교내 유선)           │
│  OS:   Ubuntu                       │
│                                     │
│  실행 서비스:                         │
│  ├── ku_wave_agent (Python)         │
│  │   ├── 마이크 캡처 (PyAudio)      │
│  │   ├── 오디오 스트리밍 (WebSocket) │
│  │   ├── WAV 녹음 (동시)            │
│  │   └── 명령 수신 → 실행           │
│  └── systemd 서비스 (자동 시작)      │
│                                     │
│  ⚠️ STT는 미니PC에서 안 돌림        │
│     → 오디오만 GPU 서버로 전송       │
└─────────────────────────────────────┘
```

### 네트워크 대역폭

```
오디오 스트리밍 (PCM 16kHz mono 16bit → Opus 압축):

  1개 스트림: ~4KB/s (32kbps)
  22개 동시:  ~88KB/s (704kbps) ≈ 0.7Mbps

  미니PC 50Mbps 대역폭 대비: 0.06% 사용 → 여유 충분
  GPU 서버 1Gbps 대비: 0.07% 사용 → 여유 충분
```

---

## 4. 전체 아키텍처

### 시스템 구성도

```
╔═════════════════════════════════════════════════════════════════╗
║                  강의실 (22개)                                    ║
║                                                                 ║
║  ┌────────────────────────────────────────────────┐            ║
║  │ 미니PC (ku_wave_agent)                          │            ║
║  │                                                │            ║
║  │  🎤 마이크 ──→ PyAudio 캡처                     │            ║
║  │                    │                            │            ║
║  │        ┌───────────┼────────────┐              │            ║
║  │        │           │            │              │            ║
║  │        ▼           ▼            ▼              │            ║
║  │  WebSocket    WAV 녹음     명령 실행            │            ║
║  │  스트리밍      (로컬저장)   (수신대기)            │            ║
║  │     │              │            ▲              │            ║
║  └─────┼──────────────┼────────────┼──────────────┘            ║
║        │              │            │                            ║
╚════════╪══════════════╪════════════╪════════════════════════════╝
         │              │            │
         │ 오디오       │ .wav       │ 명령 결과
         │ 스트림       │ 업로드     │
         ▼              ▼            │
╔════════════════════════════════════╪════════════════════════════╗
║  NestJS API 서버                    │                            ║
║  (ku_wave_plat/apps/api)           │                            ║
║                                     │                            ║
║  ┌──────────────────────┐          │                            ║
║  │  SpeechGateway        │          │                            ║
║  │  (WebSocket)          │          │                            ║
║  │                       │          │                            ║
║  │  ① 오디오 수신        │          │                            ║
║  │  ② GPU 서버로 중계    │──────────┼──→ ku_ai_worker            ║
║  │  ③ STT 결과 수신   ←──┼──────────┼──← (WebSocket)            ║
║  │  ④ 키워드 매칭        │          │                            ║
║  │  ⑤ Console 브로드캐스트│          │                            ║
║  │  ⑥ 명령 실행 ────────┼──────────┘                            ║
║  │  ⑦ DB 로그 저장       │                                      ║
║  └──────────────────────┘                                      ║
║                                                                 ║
║  ┌──────────────────────┐  ┌──────────────────────┐           ║
║  │  REST API             │  │  ControlService      │           ║
║  │  - 세션 관리          │  │  (기존 재활용)        │           ║
║  │  - 명령어 매핑 CRUD   │  │  - TCP/UDP 명령 전송  │           ║
║  │  - 강의요약 조회      │  │  - 제어 로그 기록     │           ║
║  └──────────────────────┘  └──────────────────────┘           ║
╚═════════════════════════════════════════════════════════════════╝
         │                            │
         │ 모니터링                    │ 장비 제어
         ▼                            ▼
╔═══════════════════╗    ┌──────────────────────┐
║  Console (Next.js) ║    │  강의실 장비            │
║  (관리자 브라우저)  ║    │  - 프로젝터             │
║                    ║    │  - 스크린               │
║  실시간 자막 모니터 ║    │  - 조명                 │
║  명령 실행 로그     ║    │  - 녹화 장비            │
║  강의요약 결과      ║    │  - 기타 (TCP/UDP/WOL)  │
╚═══════════════════╝    └──────────────────────┘
```

### 데이터 흐름

```
실시간 STT 흐름:
━━━━━━━━━━━━━━━

  마이크 → 미니PC (캡처) → WebSocket → NestJS → WebSocket → ku_ai_worker
                                                                   │
                                                            Faster-Whisper
                                                            + Silero-VAD
                                                                   │
  Console (자막표시) ← WebSocket ← NestJS ← WebSocket ← STT 텍스트


음성 명령 흐름:
━━━━━━━━━━━━━━

  STT 텍스트 → NestJS (KeywordMatcher)
                  │
                  ├── 매칭 성공 → ControlService.execute()
                  │                    │
                  │                    ├── TCP/UDP → 장비 제어
                  │                    └── tb_control_log 기록
                  │
                  ├── tb_ai_command_log 기록
                  └── Console에 명령 실행 알림


강의요약 흐름:
━━━━━━━━━━━━━

  미니PC (WAV) → 청크업로드 → ku_ai_worker → Whisper → Ollama → 결과
                                    │
                              NestJS (동기화) → tb_ai_lecture_summary
                                    │
                              Console (조회)
```

---

## 5. 실시간 음성인식 상세

### WebSocket 통신 프로토콜

```
미니PC (ku_wave_agent)          NestJS (SpeechGateway)          ku_ai_worker
━━━━━━━━━━━━━━━━━━━━          ━━━━━━━━━━━━━━━━━━━━          ━━━━━━━━━━━━

① 세션 시작
   speech:start ──────────→ 세션 생성 (DB)
   { space_seq: 5,            │
     tu_seq: 12 }             │
                               │
   ←──────────────────── speech:started
   { session_seq: 100,        ├──────────→ stt:connect
     space_name: "101호" }     │            { session_id: 100 }

② 오디오 스트리밍 (반복)
   speech:audio ──────────→ 중계 ──────────→ stt:audio
   { audio: <PCM Buffer> }    │            { audio: <Buffer> }
   (16kHz, mono, 16bit)       │
                               │            Silero-VAD 감지
                               │            + Faster-Whisper 처리
                               │
                               │  ←──────── stt:result
                               │            { text: "오늘 강의는...",
                               │              confidence: 0.91,
                               │              is_final: true }
                               │
   ←──────────── speech:text   │
   { text: "오늘 강의는...",    ├──→ Console (broadcast)
     confidence: 0.91 }        │
                               │
                               ├──→ 키워드 매칭 체크
                               ├──→ tb_ai_speech_log 저장

③ 명령어 감지 시
                               │  키워드 "스크린올려" 매칭!
                               │
                               ├──→ ControlService.execute()
                               │         │
                               │         └──→ 스크린 장비 TCP 전송
                               │
   ←──────────── speech:command │──→ Console
   { keyword: "스크린올려",     │
     device: "101호 스크린",    │
     status: "EXECUTED" }      │

④ 세션 종료
   speech:stop ───────────→ 세션 종료 (DB)
   { session_seq: 100 }       │
                               ├──────────→ stt:disconnect
   ←──────────── speech:ended  │
   { duration_sec: 5400 }     │
                               │
                               └──→ WAV 파일 자동 요약 요청 (선택)
```

### 오디오 스트리밍 사양

```
오디오 포맷:
  샘플링 레이트: 16,000 Hz (16kHz)
  비트 깊이:     16bit
  채널:          모노 (1ch)
  청크 크기:     4,096 samples (256ms)

전송 방식:
  프로토콜:      WebSocket (binary frame)
  압축:          Opus (선택, 대역폭 절약 시)
  전송 주기:     256ms마다 1청크

데이터량:
  RAW PCM:  32KB/s = 256kbps
  Opus:     4KB/s = 32kbps
```

---

## 6. 음성 명령어 상세

### 명령어 매핑 구조

```
tb_ai_voice_command (음성 명령어 매핑):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  공간: 101호 (space_seq: 5)
  ┌────────────────┬──────────────────┬─────────────────────┬──────────┐
  │ 키워드          │ 별칭 (aliases)    │ 대상 장비 → 명령     │ 임계값   │
  ├────────────────┼──────────────────┼─────────────────────┼──────────┤
  │ 녹화시작        │ 녹화 시작         │ 녹화PC → REC START  │ 0.80     │
  │                │ 레코딩 시작       │                     │          │
  ├────────────────┼──────────────────┼─────────────────────┼──────────┤
  │ 녹화정지        │ 녹화 정지         │ 녹화PC → REC STOP   │ 0.80     │
  │                │ 녹화 중지         │                     │          │
  │                │ 레코딩 스탑       │                     │          │
  ├────────────────┼──────────────────┼─────────────────────┼──────────┤
  │ 스크린올려      │ 스크린 올려       │ 스크린 → SCREEN UP  │ 0.85     │
  │                │ 스크린 올려줘     │                     │          │
  ├────────────────┼──────────────────┼─────────────────────┼──────────┤
  │ 스크린내려      │ 스크린 내려       │ 스크린 → SCREEN DOWN│ 0.85     │
  │                │ 스크린 내려줘     │                     │          │
  ├────────────────┼──────────────────┼─────────────────────┼──────────┤
  │ 불켜           │ 조명 켜          │ 조명 → LIGHT ON     │ 0.85     │
  │                │ 불 켜줘          │                     │          │
  ├────────────────┼──────────────────┼─────────────────────┼──────────┤
  │ 불꺼           │ 조명 꺼          │ 조명 → LIGHT OFF    │ 0.85     │
  │                │ 불 꺼줘          │                     │          │
  └────────────────┴──────────────────┴─────────────────────┴──────────┘

  ※ 기존 tb_space_device + tb_preset_command 재활용
  ※ NFC 태깅 → 장비제어와 동일한 ControlService.execute() 호출
```

### 키워드 매칭 알고리즘

```
STT 텍스트: "스크린 좀 올려주세요"
                │
                ▼
  ┌─────────────────────────────────┐
  │ STEP 1: 정규화                   │
  │ 공백/조사 제거 → "스크린올려주세요" │
  └─────────┬───────────────────────┘
            │
            ▼
  ┌─────────────────────────────────┐
  │ STEP 2: 정확 매칭               │
  │ "스크린올려주세요" == "스크린올려"? │
  │ → NO                           │
  └─────────┬───────────────────────┘
            │
            ▼
  ┌─────────────────────────────────┐
  │ STEP 3: 별칭(aliases) 매칭      │
  │ aliases 중 "스크린 올려줘" 있음   │
  │ "스크린올려주세요" ≈ "스크린올려줘"│
  │ → Levenshtein distance = 2     │
  │ → 유사도 0.87 ✅               │
  └─────────┬───────────────────────┘
            │
            ▼
  ┌─────────────────────────────────┐
  │ STEP 4: 포함 매칭 (fallback)    │
  │ "스크린올려" ⊂ "스크린올려주세요" │
  │ → 포함됨 ✅                     │
  └─────────┬───────────────────────┘
            │
            ▼
  ┌─────────────────────────────────┐
  │ 최종 판정                        │
  │ score: 0.87 ≥ min_confidence 0.85│
  │ → ✅ 명령 실행                   │
  └─────────────────────────────────┘
```

### 기존 컨트롤러 시스템 재활용

```
음성 명령 ──→ KeywordMatcher ──→ ControlService.execute()
                                       │
NFC 태깅  ──→ NfcService ─────→ ControlService.execute()  ← 동일!
                                       │
Console   ──→ ControlController ──→ ControlService.execute()  ← 동일!
                                       │
                                       ▼
                                 tb_control_log (공통 로그)
                                 trigger_type:
                                   'MANUAL'  ← Console
                                   'NFC'     ← NFC 태깅
                                   'VOICE'   ← 음성 명령 (신규 추가)
```

> **참고**: `tb_control_log.trigger_type`에 `'VOICE'` 값 추가 필요 (ALTER TABLE)

---

## 7. 강의요약 연동

### 실시간 STT → 강의요약 자동 연결

```
교수가 강의 시작
    │
    ├── 실시간 STT 세션 시작 (tb_ai_speech_session)
    │   └── 자막 표시 + 명령어 인식
    │
    └── 동시에 WAV 녹음 시작 (미니PC 로컬)
        └── lecture_20260219_0900.wav

교수가 강의 종료
    │
    ├── 실시간 STT 세션 종료
    │   └── 세션 통계 저장 (duration, 명령 횟수 등)
    │
    └── WAV 녹음 완료 (~1.5GB)
        │
        ▼
    자동으로 ku_ai_worker에 업로드 요청
    (기존 청크 업로드 프로토콜 사용)
        │
        ▼
    tb_ai_lecture_summary 자동 등록
    (process_status: 'UPLOADING')
        │
        ▼
    야간에 GPU로 요약 처리
    → 다음날 아침 결과 확인
```

### 기존 강의요약 아키텍처와의 관계

```
  기존 설계 (ai-system-architecture.md)       이번 설계 (추가)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━           ━━━━━━━━━━━━━━━━

  ku_ai_worker:                               ku_ai_worker:
  ├── REST API (청크 업로드)     ← 유지        ├── WebSocket API (실시간 STT) ← 신규
  ├── Job Queue (배치 처리)     ← 유지        │
  ├── Whisper large-v3 (STT)   ← 유지        ├── Faster-Whisper small       ← 신규
  ├── Ollama (요약)            ← 유지        │   (실시간 전용)
  └── 결과 전달                 ← 유지        └── Silero-VAD                ← 신규

  NestJS API:                                 NestJS API:
  ├── 강의요약 조회 API         ← 유지        ├── SpeechGateway (WebSocket)  ← 신규
  │                                           ├── KeywordMatcher             ← 신규
  │                                           ├── 음성명령 CRUD API          ← 신규
  │                                           └── 세션 관리 API              ← 신규

  Console:                                    Console:
  ├── 강의요약 페이지           ← 신규        ├── 실시간 음성인식 페이지       ← 신규
  │   /ai-system/lecture-summary              │   /ai-system/speech
  │                                           ├── 음성 명령 설정 페이지       ← 신규
  │                                           │   /ai-system/speech/commands
```

---

## 8. DB 설계

### ERD

```
                        tb_users (기존)
                            │
              ┌─────────────┼─────────────────────┐
              │             │                     │
              ▼             ▼                     ▼
    tb_ai_speech_session  tb_ai_lecture_summary  tb_ai_voice_command
              │                                   │
    ┌─────────┼─────────┐                        │
    │         │         │                        │
    ▼         ▼         ▼                        │
 tb_ai_    tb_ai_    (Console                    │
 speech_   command_   모니터링)                    │
 log       log ───────────────────────────────────┘
              │
              ▼
    tb_control_log (기존, trigger_type='VOICE' 추가)
              │
              ▼
    tb_space_device → tb_preset_command (기존 장비제어)


  ※ tb_space 기준으로 공간별 데이터 관리
  ※ 기존 컨트롤러 테이블 재활용 (신규 테이블 생성 아님)
```

### 테이블 상세

#### 8-1. tb_ai_voice_command (음성 명령어 매핑)

```sql
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
```

#### 8-2. tb_ai_speech_session (음성인식 세션)

```sql
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
```

#### 8-3. tb_ai_speech_log (음성인식 로그)

```sql
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
```

#### 8-4. tb_ai_command_log (음성 명령 실행 로그)

```sql
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
```

#### 8-5. tb_ai_lecture_summary (강의요약 결과)

> 기존 설계 유지 (`docs/ai-system-architecture.md` 8장 참조)

```sql
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
```

#### 8-6. 기존 테이블 변경 (ALTER TABLE)

```sql
-- tb_control_log.trigger_type에 'VOICE' 추가
ALTER TABLE tb_control_log
  MODIFY COLUMN trigger_type ENUM('MANUAL','NFC','SCHEDULE','VOICE')
  DEFAULT 'MANUAL' NOT NULL COMMENT '트리거 유형';
```

#### 8-7. 메뉴 추가

```sql
-- AI시스템 > 실시간 음성인식 LNB 메뉴 추가
INSERT INTO tb_menu (menu_seq, menu_name, menu_code, menu_path, menu_type, parent_seq, menu_order)
VALUES (42, '실시간 음성인식', 'ai-speech', '/ai-system/speech', 'LNB', 4, 2);
```

---

## 9. API 설계

### 9-1. WebSocket API (실시간 STT)

| 네임스페이스 | 인증 | 설명 |
|-------------|------|------|
| `ws://api:8000/ws/speech` | JWT (handshake) | 실시간 음성인식 |

**클라이언트 → 서버 이벤트:**

| 이벤트 | 페이로드 | 설명 |
|--------|---------|------|
| `speech:start` | `{ space_seq, tu_seq? }` | 세션 시작 |
| `speech:audio` | `{ session_seq, audio: Buffer }` | 오디오 청크 (PCM 16kHz) |
| `speech:pause` | `{ session_seq }` | 일시정지 |
| `speech:resume` | `{ session_seq }` | 재개 |
| `speech:stop` | `{ session_seq }` | 세션 종료 |
| `monitor:join` | `{ space_seq }` | 강의실 모니터링 시작 |
| `monitor:leave` | `{ space_seq }` | 모니터링 종료 |

**서버 → 클라이언트 이벤트:**

| 이벤트 | 페이로드 | 설명 |
|--------|---------|------|
| `speech:started` | `{ session_seq, space_name }` | 세션 시작됨 |
| `speech:text` | `{ session_seq, text, confidence, is_final, timestamp }` | 인식 텍스트 |
| `speech:command` | `{ session_seq, keyword, device_name, command_name, status }` | 명령 실행 결과 |
| `speech:error` | `{ code, message }` | 에러 |
| `speech:ended` | `{ session_seq, duration_sec, total_segments }` | 세션 종료됨 |

### 9-2. REST API - 실시간 음성인식

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/ai/speech/sessions` | 세션 목록 |
| GET | `/api/v1/ai/speech/sessions/:seq` | 세션 상세 (로그 포함) |
| GET | `/api/v1/ai/speech/sessions/:seq/logs` | 세션 텍스트 로그 |
| GET | `/api/v1/ai/speech/sessions/:seq/commands` | 세션 명령 실행 로그 |
| DELETE | `/api/v1/ai/speech/sessions/:seq` | 세션 삭제 (소프트) |
| GET | `/api/v1/ai/speech/active` | 현재 활성 세션 목록 |

**세션 목록 쿼리 파라미터:**

```
GET /api/v1/ai/speech/sessions
  ?building_seq=1        건물 필터
  &space_seq=5           공간 필터
  &status=ENDED          상태 필터 (ACTIVE/PAUSED/ENDED)
  &start_date=2026-02-19 시작일
  &end_date=2026-02-19   종료일
  &page=1                페이지
  &limit=20              페이지 크기
```

### 9-3. REST API - 음성 명령어 매핑

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/ai/voice-commands` | 명령어 매핑 목록 |
| GET | `/api/v1/ai/voice-commands/:seq` | 명령어 매핑 상세 |
| POST | `/api/v1/ai/voice-commands` | 명령어 매핑 등록 |
| PUT | `/api/v1/ai/voice-commands/:seq` | 명령어 매핑 수정 |
| DELETE | `/api/v1/ai/voice-commands/:seq` | 명령어 매핑 삭제 |

**등록/수정 Request Body:**

```json
{
  "space_seq": 5,
  "keyword": "스크린올려",
  "keyword_aliases": ["스크린 올려", "스크린 올려줘", "스크린 업"],
  "space_device_seq": 10,
  "command_seq": 25,
  "min_confidence": 0.85
}
```

### 9-4. REST API - 강의요약

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/v1/ai/lecture-summaries` | 강의요약 목록 |
| GET | `/api/v1/ai/lecture-summaries/:seq` | 강의요약 상세 |
| POST | `/api/v1/ai/lecture-summaries/:seq/retry` | 실패건 재처리 |
| DELETE | `/api/v1/ai/lecture-summaries/:seq` | 삭제 (소프트) |

---

## 10. 메뉴 구조

### GNB + LNB 트리

```
AI시스템 (GNB, menu_seq=4)
├── 강의요약 (LNB, menu_seq=41)
│   경로: /ai-system/lecture-summary
│   아이콘: BookOpen
│
└── 실시간 음성인식 (LNB, menu_seq=42) ← 신규
    경로: /ai-system/speech
    아이콘: Mic

    하위 페이지 (라우트):
    ├── /ai-system/speech              메인 (활성 세션 대시보드)
    ├── /ai-system/speech/[seq]        세션 상세 (실시간 자막)
    └── /ai-system/speech/commands     음성 명령 설정
```

### 사이드바 아이콘 매핑 추가

```typescript
// apps/console/src/components/layout/sidebar.tsx
const LNB_ICONS: Record<string, LucideIcon> = {
  // ... 기존 ...
  'ai-lecture-summary': BookOpen,
  'ai-speech': Mic,                    // ← 신규 추가
};
```

---

## 11. FE 개발 업무

### 신규 페이지 목록

```
apps/console/src/app/(dashboard)/ai-system/
├── speech/                              ← 신규 디렉토리
│   ├── page.tsx                         메인: 활성 세션 대시보드
│   ├── [seq]/
│   │   └── page.tsx                     세션 상세: 실시간 자막 뷰
│   └── commands/
│       └── page.tsx                     음성 명령어 매핑 관리
│
└── lecture-summary/                     ← 신규 디렉토리
    ├── page.tsx                         강의요약 목록
    └── [seq]/
        └── page.tsx                     강의요약 상세
```

### FE 태스크 체크리스트

```
공통:
━━━━
□ packages/types/src/ai-speech.types.ts    공유 타입 정의
□ packages/types/src/ai-lecture.types.ts   공유 타입 정의
□ packages/types/src/index.ts              export 추가
□ apps/console/src/lib/api/ai.ts           API 클라이언트
□ sidebar.tsx LNB_ICONS에 'ai-speech': Mic 추가

실시간 음성인식 - 메인 (/ai-system/speech):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ 활성 세션 카드 그리드 (강의실별 LIVE 상태)
   ┌──────────────┬──────────────┬──────────────┐
   │ 101호 [LIVE] │ 102호 [LIVE] │ 103호 [IDLE] │
   │ 김교수       │ 이교수        │              │
   │ "오늘은..."  │ "화학의..."   │ 세션 없음     │
   └──────────────┴──────────────┴──────────────┘
□ 건물/공간 필터
□ 세션 이력 테이블 (ended 세션 목록)
□ WebSocket 연결 훅 (useAiSpeechSocket)

실시간 음성인식 - 세션 상세 (/ai-system/speech/[seq]):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ 실시간 자막 패널 (자동 스크롤, 타임스탬프)
   ┌─────────────────────────────────────┐
   │ 09:01:23  오늘 강의에서는 자료구조의  │
   │ 09:01:28  기본 개념에 대해 다루겠습니다│
   │ 09:01:35  먼저 배열부터 시작하겠습니다 │
   │ 09:02:01  ▌ (실시간 입력 중...)       │
   └─────────────────────────────────────┘
□ 명령어 실행 로그 사이드패널
   ┌─────────────────────────────┐
   │ ✅ 09:05 스크린올려 → 성공   │
   │ ✅ 09:30 녹화시작 → 성공     │
   │ ❌ 09:45 불켜줘 → 매칭실패   │
   └─────────────────────────────┘
□ 세션 정보 헤더 (공간, 강의자, 시작시간, 상태)

음성 명령어 설정 (/ai-system/speech/commands):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ 공간 선택 드롭다운
□ 키워드 매핑 테이블 (CRUD)
   ┌────────┬──────────────┬──────────┬────────┬────┐
   │ 키워드  │ 별칭          │ 대상장비  │ 명령    │    │
   ├────────┼──────────────┼──────────┼────────┼────┤
   │녹화시작 │녹화 시작,     │녹화PC    │REC ON  │ ✏️ │
   │        │레코딩 시작    │          │        │    │
   ├────────┼──────────────┼──────────┼────────┼────┤
   │스크린올려│스크린 올려,   │스크린    │UP      │ ✏️ │
   │        │스크린 올려줘  │          │        │    │
   └────────┴──────────────┴──────────┴────────┴────┘
□ 매핑 등록/수정 다이얼로그
□ 장비 셀렉터 (tb_space_device 연동)
□ 명령 셀렉터 (tb_preset_command 연동)
□ 별칭 입력 UI (태그 형식)
□ 임계값(min_confidence) 슬라이더

강의요약 - 목록 (/ai-system/lecture-summary):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ 통계 카드 (전체/업로드중/처리중/완료/실패)
□ 요약 목록 테이블 (필터: 건물/공간/상태/날짜)
□ 상태 배지 (UPLOADING/PROCESSING/COMPLETED/FAILED)
□ 폴링 (useQuery refetchInterval: 30초)
□ 실패건 재처리 버튼

강의요약 - 상세 (/ai-system/lecture-summary/[seq]):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ 메타정보 (공간, 강의자, 녹음일시, 파일크기)
□ 탭: STT 전문 | 요약 | 키워드
□ STT 전문 뷰 (긴 텍스트 스크롤)
□ 요약 텍스트 뷰
□ 키워드 태그 표시
```

---

## 12. BE 개발 업무

### 모듈 구조

```
apps/api/src/modules/ai/
├── ai.module.ts                         AI 통합 모듈
│
├── speech/                              실시간 음성인식
│   ├── speech.module.ts
│   ├── speech.gateway.ts                WebSocket Gateway ⭐ 핵심
│   ├── speech.service.ts                세션 관리 서비스
│   ├── speech.controller.ts             REST API (세션 조회)
│   ├── keyword-matcher.service.ts       키워드 매칭 엔진 ⭐ 핵심
│   ├── dto/
│   │   ├── speech-session-query.dto.ts
│   │   └── speech-session-response.dto.ts
│   └── entities/
│       ├── tb-ai-speech-session.entity.ts
│       ├── tb-ai-speech-log.entity.ts
│       └── tb-ai-command-log.entity.ts
│
├── voice-commands/                      음성 명령어 매핑 관리
│   ├── voice-commands.module.ts
│   ├── voice-commands.controller.ts
│   ├── voice-commands.service.ts
│   ├── dto/
│   │   ├── create-voice-command.dto.ts
│   │   └── update-voice-command.dto.ts
│   └── entities/
│       └── tb-ai-voice-command.entity.ts
│
└── lecture-summary/                     강의요약
    ├── lecture-summary.module.ts
    ├── lecture-summary.controller.ts
    ├── lecture-summary.service.ts
    ├── dto/
    │   └── lecture-summary-query.dto.ts
    └── entities/
        └── tb-ai-lecture-summary.entity.ts
```

### BE 태스크 체크리스트

```
인프라 설정:
━━━━━━━━━━
□ pnpm --filter @ku/api add @nestjs/websockets @nestjs/platform-socket.io socket.io
□ WebSocket 어댑터 설정 (main.ts)
□ 환경변수 추가: AI_WORKER_WS_URL, AI_WORKER_API_URL
□ tb_control_log.trigger_type에 'VOICE' ALTER TABLE 실행

Entity 생성 (4개):
━━━━━━━━━━━━━━━━━
□ TbAiVoiceCommand       (tb_ai_voice_command)
□ TbAiSpeechSession      (tb_ai_speech_session)
□ TbAiSpeechLog          (tb_ai_speech_log)
□ TbAiCommandLog         (tb_ai_command_log)
□ TbAiLectureSummary     (tb_ai_lecture_summary)
□ TbControlLog 엔티티 trigger_type에 'VOICE' 추가

핵심 서비스:
━━━━━━━━━━
□ SpeechGateway (WebSocket) ⭐
  ├── handleStart()    세션 시작 + ku_ai_worker WS 연결
  ├── handleAudio()    오디오 중계 (미니PC → GPU)
  ├── handleSttResult() STT 결과 처리 (GPU → 클라이언트)
  ├── handlePause()    일시정지
  ├── handleResume()   재개
  ├── handleStop()     세션 종료
  ├── handleMonitorJoin()   모니터링 룸 조인
  └── handleMonitorLeave()  모니터링 룸 탈퇴

□ KeywordMatcherService ⭐
  ├── loadKeywords(spaceSeq)     공간별 키워드 로드 + 캐시
  ├── match(text, spaceSeq)      4단계 매칭 (정확→별칭→유사도→포함)
  ├── executeCommand(matchResult) ControlService.execute() 호출
  └── refreshCache(spaceSeq)     캐시 갱신

□ SpeechService
  ├── createSession()    세션 생성
  ├── endSession()       세션 종료 + 통계
  ├── getSessions()      세션 목록 (페이지네이션, 필터)
  ├── getSessionDetail() 세션 상세 (로그 포함)
  ├── getActiveSessions() 활성 세션 목록
  └── deleteSession()    소프트 삭제

REST API (3개 컨트롤러):
━━━━━━━━━━━━━━━━━━━━━━
□ SpeechController
  ├── GET  /ai/speech/sessions          세션 목록
  ├── GET  /ai/speech/sessions/:seq     세션 상세
  ├── GET  /ai/speech/sessions/:seq/logs 텍스트 로그
  ├── GET  /ai/speech/sessions/:seq/commands 명령 로그
  ├── DELETE /ai/speech/sessions/:seq   삭제
  └── GET  /ai/speech/active            활성 세션

□ VoiceCommandsController
  ├── GET    /ai/voice-commands         목록
  ├── GET    /ai/voice-commands/:seq    상세
  ├── POST   /ai/voice-commands         등록
  ├── PUT    /ai/voice-commands/:seq    수정
  └── DELETE /ai/voice-commands/:seq    삭제

□ LectureSummaryController
  ├── GET    /ai/lecture-summaries          목록
  ├── GET    /ai/lecture-summaries/:seq     상세
  ├── POST   /ai/lecture-summaries/:seq/retry 재처리
  └── DELETE /ai/lecture-summaries/:seq     삭제
```

---

## 13. ku_ai_worker 개발 업무

### 추가 개발 범위

```
기존 (유지):                         신규 (추가):
━━━━━━━━━━                          ━━━━━━━━━━

REST API:                            WebSocket API:
├── POST /api/upload/init            ├── ws://worker:8001/ws/stt  ⭐
├── PUT  /api/upload/{id}/chunk      │   ├── stt:connect
├── POST /api/upload/{id}/complete   │   ├── stt:audio (수신)
├── GET  /api/jobs/{id}/status       │   ├── stt:result (전송)
└── GET  /api/jobs/{id}/result       │   └── stt:disconnect
                                     │
배치 처리:                            실시간 처리:
├── Whisper large-v3 (STT)           ├── Faster-Whisper small ⭐
├── Ollama llama3 (요약)             ├── Silero-VAD ⭐
└── Job Queue (SQLite)               └── 스트리밍 파이프라인 ⭐
```

### ku_ai_worker 태스크

```
□ Faster-Whisper small 모델 로드 (실시간 전용)
□ Silero-VAD 통합 (음성 구간 감지)
□ WebSocket 엔드포인트 (/ws/stt) 구현
  ├── 오디오 수신 → VAD → 음성구간 축적 → Whisper 처리 → 결과 전송
  └── 다중 세션 동시 처리 (asyncio)
□ GPU 스케줄링 (실시간 vs 배치 시간 분리)
□ 모델 로드/언로드 스케줄러
  ├── 09:00 실시간 모델 로드
  └── 18:00 배치 모델 로드
□ 헬스체크 엔드포인트 (/health)
□ Docker 이미지 업데이트 (WebSocket + VAD 의존성)
```

### 실시간 STT 처리 파이프라인

```
오디오 청크 (256ms) 수신
         │
         ▼
┌─────────────────────┐
│ Silero-VAD           │
│ 음성/묵음 판단        │
└────┬────────────┬───┘
     │            │
   음성          묵음
     │            │
     ▼            ▼
  버퍼에 축적   버퍼에 음성 있으면?
     │            ├── YES → Whisper 처리
     │            └── NO  → skip
     │                │
     │                ▼
     │         ┌──────────────┐
     │         │ Faster-Whisper│
     │         │ .transcribe() │
     │         └──────┬───────┘
     │                │
     │                ▼
     │         결과 WebSocket 전송
     │         { text, confidence,
     │           start, end, is_final }
     │
     └── 버퍼 계속 축적 (최대 30초)
```

---

## 14. 미니PC 에이전트 개발 업무

### ku_wave_agent (Python)

```
ku_wave_agent/
├── agent.py                 메인 엔트리포인트
├── audio/
│   ├── capture.py           PyAudio 마이크 캡처
│   └── recorder.py          WAV 파일 녹음 (동시)
├── network/
│   ├── ws_client.py         NestJS WebSocket 클라이언트
│   └── uploader.py          WAV 청크 업로드 (강의요약용)
├── config.py                설정 (서버 URL, 공간 코드 등)
├── requirements.txt         의존성
├── install.sh               설치 스크립트
└── ku-wave-agent.service    systemd 서비스 파일
```

### 미니PC 에이전트 태스크

```
□ PyAudio 마이크 캡처 (16kHz, mono, 16bit)
□ WebSocket 클라이언트 (NestJS 연결)
  ├── speech:start 전송
  ├── speech:audio 전송 (256ms 주기)
  ├── speech:command 수신 → 로컬 알림
  └── 연결 끊김 시 자동 재연결
□ WAV 동시 녹음 (강의요약용 로컬 저장)
□ 강의 종료 시 WAV 자동 업로드 트리거
□ 설정 파일 (config.yaml)
  ├── api_url: NestJS API 주소
  ├── space_seq: 이 미니PC가 속한 공간
  ├── api_key: 인증 키
  └── audio_device: 마이크 장치 ID
□ systemd 서비스 등록 (부팅 시 자동 시작)
□ 22대 일괄 배포 스크립트 (Ansible 또는 SSH)
```

---

## 15. 보안 및 운영

### 인증 체계

```
Console (관리자)
  └── JWT 토큰 인증 (기존 auth 모듈)

미니PC (ku_wave_agent)
  └── API Key 인증 (공간별 발급)
      ※ tb_nfc_reader.reader_api_key 패턴 재활용
      ※ WebSocket handshake 시 api_key 검증

ku_ai_worker
  └── 내부 네트워크 통신 (방화벽)
      + 선택적 API Key
```

### 운영 모니터링

```
모니터링 항목:
━━━━━━━━━━━━

  GPU 서버:
  ├── GPU 사용률 / VRAM 사용량
  ├── 동시 STT 스트림 수
  ├── 배치 Job 큐 대기 수
  └── 디스크 사용량 (WAV 파일)

  미니PC:
  ├── 에이전트 프로세스 상태 (systemd)
  ├── WebSocket 연결 상태
  ├── 마이크 캡처 상태
  └── 로컬 디스크 사용량

  NestJS:
  ├── WebSocket 연결 수
  ├── 활성 세션 수
  └── 명령어 실행 성공/실패율
```

### 장애 대응

```
시나리오                      대응
━━━━━━━━━━━━━━━━━━━━━━━━━  ━━━━━━━━━━━━━━━━━━━━━━━
GPU 서버 다운               자막 중단, WAV 녹음은 로컬 계속
                            → 서버 복구 후 WAV 업로드로 요약

미니PC 네트워크 끊김         WebSocket 자동 재연결 (5초 간격)
                            WAV 녹음은 로컬 계속
                            → 복구 시 자동 재연결

NestJS 서버 다운             미니PC → GPU 직접 연결 불가
                            WAV 녹음은 로컬 계속
                            → Console 모니터링만 불가

동시 스트림 초과 (>15)       큐 대기 → 순서대로 처리
                            "잠시 후 자막이 표시됩니다" 메시지
```

---

## 변경 이력

| 일자 | 내용 | 작성자 |
|------|------|--------|
| 2026-02-19 | 초안 작성 - 실시간 음성인식 + 강의요약 통합 설계 | DB Architect |
| 2026-02-19 | Option A (GPU 시간분리) 채택, 하이브리드 → GPU 중심 전환 | DB Architect |
