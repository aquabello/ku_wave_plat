# KU-WAVE-PLAT 소스 트리 분석

> **프로젝트**: KU-WAVE-PLAT
> **생성일**: 2026-03-22
> **문서 유형**: BMAD 소스 트리 분석

---

## 모노레포 최상위 구조

```
ku_wave_plat/
├── apps/                          # 애플리케이션 (3개)
│   ├── api/                       # NestJS 백엔드 API
│   ├── console/                   # Next.js 관리자 대시보드
│   └── nfc/                       # NFC 카드 태깅 에이전트
├── packages/                      # 공유 패키지 (4개)
│   ├── types/                     # @ku/types - 공유 타입 정의
│   ├── contracts/                 # @ku/contracts - Zod 검증 스키마
│   ├── ui/                        # @ku/ui - shadcn/ui 공유 컴포넌트
│   └── config/                    # @ku/config - 린트/포맷/TS 설정
├── docs/                          # 프로젝트 문서
│   ├── api/                       # API 스펙 (16개 파일)
│   ├── dev/                       # 배포 가이드
│   ├── inners/                    # 내부 문서
│   ├── bon/                       # 외부 참조 자료
│   └── 완료보고서/                 # 납품 문서
├── scripts/                       # 운영 스크립트
│   └── server/                    # 서버 셋업 스크립트 (01~05)
├── .claude/                       # Claude Code 에이전트 설정
│   └── agents/                    # 특화 에이전트 (ku-architect, ku-api, ku-console)
├── turbo.json                     # Turborepo 파이프라인 설정
├── pnpm-workspace.yaml            # pnpm 워크스페이스 정의
├── package.json                   # 루트 패키지 (스크립트, devDependencies)
├── .env.example                   # 환경변수 템플릿
├── CLAUDE.md                      # 프로젝트 개발 지침
└── .gitignore
```

---

## apps/api — NestJS 백엔드

```
apps/api/
├── src/
│   ├── main.ts                    # 앱 엔트리포인트 (port 8000, prefix /api/v1, Swagger)
│   ├── app.module.ts              # 루트 모듈 (글로벌 가드/인터셉터 등록)
│   │
│   ├── modules/                   # 도메인 모듈 (22개)
│   │   ├── auth/                  # JWT 인증 (로그인, 로그아웃, 토큰 갱신)
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── dto/               # LoginDto, RefreshTokenDto
│   │   │   ├── guards/            # JwtAuthGuard, JwtRefreshGuard
│   │   │   └── strategies/        # JwtStrategy, JwtRefreshStrategy
│   │   │
│   │   ├── users/                 # 사용자 CRUD + 역할 관리
│   │   │   ├── entities/          # UserEntity (tb_users)
│   │   │   ├── dto/
│   │   │   ├── users.controller.ts
│   │   │   └── users.service.ts
│   │   │
│   │   ├── dashboard/             # 통계/메트릭 대시보드
│   │   ├── settings/              # 시스템 설정 (multipart 로고 업로드)
│   │   ├── buildings/             # 건물 CRUD
│   │   ├── spaces/                # 공간 CRUD (건물 하위)
│   │   ├── menus/                 # GNB/LNB 메뉴 트리 + RBAC
│   │   ├── permissions/           # 건물별 사용자 권한
│   │   ├── activity-logs/         # 활동 로그 (자동 기록)
│   │   │
│   │   ├── nfc/                   # NFC 출입 시스템
│   │   │   ├── entities/          # NfcReader, NfcCard, NfcLog, NfcReaderCommand
│   │   │   ├── guards/            # NfcApiKeyGuard (M2M 인증)
│   │   │   ├── dto/
│   │   │   ├── nfc.controller.ts
│   │   │   └── nfc.service.ts
│   │   │
│   │   ├── controller/            # IoT 디바이스 제어
│   │   │   ├── presets/           # 디바이스 프리셋 관리
│   │   │   ├── control/           # 실시간 제어 명령
│   │   │   └── socket/            # TCP 소켓 통신 (9090 포트)
│   │   │
│   │   ├── recorders/             # ONVIF 녹화기
│   │   │   ├── entities/          # Recorder, RecorderUser, RecorderPreset, RecorderLog
│   │   │   ├── dto/
│   │   │   ├── recorders.controller.ts
│   │   │   └── recorders.service.ts
│   │   │
│   │   ├── recordings/            # 녹화 세션/파일 이력
│   │   │   ├── entities/          # RecordingSession, RecordingFile
│   │   │   └── ...
│   │   │
│   │   ├── ftp/                   # FTP 설정 + 업로드 Job
│   │   │   ├── entities/          # FtpConfig
│   │   │   └── ...
│   │   │
│   │   ├── players/               # 디스플레이 장치 (자체등록 + 승인)
│   │   │   ├── entities/          # Player, PlayerHeartbeatLog
│   │   │   ├── guards/            # PlayerApiKeyGuard (M2M)
│   │   │   └── ...
│   │   │
│   │   ├── playlists/             # 플레이리스트 + 콘텐츠
│   │   │   ├── entities/          # PlayList, PlayListContent
│   │   │   └── ...
│   │   │
│   │   ├── contents/              # 콘텐츠 관리 (VIDEO/IMAGE/HTML/STREAM)
│   │   │   ├── entities/          # Content
│   │   │   └── ...
│   │   │
│   │   ├── content-approvals/     # 콘텐츠 승인 워크플로우
│   │   ├── player-groups/         # 플레이어 그룹 관리
│   │   ├── player-playlists/      # 플레이어-플레이리스트 매핑
│   │   ├── play-logs/             # 재생 로그/통계
│   │   │
│   │   └── ai-system/            # AI 시스템 (강의 요약, 음성 인식)
│   │       ├── entities/          # AiWorkerServer, AiVoiceCommand, AiSpeechSession 등
│   │       ├── guards/            # CallbackGuard (HMAC 서명)
│   │       └── ...
│   │
│   ├── common/                    # 공통 코드
│   │   ├── decorators/            # @CurrentUser, @Roles, @Public, @IsMultipleOf, @IsTimeRangeValid
│   │   ├── filters/               # HttpExceptionFilter (표준화 에러 응답)
│   │   ├── guards/                # JwtAuthGuard(글로벌), RolesGuard, WsJwtGuard
│   │   ├── interceptors/          # ActivityLogInterceptor(글로벌), TransformInterceptor(글로벌)
│   │   └── pipes/                 # ValidationPipe (글로벌)
│   │
│   ├── config/                    # 설정 모듈 (DB, JWT, CORS 등)
│   │
│   └── database/                  # 데이터베이스
│       ├── data-source.ts         # TypeORM DataSource 설정
│       ├── migrations/            # 마이그레이션 파일
│       └── seeds/                 # 시드 데이터
│
├── test/                          # E2E 테스트
├── uploads/                       # 업로드 파일 저장소
├── nest-cli.json                  # NestJS CLI 설정
├── tsconfig.json                  # TypeScript 설정
└── package.json                   # @ku/api 패키지
```

