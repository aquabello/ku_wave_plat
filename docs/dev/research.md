# KU-WAVE-PLAT 프로젝트 심층 분석 보고서

> 건국대학교 WAVE AI 관리자 시스템 (Konkuk University Wave Platform Admin System)
> 분석일: 2026-03-14

---

## 1. 프로젝트 개요

KU-WAVE-PLAT는 건국대학교 캠퍼스 내 스마트 강의실/공간 관리를 위한 **엔터프라이즈급 관리자 시스템**입니다. NestJS 백엔드와 Next.js 프론트엔드로 구성된 모노레포 아키텍처이며, AI 음성 인식, NFC 출입 관리, ONVIF 카메라 녹화, 디스플레이 콘텐츠 관리, IoT 디바이스 제어 등 **캠퍼스 스마트 인프라 전체를 통합 관리**합니다.

---

## 2. 모노레포 아키텍처

### 2.1 기술 스택

| 항목 | 기술 |
|------|------|
| 패키지 매니저 | pnpm 10.21.0+ |
| 빌드 시스템 | Turborepo 2.7+ |
| Node 버전 | >= 20.0.0 |
| 언어 | TypeScript 5.3+ (strict mode) |

### 2.2 워크스페이스 구조

```
ku_wave_plat/
├── apps/
│   ├── api/          # @ku/api — NestJS 백엔드 (REST API)
│   ├── console/      # @ku/console — Next.js 관리자 대시보드
│   └── nfc/          # @ku/nfc — NFC 리더 에이전트 (ACR122U)
├── packages/
│   ├── types/        # @ku/types — 공유 TypeScript 타입 (200+ 타입, 27 파일)
│   ├── contracts/    # @ku/contracts — Zod 기반 API 검증 스키마
│   ├── ui/           # @ku/ui — shadcn/ui 컴포넌트 라이브러리
│   └── config/       # @ku/config — ESLint, TypeScript, Prettier 공유 설정
└── docs/             # API 스펙, 아키텍처 문서, DB 스키마
```

### 2.3 패키지 의존 관계

```
@ku/api     → @ku/types, @ku/contracts
@ku/console → @ku/types, @ku/ui
@ku/nfc     → @ku/types
모든 패키지  → @ku/config (ESLint/TS 설정)
```

### 2.4 개발 URL

- Console: `http://localhost:3000`
- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/api/v1/docs`

---

## 3. 백엔드 (NestJS API) 심층 분석

### 3.1 런타임 인프라

| 항목 | 값 |
|------|-----|
| 프레임워크 | NestJS 10.3 (Express) |
| 데이터베이스 | MariaDB 11.2 via TypeORM 0.3.19 |
| 인증 | Passport-JWT + bcrypt |
| API Prefix | `/api/v1/` |
| Rate Limiting | ThrottlerModule (기본 60초/10 요청) |
| 스케줄링 | `@nestjs/schedule` |
| HTTP 클라이언트 | ofetch 기반 커스텀 HttpClientModule |
| 파일 전송 | basic-ftp + ssh2-sftp-client |

### 3.2 글로벌 아키텍처

- **JwtAuthGuard** (APP_GUARD): 모든 엔드포인트에 JWT 인증 기본 적용, `@Public()` 데코레이터로 제외
- **ActivityLogInterceptor** (APP_INTERCEPTOR): 모든 HTTP 요청/응답을 `tb_activity_log`에 기록, 민감 필드 마스킹
- **ValidationPipe** (Global): `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- **TransformInterceptor** (Global): 응답을 `{ success: true, data: <payload> }` 형태로 래핑

### 3.3 전체 모듈 & 엔드포인트 인벤토리 (~120개 REST 엔드포인트)

