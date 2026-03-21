# API 계약 (REST API 엔드포인트)

> **프로젝트**: KU-WAVE-PLAT
> **생성일**: 2026-03-22
> **문서 유형**: BMAD API 계약

---

## 1. 개요

약 120개의 REST API 엔드포인트가 22개 모듈에 걸쳐 제공된다. 모든 엔드포인트는 `/api/v1` 프리픽스를 사용하며, Swagger 문서는 `/api/v1/docs`에서 확인할 수 있다.

### 공통 규칙

| 항목 | 설명 |
|------|------|
| 기본 인증 | Bearer JWT (JwtAuthGuard 글로벌 적용) |
| 인증 제외 | `@Public()` 데코레이터 적용 엔드포인트 |
| 응답 형식 | `{ success: true, data: <payload> }` |
| 에러 형식 | `{ success: false, statusCode, message, error, timestamp, path }` |
| 입력 검증 | class-validator (whitelist + forbidNonWhitelisted) |
| Rate Limit | 60초당 100회 (기본), 로그인은 5회/분 (Nginx) |

---

## 2. 모듈별 엔드포인트 요약

### 2.1 인증 (Auth)

**스펙 파일**: [`docs/api/auth.api.md`](./api/auth.api.md)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/auth/login` | Public | 로그인 (JWT 발급) |
| POST | `/auth/logout` | Bearer | 로그아웃 (Refresh Token 무효화) |
| POST | `/auth/refresh` | Refresh Token | Access Token 갱신 |
| GET | `/auth/me` | Bearer | 현재 사용자 정보 |

### 2.2 사용자 (Users)

**스펙 파일**: [`docs/api/users.api.md`](./api/users.api.md)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/users` | Bearer | 사용자 목록 (페이지네이션) |
| GET | `/users/:seq` | Bearer | 사용자 상세 |
| POST | `/users` | Bearer (admin) | 사용자 생성 |
| PUT | `/users/:seq` | Bearer (admin) | 사용자 수정 |
| DELETE | `/users/:seq` | Bearer (admin) | 사용자 삭제 (소프트) |

### 2.3 설정 (Settings)

**스펙 파일**: [`docs/api/settings.api.md`](./api/settings.api.md)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/settings` | Bearer | 시스템 설정 조회 |
| PUT | `/settings` | Bearer (admin) | 시스템 설정 수정 (multipart, 로고 포함) |

### 2.4 건물 (Buildings)

**스펙 파일**: [`docs/api/buildings.api.md`](./api/buildings.api.md)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/buildings` | Bearer | 건물 목록 |
| GET | `/buildings/:seq` | Bearer | 건물 상세 |
| POST | `/buildings` | Bearer (admin) | 건물 생성 |
| PUT | `/buildings/:seq` | Bearer (admin) | 건물 수정 |
| DELETE | `/buildings/:seq` | Bearer (admin) | 건물 삭제 |

### 2.5 공간 (Spaces)

**스펙 파일**: [`docs/api/spaces.api.md`](./api/spaces.api.md)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/spaces` | Bearer | 공간 목록 (건물 필터) |
| GET | `/spaces/:seq` | Bearer | 공간 상세 |
| POST | `/spaces` | Bearer (admin) | 공간 생성 |
| PUT | `/spaces/:seq` | Bearer (admin) | 공간 수정 |
| DELETE | `/spaces/:seq` | Bearer (admin) | 공간 삭제 |

### 2.6 메뉴 (Menus)

**스펙 파일**: [`docs/api/menus.api.md`](./api/menus.api.md)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/menus` | Bearer | 메뉴 트리 조회 |
| GET | `/menus/my` | Bearer | 현재 사용자 메뉴 |
| POST | `/menus` | Bearer (admin) | 메뉴 생성 |
| PUT | `/menus/:seq` | Bearer (admin) | 메뉴 수정 |
| DELETE | `/menus/:seq` | Bearer (admin) | 메뉴 삭제 |

### 2.7 권한 (Permissions)

**스펙 파일**: [`docs/api/permissions.api.md`](./api/permissions.api.md)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/permissions` | Bearer | 권한 목록 |
| PUT | `/permissions` | Bearer (admin) | 권한 설정 (사용자-메뉴 매핑) |

**관련**: [`docs/api/employee-grant.api.md`](./api/employee-grant.api.md)

### 2.8 활동 로그 (Activity Logs)

**스펙 파일**: [`docs/api/activity-logs.api.md`](./api/activity-logs.api.md)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/activity-logs` | Bearer | 활동 로그 목록 (페이지네이션, 필터) |
| GET | `/activity-logs/:seq` | Bearer | 활동 로그 상세 |

