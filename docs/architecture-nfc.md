# NFC Agent 아키텍처 (apps/nfc)

> **프로젝트**: KU-WAVE-PLAT
> **생성일**: 2026-03-22
> **문서 유형**: BMAD 아키텍처 문서 — NFC 에이전트

---

## 1. 개요

NFC Agent는 ACR122U USB 리더기를 통해 NFC 카드를 읽고, 백엔드 API로 태깅 데이터를 전송하는 Node.js 독립 프로세스이다. PM2 또는 systemd로 관리되며, 오프라인 큐와 자동 재연결 기능을 내장하고 있다.

---

## 2. 시스템 구조

```
┌─────────────────────────────────────────────┐
│              NFC Agent (apps/nfc)            │
│                                             │
│  ┌──────────┐    ┌──────────┐               │
│  │ ACR122U  │───▶│ reader   │               │
│  │ USB 리더  │    │ (nfc-pcsc)│              │
│  └──────────┘    └────┬─────┘               │
│                       │ 카드 감지            │
│                       ▼                     │
│              ┌────────────────┐             │
│              │   index.ts     │             │
│              │   (모드 선택)   │             │
│              └───┬────────┬───┘             │
│                  │        │                 │
│         tag 모드 │        │ aid-test 모드   │
│                  ▼        ▼                 │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ api-client   │  │ scan-aid     │        │
│  │ (ofetch)     │  │ (오프라인)    │        │
│  └──────┬───────┘  └──────────────┘        │
│         │                                   │
│    ┌────┴─────┐    ┌──────────┐            │
│    │ queue    │    │ ws-server │            │
│    │ (오프라인)│    │ (알림)    │            │
│    └──────────┘    └──────────┘            │
│                                             │
│  ┌──────────┐    ┌──────────┐              │
│  │ buzzer   │    │ logger   │              │
│  │ (비프음)  │    │ (로깅)   │              │
│  └──────────┘    └──────────┘              │
│                                             │
│  ┌──────────┐                              │
│  │ config   │                              │
│  │ (.env)   │                              │
│  └──────────┘                              │
└─────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
   ku_wave_plat API      WebSocket 클라이언트
   (NfcApiKeyGuard)      (Console 등)
```

---

## 3. 소스 파일 구조

| 파일 | 역할 |
|------|------|
| `index.ts` | 엔트리포인트. 모드 선택(tag/aid-test), 프로세스 관리, 시그널 핸들링 |
| `reader.ts` | NFC 리더 추상화. ACR122U 디바이스 연결, 카드 감지/읽기, 이벤트 발행 |
| `api-client.ts` | 백엔드 API 통신. ofetch 기반, NfcApiKeyGuard M2M 인증 (X-API-Key) |
| `buzzer.ts` | 비프음 제어. 성공/실패/오류 패턴별 다른 사운드 시퀀스 |
| `ws-server.ts` | WebSocket 서버. 실시간 태깅 이벤트 브로드캐스트 |
| `config.ts` | 환경변수 로드. dotenv 기반 설정 관리 |
| `logger.ts` | 로깅 유틸리티. 타임스탬프 + 레벨 기반 로깅 |
| `queue.ts` | 오프라인 큐. 네트워크 단절 시 태깅 데이터 버퍼링, 복구 시 재전송 |
| `tools/scan-aid.ts` | AID 테스트 모드. 오프라인 환경에서 카드 AID 스캔 도구 |

---

## 4. 동작 모드

### Tag 모드 (기본)

운영 환경에서 사용하는 기본 모드이다.

```
카드 태깅 → reader 감지 → api-client로 BE 전송 → buzzer 피드백
                                    │
                              실패 시 ↓
                           queue에 저장 → 주기적 재전송
```

**흐름**:
1. ACR122U 리더가 NFC 카드를 감지
2. 카드 UID/AID를 추출
3. `api-client`를 통해 백엔드 API에 태깅 데이터 전송
4. 성공/실패에 따라 `buzzer`로 사운드 피드백
5. `ws-server`를 통해 실시간 이벤트 브로드캐스트

### AID 테스트 모드

설치/디버깅 시 사용하는 오프라인 모드이다.

```
카드 태깅 → reader 감지 → AID 정보 콘솔 출력 (API 미사용)
```

**용도**:
- 새 NFC 카드의 AID 확인
- 리더기 동작 검증
- 네트워크 없이 카드 정보 확인

---

## 5. M2M 인증