#### Auth (`/api/v1/auth`) — 3 엔드포인트
| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/auth/login` | Public | 로그인 → accessToken, refreshToken, user, menus 반환 |
| POST | `/auth/refresh` | Public | 토큰 갱신 (rotation + 도난 감지) |
| POST | `/auth/logout` | JWT | 로그아웃 (DB에서 refresh token 삭제) |

#### Users (`/api/v1/users`) — 6 엔드포인트
| Method | Path | 설명 |
|--------|------|------|
| GET | `/users` | 사용자 목록 (페이징, 필터) |
| GET | `/users/:seq` | 사용자 상세 |
| POST | `/users` | 사용자 생성 |
| PUT | `/users/:seq` | 사용자 수정 |
| PATCH | `/users/:seq/reset-password` | 비밀번호 초기화 |
| DELETE | `/users/:seq` | 사용자 소프트 삭제 |

#### Dashboard (`/api/v1/dashboard`) — 1 엔드포인트
| Method | Path | 설명 |
|--------|------|------|
| GET | `/dashboard/overview` | 대시보드 통계 |

#### Settings (`/api/v1/settings`) — 2 엔드포인트
| Method | Path | 설명 |
|--------|------|------|
| GET | `/settings/system` | 시스템 설정 조회 |
| PUT | `/settings/system` | 시스템 설정 수정 (multipart/form-data, 로고 업로드 포함) |

#### Buildings & Spaces — 10 엔드포인트
| Method | Path | 설명 |
|--------|------|------|
| GET/POST/PUT/DELETE | `/buildings/*` | 건물 CRUD |
| GET/POST/PUT/DELETE | `/buildings/:buildingSeq/spaces/*` | 공간 CRUD (건물 하위) |

#### Menus & Permissions — 5 엔드포인트
| Method | Path | 설명 |
|--------|------|------|
| GET | `/menus` | 전체 메뉴 트리 |
| GET/PUT | `/menus/users/:seq` | 사용자 메뉴 권한 관리 |
| GET | `/permissions` | 권한 목록 |
| PUT | `/permissions/:userSeq/buildings` | 사용자 건물 권한 할당 |

#### NFC 시스템 — 18 엔드포인트
| 기능 | 설명 |
|------|------|
| 태그 처리 | NFC Agent → BE 태그 데이터 수신 (NfcApiKeyGuard) |
| AID 조회 | 카드 AID로 정보 검색 |
| 리더 관리 | CRUD + API 키 재발급 + 명령 매핑 |
| 카드 관리 | CRUD + 미등록 태그 목록 + 카드 승인 |
| 로그 & 통계 | 태깅 로그 + 대시보드 통계 |

#### Players (디스플레이 장치) — 11 엔드포인트
| 기능 | 설명 |
|------|------|
| 장치 관리 | CRUD + 승인/거부 + 자체 등록 |
| M2M 통신 | 파일 목록 조회 + 하트비트 (PlayerApiKeyGuard) |
| 하트비트 로그 | 장치별 연결 이력 |

#### Playlists & Contents — 10 엔드포인트
| 기능 | 설명 |
|------|------|
| 플레이리스트 | CRUD |
| 콘텐츠 | CRUD + 파일 업로드 (VIDEO/IMAGE/HTML/STREAM) |

#### Content Approval — 5 엔드포인트
| 기능 | 설명 |
|------|------|
| 승인 워크플로우 | 목록 + 승인/거부/취소 + 이력 |

#### Player Groups — 7 엔드포인트
| 기능 | 설명 |
|------|------|
| 그룹 관리 | CRUD + 멤버 추가/제거 |

#### Player/Group Playlists — 6 엔드포인트
| 기능 | 설명 |
|------|------|
| 플레이리스트 할당 | 플레이어/그룹별 플레이리스트 할당/수정/삭제 |

#### Play Logs — 2 엔드포인트
| 기능 | 설명 |
|------|------|
| 재생 로그 | 플레이어별 재생 이력 + 콘텐츠별 통계 |

#### Controller (IoT 디바이스) — 11 엔드포인트
| 기능 | 설명 |
|------|------|
| 프리셋 관리 | CRUD (명령어 세트 포함) |
| 디바이스 제어 | 공간별 장치 조회 + 단일/배치 명령 실행 |
| 제어 로그 | 조회 + 전체 삭제 |

#### Recorders (ONVIF 카메라) — 15 엔드포인트
| 기능 | 설명 |
|------|------|
| 녹화기 관리 | CRUD |
| 프리셋 관리 | CRUD (PTZ 설정) |
| 실시간 제어 | PTZ 명령 + 녹화 시작/정지 + 프리셋 적용 + 상태 조회 |
| 로그 | 명령 로그 조회 |

#### FTP Config — 5 엔드포인트
| 기능 | 설명 |
|------|------|
| FTP 설정 | CRUD + 연결 테스트 |

#### Recordings — 6 엔드포인트
| 기능 | 설명 |
|------|------|
| 세션 이력 | 목록 + 상세 (파일 목록 포함) |
| 파일 관리 | 목록 + 다운로드/미리보기 + FTP 재업로드 (최대 3회) |

#### AI System — 16 엔드포인트
| 기능 | 설명 |
|------|------|
| 강의 요약 | CRUD + MiniPC 상태/결과 업데이트 |
| 음성 인식 세션 | CRUD + STT 로그 저장 |
| 음성 명령 | CRUD + 명령 실행 + 로그 |
| Worker 서버 | CRUD + 헬스 체크 프록시 |
| AI 콜백 | HMAC 인증 기반 결과 수신 |

### 3.4 인증 가드 체계

| Guard | 범위 | 메커니즘 |
|-------|------|----------|
| JwtAuthGuard | 글로벌 (APP_GUARD) | Passport JWT, `@Public()`으로 제외 |
| RolesGuard | 라우트별 선택 | `@Roles()` 데코레이터 → userType 검사 |
| NfcApiKeyGuard | NFC 태그 엔드포인트 | X-API-Key 헤더 검증 |
| PlayerApiKeyGuard | Player M2M 엔드포인트 | API 키 검증 |
| CallbackGuard | AI 콜백 엔드포인트 | HMAC 서명 검증 |

---

## 4. 프론트엔드 (Next.js Console) 심층 분석

### 4.1 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js 16+ (App Router) |
| UI | shadcn/ui + Radix UI (21개 컴포넌트) |
| 스타일링 | Tailwind CSS 3.4+ (Konkuk Green/Orange 커스텀 색상) |
| 데이터 테이블 | TanStack Table 8+ |
| 차트 | Recharts 2+ |
| 폼 | React Hook Form + Zod |
| 상태 관리 | Zustand 5+ (1개 스토어: navigation) |
| 데이터 페칭 | TanStack Query 5+ |
| HTTP 클라이언트 | ofetch |
| DnD | @dnd-kit/sortable |

### 4.2 라우트 구조 (28개 페이지)

```
app/
├── (auth)/
│   └── login/              # 로그인 페이지
├── (dashboard)/
│   ├── dashboard/          # 대시보드 (통계 카드, 차트) — 현재 정적 목 데이터
│   ├── controller/
│   │   ├── hardware/       # 하드웨어 설정
│   │   └── control/        # 디바이스 제어 패널
│   ├── rfid/
│   │   ├── tags/           # RFID 태그 관리
│   │   ├── readers/        # RFID 리더 관리
│   │   └── logs/           # RFID 접근 로그
│   ├── recorder/
│   │   ├── list/           # 녹화기 CRUD
│   │   ├── control/        # 실시간 제어 (PTZ 조이스틱, 녹화)
│   │   ├── history/        # 세션 이력
│   │   ├── files/          # 녹화 파일 (현재 USE_MOCK=true)
│   │   └── ftp/            # FTP 설정
│   ├── ai-system/
│   │   ├── lecture-summary/ # AI 강의 요약 목록 + 상세
│   │   ├── speech/         # 음성 인식 세션 + 상세
│   │   ├── voice-commands/ # 음성 명령 CRUD
│   │   └── worker-servers/ # Worker 서버 관리 (30초 폴링)
│   ├── display/
│   │   ├── player/         # 디스플레이 장치 CRUD (승인/거부)
│   │   ├── list/           # 플레이리스트 관리 (목 데이터)
│   │   ├── content/        # 콘텐츠 관리 + DnD 정렬
│   │   └── content-approval/ # 콘텐츠 승인 워크플로우
│   ├── members/
│   │   ├── (index)/        # 회원 관리
│   │   ├── permissions/    # 메뉴 기반 RBAC 권한
│   │   └── activity/       # 활동 로그
│   └── settings/
│       ├── (index)/        # 시스템 설정 (간격, 블랙아웃, 기본 이미지)
│       └── buildings/      # 건물 CRUD + [buildingSeq] 공간 관리
```

### 4.3 핵심 아키텍처 패턴

**레이아웃 구조:**
- `(auth)` 그룹: 중앙 카드 레이아웃, 로그인 시 대시보드로 리다이렉트
- `(dashboard)` 그룹: Header(GNB) + Sidebar(LNB) + AuthGuard 래퍼

**데이터 페칭 (TanStack Query v5):**
- Query Key Factory 패턴: 도메인별 `*Keys` 객체 정의
- 폴링: 녹화기 상태 5초, Worker 서버 헬스 30초
- Mock 플래그 패턴: `USE_MOCK = true`로 BE 없이 FE 개발 가능

**상태 관리 (Zustand):**
- 단일 스토어 `useNavigationStore`: menus(GNB 메뉴 트리) + activeGNB
- `localStorage`에 영속화 (`ku-navigation-storage`, version 2)
- 로그아웃 시 `clearMenus()` 호출

**API 클라이언트 (`ofetch` 기반):**
- 모든 요청에 `Authorization: Bearer` 자동 주입
- 401 인터셉터: 권한 변경 감지 → 즉시 로그아웃, 그 외 → 토큰 갱신 시도
- 동시 갱신 방지: `isRefreshing` 플래그 + 공유 `refreshPromise`
- `refreshTokens()`는 raw `fetch` 사용 (무한 루프 방지)

**폼 처리:**
- React Hook Form + Zod, `@hookform/resolvers`
- 비동기 데이터 로딩 시 **자식 컴포넌트 패턴** 사용 (`key={item.id}`로 fresh form state 보장)

**컴포넌트 패턴:**
- 기능별 co-located 컴포넌트: `*-table.tsx`, `*-register-dialog.tsx`, `*-edit-dialog.tsx`, `*-delete-dialog.tsx`
- 듀얼 토스트 시스템: shadcn/ui Toaster + Sonner

**브랜딩:**
- 건국대학교 커스텀 색상: `konkuk-green`, `konkuk-green-light`, `konkuk-orange`
- 그래디언트 배경, glassmorphism (`backdrop-blur` + `bg-card/30`)

---

## 5. 공유 패키지 시스템

### 5.1 @ku/types (200+ 타입, 27 파일)

| 도메인 | 주요 타입 |
|--------|----------|
| 인증 | `LoginDto`, `LoginResponse`, `JwtPayload`, `CurrentUser` |
| 하드웨어 | `PlayerListItem`, `Player`, `RecorderDetail`, `PtzCommand`, `FtpConfigListItem` |
| 핵심 엔티티 | `Building`, `Space`, `Member`, `Menu` (GNB/LNB) |
| 콘텐츠 | `Content` (VIDEO/IMAGE/HTML/STREAM), `Playlist`, `ContentApproval` |
| AI 시스템 | `LectureSummary`, `SpeechSession`, `VoiceCommand`, `WorkerServer` |
| 시스템 | `ApiResponse<T>`, `PaginationMeta`, `ApiError`, `Dashboard`, `ActivityLog` |

**명명 규칙:**
- 목록: `{Entity}ListItem` / 상세: `{Entity}Detail` / CRUD: `Create{Entity}Dto`, `Update{Entity}Dto`

### 5.2 @ku/contracts (Zod 스키마)

Zod로 검증 스키마를 정의하고 `z.infer<>`로 타입을 자동 추론하는 **Single Source of Truth** 패턴:
```typescript
export const LoginDtoSchema = z.object({ id: z.string(), password: z.string() });
export type LoginDto = z.infer<typeof LoginDtoSchema>;
```

도메인: auth, menu, player, settings, building, nfc, content, playlist, controller

### 5.3 @ku/config

- ESLint: strict TypeScript 규칙, `any` 경고, `_` 접두사 허용
- TypeScript: ES2022 타겟, strict mode, 선언 파일 생성
- Prettier: 100자 라인, 작은따옴표, trailing comma

### 5.4 @ku/ui

현재 Placeholder 상태 — shadcn/ui 컴포넌트 라이브러리 구축 준비 완료

---

## 6. 인증 & 보안

### 6.1 인증 플로우

**로그인:**
1. `POST /auth/login` (Public) → userId + bcrypt 비밀번호 비교
2. `user.step === 'OK'` 확인 (승인된 계정만)
3. Access Token (15분) + Refresh Token (7일) 발급
4. Refresh Token DB 저장 + `lastAccessDate` 업데이트
5. 응답: `{ accessToken, refreshToken, user, menus }` (SUPER → 전체 메뉴, 일반 → 할당 메뉴)

**토큰 갱신 (Rotation + 도난 감지):**
1. DB의 refresh token과 비교 → 불일치 시 **모든 토큰 무효화** (도난 감지)
2. `tokenVer` JWT vs DB 비교 → 불일치 시 권한 변경으로 판단, 401 반환
3. 성공 시 새 토큰 쌍 발급 + DB 저장

**`tokenVer` 메커니즘 (실시간 권한 취소):**
- 관리자가 사용자 메뉴 권한 변경 → `tu_token_ver` 증가
- 해당 사용자의 다음 요청에서 401 반환 → 재로그인 강제

### 6.2 보안 미들웨어 스택

| 레이어 | 구현 | 설정 |
|--------|------|------|
| Helmet | CSP, X-Frame-Options 등 | `crossOriginResourcePolicy: cross-origin` |
| CORS | 화이트리스트 | `ALLOWED_ORIGINS` 환경변수 |
| Rate Limiting | ThrottlerModule | 60초당 10 요청 (기본) |
| ValidationPipe | 입력 검증 | whitelist + forbidNonWhitelisted |
| Nginx (프로덕션) | 추가 보안 | HSTS, 50MB 업로드, SSL, IP당 30req/s |

### 6.3 프론트엔드 인증

- **토큰 저장**: `localStorage` (access_token, refresh_token, user)
- **AuthGuard 컴포넌트**: JWT 만료 클라이언트 디코딩, 5분 전 백그라운드 갱신, 60초 주기 체크, 탭 포커스 시 즉시 체크
- **로그아웃 사유**: `session_expired`, `token_expired`, `permission_changed`, `session_invalid` → 로그인 페이지에서 토스트 표시
- **Next.js middleware 없음**: 인증은 순수 클라이언트 사이드

### 6.4 보안 강점

- Refresh Token Rotation + DB 저장 → 서버 사이드 무효화 가능
- 토큰 도난 감지 (DB 저장값과 불일치 시 전체 토큰 무효화)
- `tokenVer`로 실시간 권한 변경 감지 → 즉시 재로그인 강제
- 입력 검증: `whitelist + forbidNonWhitelisted` → mass-assignment 공격 방지
- 활동 로그에서 민감 필드 마스킹 (password, token 등)
- `synchronize: false` → 런타임 스키마 변경 불가

### 6.5 보안 개선 포인트

1. `RolesGuard`가 `user.roles` (배열) 검사하나 JWT에는 `userType` (문자열)만 있음 → 불일치 가능성
2. Next.js middleware 없음 → 서버 사이드 라우트 보호 부재
3. 토큰이 `localStorage`에 저장 → XSS 취약 (httpOnly 쿠키 권장)
4. Access/Refresh Token이 동일 `JWT_SECRET` 사용 → 별도 시크릿 권장
5. `console.error()` 기반 에러 로깅 → 구조화된 로거(Winston/Pino) 도입 필요
6. 글로벌 Rate Limiting 10req/60s는 관리자 대시보드에 너무 낮음

---

## 7. 횡단 관심사

### 7.1 활동 로그 (ActivityLogInterceptor)

- 모든 HTTP 요청을 `tb_activity_log`에 자동 기록
- 캡처 항목: 사용자, HTTP 메서드, URL, 한국어 액션명, 상태 코드, 요청/응답 본문, IP, User-Agent, 소요 시간(ms)
- 민감 필드 3단계 깊이까지 마스킹 (`password`, `token`, `authorization` 등)
- 한국어 액션명 매핑: 정적 경로 맵 + 정규식 동적 경로 맵 → 계층적 이름 (예: `"회원관리 > 사용자 목록 > 수정"`)
- 제외 경로: `/activity-logs`, `/docs`, `/health`

### 7.2 에러 처리 (HttpExceptionFilter)

```json
{ "success": false, "error": { "code": "BAD_REQUEST", "message": "...", "timestamp": "...", "path": "..." } }
```
- 모든 예외 일관된 형태로 반환
- HTTP 상태 코드 → 문자열 에러 코드 매핑

### 7.3 응답 변환 (TransformInterceptor)

```json
{ "success": true, "data": { ... } }
```

---

## 8. 주요 도메인별 기능 상세

### 8.1 NFC 출입 관리 시스템

- **리더 관리**: NFC 리더 등록/수정/삭제 + API 키 발급/재발급
- **카드 관리**: AID 기반 카드 등록/승인/수정/삭제 + 미등록 태그 자동 수집
- **태깅 처리**: NFC Agent → BE (NfcApiKeyGuard로 M2M 인증)
- **명령 매핑**: 리더별 NFC 태그 → IoT 디바이스 명령 매핑
- **WebSocket**: 프론트엔드에서 실시간 태그 이벤트 수신 (자동 재연결)
- **통계 대시보드**: 태깅 통계 API

### 8.2 ONVIF 카메라 녹화 시스템

- **녹화기 관리**: ONVIF/RTSP 카메라 CRUD + 프리셋 관리
- **실시간 제어**: PTZ 명령 (pan/tilt/zoom) + 녹화 시작/정지 + 프리셋 적용
- **상태 폴링**: 5초 간격 녹화기 상태 조회
- **녹화 세션**: 시작→종료 세션 관리 + 파일 목록
- **FTP 업로드**: 녹화 파일 FTP 전송 + 실패 시 재시도 (최대 3회)

### 8.3 AI 음성 인식 시스템

- **강의 요약**: MiniPC에서 강의 녹음 → AI Worker에서 요약 생성
- **음성 인식 세션**: 실시간 STT (Speech-to-Text) 세션 관리
- **음성 명령**: 음성 키워드 → IoT 디바이스 명령 매핑 + 자동 실행
- **Worker 서버**: AI 처리 서버 등록/관리 + 헬스 체크 프록시 (30초 폴링)
- **콜백**: HMAC 인증 기반 AI Worker → BE 결과 수신

### 8.4 디스플레이 콘텐츠 관리

- **플레이어 (디스플레이 장치)**: 자체 등록 → 관리자 승인 플로우
- **콘텐츠**: VIDEO/IMAGE/HTML/STREAM 타입 업로드/관리
- **플레이리스트**: 콘텐츠 구성 + DnD 정렬 + 재생 순서 관리
- **콘텐츠 승인**: PENDING → APPROVED/REJECTED 워크플로우 + 감사 이력
- **플레이어 그룹**: 그룹별 플레이리스트 할당
- **재생 로그**: 플레이어별/콘텐츠별 재생 통계

### 8.5 IoT 디바이스 제어

- **프리셋**: 디바이스 명령 세트 (프로젝터, 조명, 전동 스크린 등)
- **공간별 제어**: 건물 → 공간 → 디바이스 계층 구조
- **단일/배치 실행**: 개별 디바이스 또는 공간 전체 일괄 제어
- **제어 로그**: 명령 실행 이력

### 8.6 건물/공간 관리

- **건물**: 캠퍼스 내 건물 CRUD (소프트 삭제)
- **공간**: 건물 하위 강의실/세미나실 등 CRUD (소프트 삭제)
- **계층 구조**: `/buildings/:buildingSeq/spaces/*` REST 네스팅

### 8.7 회원/권한 관리

- **사용자**: CRUD + 비밀번호 초기화 + 소프트 삭제
- **메뉴 기반 RBAC**: 사용자별 GNB/LNB 메뉴 접근 권한 할당
- **건물 권한**: 사용자별 접근 가능 건물 할당
- **활동 로그**: 사용자별 API 호출 이력 조회

---

## 9. 데이터 모델 심층 분석

### 9.1 전체 테이블 인벤토리 (40개 테이블, 8개 도메인)

| 도메인 | 수량 | 테이블 |
|--------|------|--------|
| 시스템/인증 | 3 | `tb_setting`, `tb_users`, `tb_activity_log` |
| RBAC | 2 | `tb_menu`, `tb_menu_users` |
| 물리 계층 | 3 | `tb_building`, `tb_space`, `tb_user_building` |
| IoT 컨트롤러 | 4 | `tb_device_preset`, `tb_preset_command`, `tb_space_device`, `tb_control_log` |
| NFC/RFID | 4 | `tb_nfc_reader`, `tb_nfc_card`, `tb_nfc_log`, `tb_nfc_reader_command` |
| 디스플레이/DID | 11 | `tb_content`, `tb_play_list`, `tb_play_list_content`, `tb_content_approval_log`, `tb_player`, `tb_player_heartbeat_log`, `tb_player_group`, `tb_player_group_member`, `tb_player_playlist`, `tb_group_playlist`, `tb_play_log` |
| 녹화 | 7 | `tb_recorder`, `tb_recorder_user`, `tb_recorder_preset`, `tb_ftp_config`, `tb_recording_session`, `tb_recording_file`, `tb_recorder_log` |
| AI 시스템 | 6 | `tb_ai_worker_server`, `tb_ai_voice_command`, `tb_ai_speech_session`, `tb_ai_speech_log`, `tb_ai_command_log`, `tb_ai_lecture_summary` |

### 9.2 엔티티-관계 다이어그램

```
물리 백본 (tb_space가 5개 서브시스템의 앵커):
tb_building ──→ tb_space ──┬──→ tb_space_device ──→ tb_device_preset
                            │         └──→ tb_preset_command
                            ├──→ tb_nfc_reader ──→ tb_nfc_reader_command
                            ├══→ tb_recorder (1:1 UNIQUE)
                            ├──→ tb_ai_speech_session
                            └──→ tb_ai_lecture_summary

인증 허브 (tb_users: 15개 인바운드 FK):
tb_users ←── tb_menu_users ──→ tb_menu (self-ref GNB/LNB 트리)
tb_users ←── tb_user_building ──→ tb_building
tb_users ←── tb_nfc_card, tb_play_list_content (×2), tb_player
tb_users ←── tb_recorder (×3), tb_recording_session, tb_recorder_log
tb_users ←── tb_ai_speech_session, tb_ai_lecture_summary
tb_users ←── tb_control_log, tb_content_approval_log, tb_activity_log

디스플레이 이중 경로 할당:
tb_play_list ←── tb_player_playlist ──→ tb_player         (직접 + 스케줄)
tb_play_list ←── tb_group_playlist ──→ tb_player_group
                                         └──→ tb_player_group_member ──→ tb_player

콘텐츠 승인 워크플로우:
tb_play_list_content [approval_status: PENDING→APPROVED|REJECTED]
  ├── requester_seq ──→ tb_users
  ├── reviewer_seq ──→ tb_users
  └──→ tb_content_approval_log (불변 감사 추적)

녹화 체인:
tb_recorder ══→ tb_space (1:1)
  ├──→ tb_recorder_user (교수진)
  ├──→ tb_recorder_preset (PTZ pan/tilt/zoom)
  ├──→ tb_ftp_config (NULL=글로벌 기본값)
  └──→ tb_recording_session ──→ tb_recording_file ──→ tb_ftp_config
```

### 9.3 FK 캐스케이드 전략

| 타입 | 수량 | 비율 | 용도 |
|------|------|------|------|
| CASCADE | 45 | 68% | 부모 삭제 시 자식도 삭제 |
| SET NULL | 20 | 30% | 감사 이력 보존 (사용자 삭제 시 로그 유지) |
| RESTRICT | 1 | 2% | `tb_space_device → tb_device_preset` (사용 중 프리셋 삭제 방지) |

### 9.4 핵심 데이터 모델 발견

1. **`tb_users`가 스키마 허브**: 15개 FK가 참조 → 모든 서브시스템이 사용자 테이블에 의존
2. **`tb_space`가 물리적 피벗**: 8개 테이블이 직접 참조 → 공간 삭제 시 전체 시설 시스템에 캐스케이드
3. **소프트 삭제 보편화**: `*_isdel CHAR(1) DEFAULT 'N'` 패턴 사용 (~28/40 테이블), 로그 테이블은 append-only로 소프트 삭제 없음
4. **JWT 토큰 DB 저장**: `tb_users.tu_access_token` (VARCHAR 300) + `tu_refresh_token` (VARCHAR 500) DB에 직접 저장
5. **이중 STT 아키텍처**: 실시간 음성 인식 (`tb_ai_speech_session` → `tb_ai_speech_log`, faster-whisper) + 비동기 강의 요약 (`tb_ai_lecture_summary.job_id`, GPU 워커 콜백)
6. **암호화**: 녹화기/FTP 비밀번호는 AES 암호화, 사용자 비밀번호는 bcrypt

### 9.5 TypeORM 매핑 패턴

| 패턴 | 구현 |
|------|------|
| 소프트 삭제 | `*_isdel CHAR(1)` (TypeORM `@DeleteDateColumn` 미사용) |
| 타임스탬프 | 수동 `reg_date` + `upd_date` (`onUpdate: 'CURRENT_TIMESTAMP'`) |
| Boolean | `CHAR(1) 'Y'/'N'` (레거시) 또는 `ENUM('Y','N')` (신규) |
| 대용량 PK | `tb_play_log`, `tb_activity_log`에 BIGINT |
| JSON 데이터 | `content_tags`, `keyword_aliases` 등 raw text 저장 (SQL JSON 함수 미활용) |
| 마이그레이션 | 1개 공식 마이그레이션 파일 + `init_database.sql` 직접 스키마 |

### 9.6 데이터 모델 제약 사항

- `tb_users.tu_type` (CHAR 6), `tu_step` (CHAR 2) → 불투명 코드 값, 열거형 테이블 없음
- `tb_player`에 `player_code`, `player_ip`, `player_api_key` 인덱스 미설정 → 스케일 시 성능 이슈 가능
- `created_by`/`updated_by` 인라인 감사 컬럼 없음 → 별도 로그 테이블에 의존
- `si_seq` (사이트 참조) → 현재 FK 제약 없는 레거시 필드

---

## 10. 배포 아키텍처

- **배포 도구**: Kamal 2.x + Docker 멀티 스테이지 빌드
- **웹 서버**: Nginx (리버스 프록시, SSL, 정적 파일)
- **CI/CD**: GitHub Actions
- **배포 전략**: Blue-Green (kamal-proxy) → 무중단 배포
- **OS**: Ubuntu
- **SSL**: Let's Encrypt (자동 갱신)
- **DB**: MariaDB (127.0.0.1:3306, 외부 접근 차단)

---

## 11. 프로젝트 문서 현황

| 문서 | 위치 | 설명 |
|------|------|------|
| API 스펙 | `docs/api/` (18개 파일) | 모든 주요 모듈 API 명세 |
| DB 스키마 | `docs/init_database.sql` | 전체 데이터베이스 초기화 SQL (984줄) |
| 배포 아키텍처 | `docs/deployment-architecture.md` | Kamal + Nginx + Docker 배포 |
| AI 시스템 | `docs/ai-system-architecture.md` | AI 서브시스템 설계 |
| 녹화 시스템 | `docs/recorder-system-design.md` | 녹화 라이프사이클 |
| 컨트롤러 | `docs/controller.md` | 디바이스 제어 시스템 |
| 사용 매뉴얼 | `docs/KU_WAVE_PLAT_사용서.md` | 한국어 사용자 매뉴얼 |

---

## 12. 핵심 발견 사항 & 아키텍처 특징

### 12.1 강점

1. **포괄적 스마트 캠퍼스 통합**: NFC, 카메라, AI, 디스플레이, IoT를 단일 플랫폼으로 통합
2. **토큰 보안**: Rotation + DB 저장 + 도난 감지 + `tokenVer` 실시간 권한 취소
3. **활동 감사**: 전체 API 호출 자동 로깅 + 민감 데이터 마스킹
4. **타입 안전성**: `@ku/types` + `@ku/contracts` (Zod)로 FE/BE 일관성 보장
5. **M2M 인증 다양화**: JWT (사용자) + API Key (NFC/Player) + HMAC (AI Worker)
6. **콘텐츠 승인 워크플로우**: PENDING → APPROVED/REJECTED + 감사 이력
7. **장치 자체 등록**: 플레이어 기기가 직접 등록 → 관리자 승인 플로우

### 12.2 개선 가능 영역

1. **구조화된 로깅** 도입 필요 (Winston/Pino)
2. **Next.js 서버 미들웨어**로 인증 보강 (현재 클라이언트 사이드만)
3. **RolesGuard** 런타임 동작 검증 필요 (userType → roles 매핑)
4. **대시보드 API 연동** 필요 (현재 정적 목 데이터)
5. **일부 프론트엔드 페이지** 목 모드 해제 필요 (`recordings.ts USE_MOCK=true`)
6. **JWT 시크릿 분리** (Access/Refresh 별도 시크릿)
7. **Rate Limiting 세분화** (로그인 엔드포인트 브루트포스 방지 강화)

---

> **통계 요약**
> - 총 모듈: 22개 (+ HttpClientModule)
> - 총 컨트롤러: 29개
> - 총 REST 엔드포인트: ~120개
> - 총 TypeORM 엔티티: 41개
> - 총 프론트엔드 페이지: 28개
> - 총 공유 타입: 200+ (27 파일)
> - 총 TanStack Query 훅 파일: 10개
> - 총 API 클라이언트 모듈: 19개
> - 프론트엔드 UI 컴포넌트: 21개 (shadcn/ui)
