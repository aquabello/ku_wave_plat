# API 아키텍처 (apps/api)

> **프로젝트**: KU-WAVE-PLAT
> **생성일**: 2026-03-22
> **문서 유형**: BMAD 아키텍처 문서 — 백엔드

---

## 1. 개요

NestJS 10.3+ 기반의 RESTful API 서버로, 22개 도메인 모듈과 41개 TypeORM 엔티티를 포함한다. 포트 8000에서 구동되며, 모든 엔드포인트에 `/api/v1` 프리픽스를 사용한다.

---

## 2. 글로벌 아키텍처

### 요청 처리 파이프라인

```
HTTP 요청
  │
  ├─ Helmet (보안 헤더)
  ├─ CORS (화이트리스트)
  ├─ ThrottlerGuard (Rate Limiting)
  │
  ├─ ValidationPipe (글로벌)
  │   └─ whitelist: true, forbidNonWhitelisted: true, transform: true
  │
  ├─ JwtAuthGuard (APP_GUARD) ─── @Public() 으로 제외 가능
  │
  ├─ RolesGuard (라우트별) ─── @Roles('admin','manager') 데코레이터
  │
  ├─ ActivityLogInterceptor (APP_INTERCEPTOR)
  │   └─ 모든 요청/응답을 tb_activity_log에 기록, 민감 필드 마스킹
  │
  ├─ Controller → Service → Repository
  │
  ├─ TransformInterceptor (APP_INTERCEPTOR)
  │   └─ 응답을 { success: true, data: <payload> } 형태로 래핑
  │
  └─ HttpExceptionFilter
      └─ 에러를 표준화된 형태로 변환
```

### 글로벌 등록 구성

| 구성 요소 | 등록 위치 | 역할 |
|-----------|----------|------|
| `JwtAuthGuard` | APP_GUARD | 모든 엔드포인트에 JWT 인증 기본 적용 |
| `ActivityLogInterceptor` | APP_INTERCEPTOR | HTTP 요청/응답 자동 기록 |
| `TransformInterceptor` | APP_INTERCEPTOR | 응답 형태 통일 |
| `ValidationPipe` | Global Pipe | DTO 유효성 검증 |
| `HttpExceptionFilter` | Global Filter | 에러 응답 표준화 |

---

## 3. 인증 시스템

### JWT 토큰 체계

| 토큰 | 만료 | 용도 |
|------|------|------|
| Access Token | 15분 | API 요청 인증 |
| Refresh Token | 7일 | Access Token 갱신 |

**Refresh Token Rotation**: 갱신 시 새 Refresh Token 발급 + 이전 토큰 무효화.
**도난 감지**: Refresh Token 재사용 시도 시 해당 사용자의 모든 세션 무효화.

### 인증 가드 체계

| Guard | 범위 | 메커니즘 | 적용 대상 |
|-------|------|----------|----------|
| `JwtAuthGuard` | 글로벌 (APP_GUARD) | Passport JWT, Bearer Token | 모든 엔드포인트 (기본) |
| `RolesGuard` | 라우트별 | `@Roles()` 데코레이터 | 역할 기반 접근 제어 |
| `NfcApiKeyGuard` | NFC 모듈 | X-API-Key 헤더 | NFC 에이전트 M2M 인증 |
| `PlayerApiKeyGuard` | Player 모듈 | API 키 | 디스플레이 장치 M2M 인증 |
| `CallbackGuard` | AI 시스템 | HMAC 서명 검증 | AI Worker 콜백 인증 |
| `WsJwtGuard` | WebSocket | JWT handshake 검증 | 소켓 연결 인증 |

### 인증 제외

```typescript
@Public()  // JwtAuthGuard 건너뜀
@Post('auth/login')
```

### RBAC 역할

| 역할 | 권한 |
|------|------|
| `admin` | 전체 시스템 접근 |
| `manager` | 제한적 관리 접근 |
| `viewer` | 읽기 전용 접근 |

---

## 4. 모듈 구조

### 22개 도메인 모듈

| 도메인 | 모듈 | 주요 기능 |
|--------|------|----------|
| **시스템** | auth | JWT 로그인/로그아웃, 토큰 갱신, Refresh Token Rotation |
| | users | 사용자 CRUD, 역할 관리 |
| | dashboard | 통계, 메트릭, 차트 데이터 |
| | settings | 시스템 설정 (multipart 로고 업로드) |
| | activity-logs | HTTP 요청/응답 활동 로그 |
| **물리 계층** | buildings | 건물 CRUD |
| | spaces | 공간 CRUD (건물 하위) |
| | menus | GNB/LNB 메뉴 트리 + RBAC 매핑 |
| | permissions | 건물별 사용자 권한 |
| **IoT** | presets | 디바이스 프리셋 관리 |
| | control | IoT 디바이스 실시간 제어 |
| | socket | TCP 소켓 통신 (컨트롤러 9090) |
| **NFC** | nfc | 리더/카드/태그 관리, NfcApiKeyGuard |
| **녹화** | recorders | ONVIF 녹화기 CRUD, PTZ, 녹화 제어 |
| | recordings | 녹화 세션/파일 이력 |
| | ftp | FTP 설정 + 업로드 Job |
| **디스플레이** | players | 디스플레이 장치 (자체등록 + 승인) |
| | playlists | 플레이리스트 + 콘텐츠 |
| | contents | 콘텐츠 관리 (VIDEO/IMAGE/HTML/STREAM) |
| | content-approvals | 콘텐츠 승인 워크플로우 |
| | player-groups | 플레이어 그룹 관리 |
| | player-playlists | 플레이어-플레이리스트 매핑 |
| | play-logs | 재생 로그/통계 |
| **AI** | ai-system | 강의 요약, 음성 인식, 음성 명령, Worker 서버 |

