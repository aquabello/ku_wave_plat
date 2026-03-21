# 통합 아키텍처

> **프로젝트**: KU-WAVE-PLAT
> **생성일**: 2026-03-22
> **문서 유형**: BMAD 통합 아키텍처

---

## 1. 개요

KU-WAVE-PLAT은 3개의 내부 앱과 다수의 외부 시스템이 REST API, WebSocket, TCP 소켓, FTP 등 다양한 프로토콜로 통신한다. 이 문서는 시스템 간 연결 구조와 데이터 흐름을 기술한다.

---

## 2. 전체 통합 다이어그램

```
┌─────────────────────────────────────────────────────────────────────┐
│                         운영 서버 (Ubuntu 24.04)                      │
│                                                                     │
│  ┌──────────┐   HTTP :80    ┌──────────────────────────────────┐   │
│  │  Nginx   │──────────────▶│                                  │   │
│  │ (Reverse │               │         API Server               │   │
│  │  Proxy)  │               │        (NestJS :8000)            │   │
│  └────┬─────┘               │                                  │   │
│       │                     │  ┌─────────┐  ┌──────────────┐  │   │
│       │ /:3000              │  │ REST API │  │ WebSocket    │  │   │
│  ┌────▼─────┐               │  │ /api/v1  │  │ (socket.io)  │  │   │
│  │ Console  │◀─ REST/WS ──▶│  └─────────┘  └──────────────┘  │   │
│  │ (Next.js)│               │  ┌─────────┐  ┌──────────────┐  │   │
│  └──────────┘               │  │ TCP :9090│  │ TCP :6060    │  │   │
│                             │  │ IoT 제어  │  │ 녹화기 제어   │  │   │
│  ┌──────────┐               │  └─────────┘  └──────────────┘  │   │
│  │ NFC Agent│── M2M REST ──▶│                                  │   │
│  │ (Node.js)│── WebSocket ─▶│  ┌─────────────────────────┐    │   │
│  └──────────┘               │  │ TypeORM → MariaDB :3306  │    │   │
│                             │  └─────────────────────────┘    │   │
│                             └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
         │              │                │               │
         │              │                │               │
    ┌────▼────┐   ┌─────▼─────┐   ┌─────▼─────┐  ┌─────▼──────┐
    │ 관리자   │   │ ku_ai_pc  │   │ IoT 장치   │  │ FTP 서버   │
    │ 브라우저  │   │(강의실 PC) │   │(컨트롤러)  │  │ (녹화 파일) │
    └─────────┘   └───────────┘   └───────────┘  └────────────┘
```

---

## 3. 통신 채널 상세

### 3.1 Console → API (REST API)

| 항목 | 상세 |
|------|------|
| 프로토콜 | HTTP/HTTPS |
| 클라이언트 | ofetch (lib/api/client.ts) |
| 인증 | Bearer JWT (Access Token) |
| Base URL | `NEXT_PUBLIC_API_URL` (`http://<서버IP>/api/v1`) |
| 엔드포인트 | ~120개 |

**데이터 흐름**:
```
Console (브라우저)
  │
  ├─ ofetch 요청 (Authorization: Bearer <JWT>)
  │
  ▼
Nginx (:80)
  │
  ├─ /api/* → API Server (:8000)
  ├─ /uploads/* → API Server (정적 파일)
  └─ /* → Console (:3000)
```

### 3.2 Console → API (WebSocket)

| 항목 | 상세 |
|------|------|
| 프로토콜 | WebSocket (socket.io) |
| 인증 | JWT handshake (WsJwtGuard) |
| 용도 | 실시간 상태 업데이트 |

**이벤트 채널**:

| 이벤트 | 방향 | 용도 |
|--------|------|------|
| `recorder:status` | API → Console | 녹화기 상태 변경 알림 |
| `nfc:tagged` | API → Console | NFC 태깅 실시간 알림 |
| `controller:response` | API → Console | IoT 제어 응답 |
| `player:heartbeat` | API → Console | 플레이어 상태 |

### 3.3 NFC Agent → API (REST API, M2M)