---

## apps/console — Next.js 관리자 대시보드

```
apps/console/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # 루트 레이아웃
│   │   ├── (auth)/                # 인증 라우트 그룹
│   │   │   └── login/             # 로그인 페이지
│   │   │       └── page.tsx
│   │   │
│   │   └── (dashboard)/           # 대시보드 라우트 그룹 (Header + Sidebar + AuthGuard)
│   │       ├── layout.tsx         # 대시보드 공유 레이아웃
│   │       ├── dashboard/         # 대시보드 (통계, 차트)
│   │       │
│   │       ├── controller/        # IoT 제어
│   │       │   ├── hardware/      # 하드웨어 설정
│   │       │   ├── control/       # 디바이스 제어
│   │       │   └── socket/        # 소켓 명령 관리
│   │       │
│   │       ├── rfid/              # NFC/RFID 관리
│   │       │   ├── tags/          # NFC 카드 관리
│   │       │   ├── readers/       # NFC 리더 관리
│   │       │   └── logs/          # NFC 태깅 로그
│   │       │
│   │       ├── recorder/          # 녹화 시스템
│   │       │   ├── list/          # 녹화기 CRUD
│   │       │   ├── control/       # 실시간 제어 (PTZ, 녹화, 상태)
│   │       │   ├── history/       # 녹화 세션 이력
│   │       │   ├── files/         # 녹화 파일 (FTP 상태, 미리보기)
│   │       │   └── ftp/           # FTP 설정
│   │       │
│   │       ├── ai-system/         # AI 시스템
│   │       │   ├── lecture-summary/  # AI 강의 요약
│   │       │   ├── speech/           # 음성 인식 세션
│   │       │   ├── voice-commands/   # 음성 명령
│   │       │   └── worker-servers/   # AI Worker 서버 관리
│   │       │
│   │       ├── display/           # 디스플레이/DID
│   │       │   ├── player/        # 디스플레이 장치
│   │       │   ├── list/          # 플레이리스트
│   │       │   ├── content/       # 콘텐츠 관리 (DnD 정렬)
│   │       │   └── content-approval/ # 콘텐츠 승인
│   │       │
│   │       ├── members/           # 회원 관리
│   │       │   ├── (index)/       # 회원 목록
│   │       │   ├── permissions/   # RBAC 메뉴 권한
│   │       │   └── activity/      # 활동 로그
│   │       │
│   │       └── settings/          # 시스템 설정
│   │           ├── (index)/       # 설정 페이지
│   │           └── buildings/     # 건물/공간 관리
│   │
│   ├── components/                # 컴포넌트
│   │   ├── layout/                # 레이아웃 (Sidebar, Header, UserMenu)
│   │   ├── ui/                    # shadcn/ui 프리미티브 (22개)
│   │   ├── auth/                  # 인증 관련 컴포넌트
│   │   └── data-display/          # 데이터 표시 컴포넌트
│   │
│   ├── hooks/                     # TanStack Query 커스텀 훅 (13개)
│   │   ├── use-auth.ts
│   │   ├── use-buildings.ts
│   │   ├── use-recorders.ts
│   │   └── ...
│   │
│   ├── lib/                       # 유틸리티 라이브러리
│   │   ├── api/                   # API 클라이언트 (19개 파일)
│   │   │   ├── client.ts          # ofetch 기반 공통 클라이언트
│   │   │   ├── auth.ts
│   │   │   ├── buildings.ts
│   │   │   ├── recorders.ts
│   │   │   └── ...
│   │   └── utils.ts               # 공통 유틸리티
│   │
│   ├── stores/                    # Zustand 스토어
│   │   └── navigation.ts          # 네비게이션 상태 (localStorage 영속화)
│   │
│   └── types/                     # 프론트엔드 전용 타입
│
├── public/                        # 정적 파일
├── next.config.ts                 # Next.js 설정
├── tailwind.config.ts             # Tailwind CSS 설정
├── tsconfig.json                  # TypeScript 설정
└── package.json                   # @ku/console 패키지
```