### 모듈 내부 구조 (표준 패턴)

```
modules/<feature>/
├── <feature>.module.ts        # NestJS 모듈 정의
├── <feature>.controller.ts    # 라우트 핸들러
├── <feature>.service.ts       # 비즈니스 로직
├── dto/                       # 요청/응답 DTO (class-validator)
├── entities/                  # TypeORM 엔티티
└── guards/                    # 모듈 전용 가드 (선택)
```

---

## 5. 데이터베이스 패턴

### TypeORM 설정

- **synchronize**: 항상 `false` (마이그레이션으로만 스키마 변경)
- **엔티티 수**: 41개
- **DB**: MariaDB 11.2 (utf8mb4)

### 소프트 삭제 패턴

약 28/40 테이블에서 소프트 삭제를 사용한다.

```sql
-- 소프트 삭제 컬럼 패턴
<table>_isdel CHAR(1) DEFAULT 'N'
```

### 타임스탬프 패턴

```sql
-- 수동 관리 (TypeORM @CreateDateColumn/@UpdateDateColumn 아님)
reg_date DATETIME DEFAULT CURRENT_TIMESTAMP
upd_date DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
```

### 핵심 허브 테이블

| 테이블 | FK 참조 수 | 역할 |
|--------|-----------|------|
| `tb_users` | 15개 | 모든 서브시스템의 허브 |
| `tb_space` | 8개 | 물리적 피벗 (NFC, 녹화기, IoT 등) |

---

## 6. 소켓 통신

### TCP 소켓

| 대상 | 포트 | 프로토콜 | 용도 |
|------|------|----------|------|
| IoT 컨트롤러 | 9090 | TCP | 디바이스 제어 명령 송수신 |
| 녹화기 | 6060 | TCP | ONVIF 녹화기 제어 |

### WebSocket (socket.io)

- 클라이언트(Console) ↔ API 서버 간 실시간 통신
- `WsJwtGuard`로 handshake 인증
- 녹화기 상태 모니터링, IoT 제어 피드백 등에 사용

---

## 7. 스케줄링

`@nestjs/schedule` (ScheduleModule)을 사용한 배치 작업:

- FTP 파일 업로드 Job
- 녹화기 상태 폴링
- AI Worker 서버 헬스체크
- 플레이어 하트비트 모니터링

---

## 8. 외부 통신

### HTTP 클라이언트

`ofetch` 기반의 커스텀 `HttpClientModule`:

- AI Worker 서버 통신
- 외부 API 호출
- ONVIF 카메라 프로토콜

### 파일 전송

| 프로토콜 | 라이브러리 | 용도 |
|----------|-----------|------|
| FTP | basic-ftp | 녹화 파일 업로드 |
| SFTP | ssh2-sftp-client | 보안 파일 전송 |
| FTPS | basic-ftp (TLS) | 암호화 파일 전송 |

---

## 9. 보안 레이어

| 레이어 | 기술 | 설정 |
|--------|------|------|
| HTTP 헤더 | Helmet | 보안 헤더 자동 설정 |
| CORS | NestJS CORS | 화이트리스트 기반 |
| Rate Limiting | ThrottlerModule | TTL 60초, 최대 100회 |
| 로그인 Rate Limit | Nginx | 5회/분 |
| 비밀번호 | bcrypt | 10 라운드 |
| SQL Injection | TypeORM | 파라미터화 쿼리 |
| 입력 검증 | ValidationPipe | whitelist + forbidNonWhitelisted |

---

## 10. 에러 처리

### HttpExceptionFilter

모든 예외를 다음 형태로 표준화:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "에러 메시지",
  "error": "Bad Request",
  "timestamp": "2026-03-22T12:00:00.000Z",
  "path": "/api/v1/resource"
}
```

### 성공 응답 (TransformInterceptor)

```json
{
  "success": true,
  "data": { ... }
}
```

---

## 11. API 문서화

Swagger/OpenAPI 3.0이 `/api/v1/docs`에서 제공된다.

모든 엔드포인트에 `@Api*` 데코레이터를 사용하여 문서화:
- `@ApiTags()` — 모듈 그룹핑
- `@ApiOperation()` — 엔드포인트 설명
- `@ApiResponse()` — 응답 스키마
- `@ApiBearerAuth()` — JWT 인증 표시

상세 API 스펙은 `docs/api/*.api.md`에서 확인 가능하다. → [API 계약](./api-contracts.md) 참조