### 2.9 IoT 컨트롤러 (Controller)

**스펙 파일**: [`docs/api/controller.api.md`](./api/controller.api.md)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/controller/presets` | Bearer | 프리셋 목록 |
| POST | `/controller/presets` | Bearer | 프리셋 생성 |
| PUT | `/controller/presets/:seq` | Bearer | 프리셋 수정 |
| DELETE | `/controller/presets/:seq` | Bearer | 프리셋 삭제 |
| POST | `/controller/control` | Bearer | 디바이스 제어 명령 전송 |
| GET | `/controller/devices` | Bearer | 공간별 디바이스 목록 |
| POST | `/controller/devices` | Bearer | 디바이스 등록 |
| PUT | `/controller/devices/:seq` | Bearer | 디바이스 수정 |
| DELETE | `/controller/devices/:seq` | Bearer | 디바이스 삭제 |
| GET | `/controller/socket-commands` | Bearer | 소켓 명령 목록 |
| POST | `/controller/socket-commands` | Bearer | 소켓 명령 생성 |

### 2.10 NFC

**스펙 파일**: [`docs/api/nfc.api.md`](./api/nfc.api.md), [`docs/api/nfc-reader-commands.api.md`](./api/nfc-reader-commands.api.md)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/nfc/tag` | NfcApiKeyGuard | NFC 태깅 (M2M) |
| GET | `/nfc/readers` | Bearer | NFC 리더 목록 |
| POST | `/nfc/readers` | Bearer | NFC 리더 등록 |
| PUT | `/nfc/readers/:seq` | Bearer | NFC 리더 수정 |
| DELETE | `/nfc/readers/:seq` | Bearer | NFC 리더 삭제 |
| GET | `/nfc/cards` | Bearer | NFC 카드 목록 |
| POST | `/nfc/cards` | Bearer | NFC 카드 등록 |
| PUT | `/nfc/cards/:seq` | Bearer | NFC 카드 수정 |
| DELETE | `/nfc/cards/:seq` | Bearer | NFC 카드 삭제 |
| GET | `/nfc/logs` | Bearer | NFC 태깅 로그 |
| GET | `/nfc/reader-commands` | Bearer | 리더 명령 목록 |
| POST | `/nfc/reader-commands` | Bearer | 리더 명령 생성 |

### 2.11 녹화 (Recorders)

**스펙 파일**: [`docs/api/recorder.api.md`](./api/recorder.api.md)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/recorders` | Bearer | 녹화기 목록 |
| GET | `/recorders/:seq` | Bearer | 녹화기 상세 |
| POST | `/recorders` | Bearer | 녹화기 등록 |
| PUT | `/recorders/:seq` | Bearer | 녹화기 수정 |
| DELETE | `/recorders/:seq` | Bearer | 녹화기 삭제 |
| POST | `/recorders/:seq/record/start` | Bearer | 녹화 시작 |
| POST | `/recorders/:seq/record/stop` | Bearer | 녹화 중지 |
| POST | `/recorders/:seq/ptz` | Bearer | PTZ 제어 |
| GET | `/recorders/:seq/presets` | Bearer | PTZ 프리셋 목록 |
| POST | `/recorders/:seq/presets` | Bearer | PTZ 프리셋 저장 |
| GET | `/recorders/:seq/status` | Bearer | 녹화기 상태 조회 |
| GET | `/recordings/sessions` | Bearer | 녹화 세션 이력 |
| GET | `/recordings/files` | Bearer | 녹화 파일 목록 |
| GET | `/ftp/config` | Bearer | FTP 설정 조회 |
| PUT | `/ftp/config` | Bearer | FTP 설정 수정 |

### 2.12 플레이어/디스플레이 (Players)

**스펙 파일**: [`docs/api/player.api.md`](./api/player.api.md), [`docs/api/player-file-list.api.md`](./api/player-file-list.api.md)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/players` | Bearer | 플레이어 목록 |
| GET | `/players/:seq` | Bearer | 플레이어 상세 |
| POST | `/players/register` | PlayerApiKeyGuard | 플레이어 자체등록 (M2M) |
| PUT | `/players/:seq/approve` | Bearer (admin) | 플레이어 승인 |
| PUT | `/players/:seq` | Bearer | 플레이어 수정 |
| DELETE | `/players/:seq` | Bearer | 플레이어 삭제 |
| GET | `/playlists` | Bearer | 플레이리스트 목록 |
| POST | `/playlists` | Bearer | 플레이리스트 생성 |
| PUT | `/playlists/:seq` | Bearer | 플레이리스트 수정 |
| DELETE | `/playlists/:seq` | Bearer | 플레이리스트 삭제 |
| GET | `/contents` | Bearer | 콘텐츠 목록 |
| POST | `/contents` | Bearer | 콘텐츠 등록 (multipart) |
| PUT | `/contents/:seq` | Bearer | 콘텐츠 수정 |
| DELETE | `/contents/:seq` | Bearer | 콘텐츠 삭제 |
| GET | `/content-approvals` | Bearer | 승인 대기 목록 |
| PUT | `/content-approvals/:seq` | Bearer (admin) | 콘텐츠 승인/거부 |
| GET | `/player-groups` | Bearer | 플레이어 그룹 목록 |
| POST | `/player-groups` | Bearer | 그룹 생성 |
| GET | `/play-logs` | Bearer | 재생 로그 |