---

## apps/nfc — NFC 카드 태깅 에이전트

```
apps/nfc/
├── src/
│   ├── index.ts                   # 엔트리포인트 (모드 선택, 프로세스 관리)
│   ├── reader.ts                  # NFC 리더 추상화 (ACR122U, nfc-pcsc)
│   ├── api-client.ts              # BE API 통신 (ofetch, NfcApiKeyGuard 인증)
│   ├── buzzer.ts                  # 비프음 제어 (성공/실패/오류 패턴)
│   ├── ws-server.ts               # WebSocket 서버 (실시간 태깅 알림)
│   ├── config.ts                  # 환경변수 로드 (.env)
│   ├── logger.ts                  # 로깅 유틸리티
│   ├── queue.ts                   # 오프라인 큐 (네트워크 단절 대응)
│   └── tools/
│       └── scan-aid.ts            # AID 테스트 모드 (오프라인 카드 스캔)
│
├── tsconfig.json
└── package.json                   # @ku/nfc 패키지
```

---

## packages/ — 공유 패키지

```
packages/
├── types/                         # @ku/types
│   ├── src/
│   │   ├── index.ts               # 통합 export
│   │   ├── auth.ts                # 인증 타입 (LoginRequest, TokenResponse 등)
│   │   ├── user.ts                # 사용자 타입
│   │   ├── building.ts            # 건물/공간 타입
│   │   ├── recorder.ts            # 녹화기 타입
│   │   ├── nfc.ts                 # NFC 타입
│   │   ├── player.ts              # 플레이어 타입
│   │   ├── content.ts             # 콘텐츠 타입
│   │   ├── ai-system.ts           # AI 시스템 타입
│   │   └── ... (27개 파일, 200+ 타입)
│   ├── tsconfig.json
│   └── package.json
│
├── contracts/                     # @ku/contracts
│   ├── src/
│   │   ├── index.ts               # Zod 스키마 통합 export
│   │   └── ... (도메인별 Zod 스키마)
│   ├── tsconfig.json
│   └── package.json
│
├── ui/                            # @ku/ui
│   ├── src/
│   │   └── components/            # shadcn/ui 공유 컴포넌트
│   ├── tsconfig.json
│   └── package.json
│
└── config/                        # @ku/config
    ├── eslint/                    # ESLint 공유 설정
    ├── typescript/                # tsconfig 베이스
    ├── prettier/                  # Prettier 설정
    └── package.json
```

---

## docs/ — 문서

```
docs/
├── api/                           # API 스펙 (16개)
│   ├── activity-logs.api.md
│   ├── ai-system.api.md
│   ├── auth.api.md
│   ├── buildings.api.md
│   ├── controller.api.md
│   ├── employee-grant.api.md
│   ├── menus.api.md
│   ├── nfc-reader-commands.api.md
│   ├── nfc.api.md
│   ├── permissions.api.md
│   ├── player-file-list.api.md
│   ├── player.api.md
│   ├── recorder.api.md
│   ├── settings.api.md
│   ├── spaces.api.md
│   └── users.api.md
├── dev/                           # 배포 가이드
│   ├── plan.md                    # 개발 계획
│   ├── plan_ku_wave_plat.md       # 운영 서버 셋업 (PM2 + Nginx)
│   ├── plan_ku_ai_pc.md           # 강의실 PC 셋업 (systemd)
│   └── research.md                # 기술 조사
├── init_database.sql              # 전체 DB 스키마 (40 테이블)
├── inners/                        # 내부 문서
├── bon/                           # 외부 참조 자료
├── 완료보고서/                     # 납품 문서
└── thu-party/                     # 서드파티 관련
```

---

## scripts/ — 운영 스크립트

```
scripts/
└── server/
    ├── 01-base-setup.sh           # OS + Node.js + pnpm + PM2
    ├── 02-mariadb-setup.sh        # MariaDB + 외부 접근 설정
    ├── 03-app-build.sh            # 앱 빌드 + PM2 실행
    ├── 04-nginx-setup.sh          # Nginx 리버스 프록시
    ├── 05-backup-cron.sh          # DB 백업 cron (매일 03:00)
    ├── ecosystem.config.js        # PM2 프로세스 설정
    └── update.sh                  # 업데이트 배포 스크립트
```