| 항목 | 상세 |
|------|------|
| 프로토콜 | HTTP |
| 클라이언트 | ofetch (src/api-client.ts) |
| 인증 | X-API-Key 헤더 (NfcApiKeyGuard) |
| 엔드포인트 | `POST /api/v1/nfc/tag` |
| 헬스체크 | `GET /api/v1/health` (30초 주기) |

**데이터 흐름**:
```
ACR122U 리더 → NFC Agent → POST /api/v1/nfc/tag
                  │              │
                  │         X-API-Key: <key>
                  │              │
                  │              ▼
                  │         NfcApiKeyGuard 검증
                  │              │
                  │              ▼
                  │         tb_nfc_log 기록
                  │
                  └─ 실패 시 → 오프라인 큐 → 재시도
```

### 3.4 NFC Agent → Console (WebSocket)

| 항목 | 상세 |
|------|------|
| 프로토콜 | WebSocket |
| 서버 | NFC Agent 자체 WS 서버 |
| 용도 | 태깅 이벤트 실시간 브로드캐스트 |

### 3.5 API → IoT 컨트롤러 (TCP 소켓)

| 항목 | 상세 |
|------|------|
| 프로토콜 | TCP |
| 포트 | 9090 |
| 방향 | API → IoT 장치 |
| 용도 | 조명, 에어컨, 프로젝터, 스크린 등 제어 |

**통신 흐름**:
```
Console UI
  │ (REST API)
  ▼
API Server
  │ (TCP :9090)
  ▼
IoT 컨트롤러
  │
  ├─ 조명 ON/OFF
  ├─ 에어컨 온도 설정
  ├─ 프로젝터 전원
  └─ 스크린 업/다운
```

### 3.6 API → 녹화기 (TCP 소켓)

| 항목 | 상세 |
|------|------|
| 프로토콜 | TCP |
| 포트 | 6060 |
| 방향 | 양방향 |
| 용도 | ONVIF 녹화기 제어 (녹화 시작/중지, PTZ) |

### 3.7 API → FTP 서버 (파일 전송)

| 항목 | 상세 |
|------|------|
| 프로토콜 | FTP / SFTP / FTPS |
| 라이브러리 | basic-ftp, ssh2-sftp-client |
| 방향 | API → FTP 서버 (업로드) |
| 용도 | 녹화 파일 업로드 |
| 스케줄 | ScheduleModule 기반 Job |

**업로드 흐름**:
```
녹화 완료 → tb_recording_file (ftp_status: pending)
  │
  ▼
FTP 업로드 Job (스케줄)
  │
  ├─ tb_ftp_config에서 설정 로드
  ├─ FTP/SFTP/FTPS 연결
  ├─ 파일 업로드
  └─ tb_recording_file (ftp_status: completed)
```

### 3.8 ku_ai_pc → API (REST API)

| 항목 | 상세 |
|------|------|
| 프로토콜 | HTTP |
| 클라이언트 | httpx (Python) |
| 인증 | JWT (username/password 로그인) |
| 용도 | STT 결과 전송, 음성 명령 매칭 |

### 3.9 API → AI Worker → API (콜백)

| 항목 | 상세 |
|------|------|
| 프로토콜 | HTTP |
| 인증 | HMAC 서명 (CallbackGuard) |
| 방향 | API → AI Worker → API (콜백) |
| 용도 | 강의 요약 생성, 음성 분석 |

**콜백 흐름**:
```
API Server ─────────── 작업 요청 ──────────▶ AI Worker (GPU)
                                                  │
                                             처리 완료
                                                  │
API Server ◀── POST /ai-system/ai/callback ───────┘
                   (HMAC 서명 검증)
```

### 3.10 플레이어 → API (M2M)

| 항목 | 상세 |
|------|------|
| 프로토콜 | HTTP |
| 인증 | PlayerApiKeyGuard (API 키) |
| 용도 | 자체등록, 하트비트, 플레이리스트 수신 |

---

## 4. 인증 매트릭스