### 2.13 AI 시스템

**스펙 파일**: [`docs/api/ai-system.api.md`](./api/ai-system.api.md)

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/ai-system/workers` | Bearer | AI Worker 서버 목록 |
| POST | `/ai-system/workers` | Bearer | Worker 서버 등록 |
| PUT | `/ai-system/workers/:seq` | Bearer | Worker 서버 수정 |
| DELETE | `/ai-system/workers/:seq` | Bearer | Worker 서버 삭제 |
| GET | `/ai-system/voice-commands` | Bearer | 음성 명령 목록 |
| POST | `/ai-system/voice-commands` | Bearer | 음성 명령 등록 |
| GET | `/ai-system/speech-sessions` | Bearer | 음성 인식 세션 목록 |
| GET | `/ai-system/lecture-summaries` | Bearer | 강의 요약 목록 |
| POST | `/ai-system/ai/callback` | CallbackGuard (HMAC) | AI Worker 콜백 (M2M) |

### 2.14 대시보드

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/dashboard/stats` | Bearer | 전체 통계 |
| GET | `/dashboard/charts` | Bearer | 차트 데이터 |

### 2.15 헬스체크

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/health` | Public | 서버 헬스체크 |

---

## 3. 인증 유형별 분류

### Public (인증 불필요)

- `POST /auth/login`
- `GET /health`

### Bearer JWT (사용자 인증)

- 위에 나열된 대부분의 엔드포인트

### M2M 인증 (기기 간)

| 엔드포인트 | Guard | 인증 방식 |
|-----------|-------|----------|
| `POST /nfc/tag` | NfcApiKeyGuard | X-API-Key 헤더 |
| `POST /players/register` | PlayerApiKeyGuard | API 키 |
| `POST /ai-system/ai/callback` | CallbackGuard | HMAC 서명 |

---

## 4. 상세 스펙 파일 인덱스

모든 엔드포인트의 상세 요청/응답 스키마는 개별 API 스펙 파일에서 확인할 수 있다.

| 스펙 파일 | 도메인 |
|-----------|--------|
| [`docs/api/auth.api.md`](./api/auth.api.md) | 인증 |
| [`docs/api/users.api.md`](./api/users.api.md) | 사용자 |
| [`docs/api/settings.api.md`](./api/settings.api.md) | 설정 |
| [`docs/api/buildings.api.md`](./api/buildings.api.md) | 건물 |
| [`docs/api/spaces.api.md`](./api/spaces.api.md) | 공간 |
| [`docs/api/menus.api.md`](./api/menus.api.md) | 메뉴 |
| [`docs/api/permissions.api.md`](./api/permissions.api.md) | 권한 |
| [`docs/api/employee-grant.api.md`](./api/employee-grant.api.md) | 직원 권한 |
| [`docs/api/activity-logs.api.md`](./api/activity-logs.api.md) | 활동 로그 |
| [`docs/api/controller.api.md`](./api/controller.api.md) | IoT 컨트롤러 |
| [`docs/api/nfc.api.md`](./api/nfc.api.md) | NFC |
| [`docs/api/nfc-reader-commands.api.md`](./api/nfc-reader-commands.api.md) | NFC 리더 명령 |
| [`docs/api/recorder.api.md`](./api/recorder.api.md) | 녹화 |
| [`docs/api/player.api.md`](./api/player.api.md) | 플레이어 |
| [`docs/api/player-file-list.api.md`](./api/player-file-list.api.md) | 플레이어 파일 |
| [`docs/api/ai-system.api.md`](./api/ai-system.api.md) | AI 시스템 |

---

## 5. Swagger

운영 및 개발 환경에서 Swagger UI를 통해 API를 인터랙티브하게 테스트할 수 있다.

| 환경 | URL |
|------|-----|
| 개발 | `http://localhost:8000/api/v1/docs` |
| 운영 | `http://<서버IP>/api/v1/docs` |