NFC Agent는 사용자 JWT가 아닌 **API Key 기반 M2M 인증**을 사용한다.

```
NFC Agent                        API Server
    │                                │
    │  POST /api/v1/nfc/tag          │
    │  X-API-Key: <nfc_api_key>      │
    │  Body: { uid, reader_id }      │
    │──────────────────────────────▶ │
    │                                │
    │                    NfcApiKeyGuard
    │                    X-API-Key 검증
    │                                │
    │  200 OK / 401 Unauthorized     │
    │◀────────────────────────────── │
```

---

## 6. 오프라인 큐

네트워크 단절 시에도 태깅 데이터가 유실되지 않도록 오프라인 큐를 운영한다.

### 동작 원리

1. API 전송 실패 시 `queue`에 태깅 데이터 저장 (메모리 버퍼)
2. 30초 주기로 헬스체크 수행
3. 네트워크 복구 감지 시 큐의 데이터를 순차 전송
4. 전송 성공한 항목은 큐에서 제거

### 재연결 전략

```
네트워크 단절 감지
    │
    ├─ 태깅 데이터 → 오프라인 큐 저장
    │
    ├─ 30초 주기 헬스체크
    │   └─ GET /api/v1/health
    │
    ├─ 복구 감지
    │   └─ 큐 데이터 순차 전송 (FIFO)
    │
    └─ 전송 완료 → 큐 비움
```

---

## 7. WebSocket 서버

NFC Agent는 자체 WebSocket 서버를 운영하여 실시간 태깅 이벤트를 외부에 알린다.

**이벤트**:
- `card:tagged` — 카드 태깅 감지
- `card:success` — API 전송 성공
- `card:error` — API 전송 실패
- `reader:connected` — 리더 연결
- `reader:disconnected` — 리더 분리

---

## 8. 비프음 제어

ACR122U 리더의 내장 버저를 제어하여 태깅 결과를 사운드로 피드백한다.

| 패턴 | 설명 | 사운드 |
|------|------|--------|
| 성공 | API 전송 성공 | 짧은 단일 비프 |
| 실패 | 카드 미등록 등 | 이중 비프 |
| 오류 | 네트워크 오류 등 | 긴 비프 |

---

## 9. 프로세스 관리

### PM2 (운영 서버)

```javascript
// ecosystem.config.js
{
  name: 'ku-nfc',
  cwd: '/opt/ku_wave_plat/apps/nfc',
  script: 'dist/index.js',
  max_memory_restart: '256M',
  max_restarts: 10,
  restart_delay: 5000,
}
```

### 시그널 핸들링

- `SIGTERM`: 정상 종료 (큐 플러시 후 종료)
- `SIGINT`: 정상 종료
- 비정상 종료 시 PM2가 자동 재시작

---

## 10. 하드웨어 요구사항

| 항목 | 필수 |
|------|------|
| NFC 리더 | ACR122U USB |
| 시스템 패키지 | pcscd, libpcsclite-dev |
| USB 연결 | 직접 연결 (USB 허브 주의) |

### 리더 확인

```bash
# USB 장치 확인
lsusb | grep 072f

# pcscd 서비스 상태
systemctl status pcscd
```

---

## 11. 설정 (.env)

| 변수 | 필수 | 설명 |
|------|------|------|
| `API_URL` | Y | 백엔드 API URL (`http://<서버IP>/api/v1`) |
| `NFC_API_KEY` | Y | M2M 인증 API 키 |
| `READER_ID` | Y | 리더 식별자 |
| `MODE` | N | 동작 모드 (`tag` / `aid-test`, 기본: `tag`) |
| `WS_PORT` | N | WebSocket 서버 포트 |
| `LOG_LEVEL` | N | 로그 레벨 (`debug` / `info` / `warn` / `error`) |

---

## 12. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| NFC 리더 미감지 | USB 연결 불량, pcscd 미실행 | `lsusb`, `systemctl restart pcscd` |
| 태깅 후 API 전송 실패 | 네트워크 단절, API 키 불일치 | 로그 확인, .env의 NFC_API_KEY 검증 |
| 비프음 안 남 | 리더 버저 비활성화 | 리더 펌웨어 설정 확인 |
| 큐 데이터 유실 | 프로세스 강제 종료 | 메모리 큐 한계, 디스크 영속화 미지원 |
| 리더 재연결 안 됨 | USB 핫플러그 인식 실패 | `pm2 restart ku-nfc` |