| 통신 | 인증 방식 | Guard |
|------|----------|-------|
| 관리자 → API | JWT Bearer Token | JwtAuthGuard (글로벌) |
| Console → API WS | JWT handshake | WsJwtGuard |
| NFC Agent → API | X-API-Key | NfcApiKeyGuard |
| Player → API | API 키 | PlayerApiKeyGuard |
| AI Worker → API | HMAC 서명 | CallbackGuard |
| ku_ai_pc → API | JWT (로그인 후) | JwtAuthGuard |

---

## 5. 공유 타입 시스템

`@ku/types` 패키지가 3개 앱 간의 타입 일관성을 보장한다.

```
@ku/types (packages/types)
  │
  ├─ apps/api ──── import { User, Building, ... } from '@ku/types'
  ├─ apps/console ─ import { User, Building, ... } from '@ku/types'
  └─ apps/nfc ──── import { NfcTag, ... } from '@ku/types'
```

`@ku/contracts` (Zod 스키마)는 API 서버에서 Single Source of Truth로 사용된다.

```
@ku/contracts (packages/contracts)
  │
  └─ apps/api ──── import { CreateUserSchema } from '@ku/contracts'
```

---

## 6. 네트워크 토폴로지

### 포트 구성

| 서비스 | 포트 | 프로토콜 | 외부 접근 | 비고 |
|--------|------|----------|----------|------|
| Nginx | 80 | HTTP | O | 진입점 |
| API | 8000 | HTTP | X (Nginx 경유) | NestJS |
| Console | 3000 | HTTP | X (Nginx 경유) | Next.js |
| MariaDB | 3306 | MySQL | O | 외부 DB 툴 |
| IoT 컨트롤러 | 9090 | TCP | 내부 | 디바이스 제어 |
| 녹화기 | 6060 | TCP | 내부 | ONVIF 제어 |
| SSH | 22 | SSH | O | 서버 관리 |

### 방화벽 규칙 (UFW)

```
외부 허용: 22 (SSH), 80 (HTTP), 3306 (MariaDB)
기본 정책: deny incoming, allow outgoing
```

---

## 7. 데이터 흐름 시나리오

### 시나리오 1: NFC 출입 태깅

```
1. NFC 카드 태깅 → ACR122U 리더
2. NFC Agent가 카드 UID 읽기
3. POST /api/v1/nfc/tag (X-API-Key 인증)
4. API가 tb_nfc_card에서 카드 조회
5. tb_nfc_log에 태깅 기록
6. WebSocket으로 Console에 실시간 알림
7. NFC Agent 버저로 성공/실패 사운드
```

### 시나리오 2: 녹화 시작 → 파일 업로드

```
1. 관리자가 Console에서 녹화 시작 버튼 클릭
2. POST /api/v1/recorders/:seq/record/start (JWT)
3. API가 TCP :6060으로 녹화기에 시작 명령
4. 녹화기 녹화 진행
5. WebSocket으로 Console에 상태 업데이트 (5초 폴링)
6. 관리자가 녹화 중지
7. tb_recording_session, tb_recording_file 기록
8. FTP 업로드 Job이 파일을 FTP 서버로 전송
9. tb_recording_file.ftp_status 업데이트
```

### 시나리오 3: AI 강의 요약

```
1. ku_ai_pc에서 음성 녹음 (마이크)
2. faster-whisper로 실시간 STT
3. STT 결과를 API로 전송 (JWT)
4. API가 AI Worker에 요약 요청
5. AI Worker가 GPU에서 요약 생성
6. POST /ai-system/ai/callback (HMAC 검증)
7. tb_ai_lecture_summary에 결과 저장
8. Console에서 강의 요약 조회
```

### 시나리오 4: IoT 디바이스 제어

```
1. 관리자가 Console에서 프리셋 실행
2. POST /api/v1/controller/control (JWT)
3. API가 tb_preset_command에서 명령 로드
4. TCP :9090으로 IoT 컨트롤러에 명령 전송
5. 컨트롤러가 디바이스 제어 (조명, 에어컨 등)
6. 응답을 WebSocket으로 Console에 전달
7. tb_control_log에 기록
```
