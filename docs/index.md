# KU-WAVE-PLAT 문서 인덱스

> **프로젝트**: KU-WAVE-PLAT (건국대학교 WAVE AI 관리자 시스템)
> **생성일**: 2026-03-22
> **문서 유형**: BMAD 마스터 인덱스

---

## 프로젝트 소개

건국대학교 캠퍼스 내 스마트 강의실/공간을 통합 관리하는 엔터프라이즈급 관리자 시스템.
NFC 출입, ONVIF 녹화, AI 음성 인식, 디스플레이 콘텐츠, IoT 디바이스 제어를 하나의 플랫폼에서 운영한다.

**모노레포**: pnpm + Turborepo | **3 앱** + **4 공유 패키지** | **40 DB 테이블** | **~120 API 엔드포인트**

---

## 빠른 시작

```bash
git clone <repo> && cd ku_wave_plat
pnpm install
cp .env.example .env   # DB, JWT 설정 편집
pnpm dev               # Console :3000, API :8000, Swagger :8000/api/v1/docs
```

상세: [개발 가이드](./development-guide.md)

---

## BMAD 문서

### 프로젝트 전체

| 문서 | 설명 |
|------|------|
| [프로젝트 개요](./project-overview.md) | 프로젝트 요약, 기술 스택, 도메인 구조 |
| [소스 트리 분석](./source-tree-analysis.md) | 전체 디렉토리 구조 (주석 포함) |
| [프로젝트 파츠](./project-parts.json) | 모노레포 메타데이터 (JSON) |

### 아키텍처

| 문서 | 대상 | 핵심 내용 |
|------|------|----------|
| [API 아키텍처](./architecture-api.md) | apps/api (NestJS) | 모듈 구조, 글로벌 가드/인터셉터, 인증 시스템, DB 패턴 |
| [Console 아키텍처](./architecture-console.md) | apps/console (Next.js) | App Router, TanStack Query, Zustand, 폼 패턴, UI |
| [NFC 아키텍처](./architecture-nfc.md) | apps/nfc (Node.js) | 모드 시스템, 오프라인 큐, M2M 인증, 리더 제어 |
| [통합 아키텍처](./integration-architecture.md) | 시스템 간 통신 | REST, WebSocket, TCP, FTP, M2M 인증 |

### 데이터 및 API

| 문서 | 설명 |
|------|------|
| [데이터 모델](./data-models.md) | 40 테이블, 8 도메인, 관계도, 공통 패턴 |
| [API 계약](./api-contracts.md) | ~120 REST 엔드포인트 요약, 인증 분류 |

### 프론트엔드

| 문서 | 설명 |
|------|------|
| [컴포넌트 인벤토리](./component-inventory-console.md) | UI 프리미티브, 레이아웃, 테이블/폼/차트 패턴 |

### 운영

| 문서 | 설명 |
|------|------|
| [개발 가이드](./development-guide.md) | 설치, 명령어, 테스트, 코딩 규칙, 워크플로우 |
| [배포 가이드](./deployment-guide.md) | 운영 서버 (PM2+Nginx), 강의실 PC (systemd) |

---

## 기존 문서

### API 스펙 (docs/api/)

16개의 상세 API 스펙 파일. 각 파일은 엔드포인트별 요청/응답 스키마를 포함한다.

| 파일 | 도메인 |
|------|--------|
| [auth.api.md](./api/auth.api.md) | 인증 (로그인/로그아웃/토큰 갱신) |
| [users.api.md](./api/users.api.md) | 사용자 CRUD |
| [settings.api.md](./api/settings.api.md) | 시스템 설정 |
| [buildings.api.md](./api/buildings.api.md) | 건물 CRUD |
| [spaces.api.md](./api/spaces.api.md) | 공간 CRUD |
| [menus.api.md](./api/menus.api.md) | 메뉴 관리 |
| [permissions.api.md](./api/permissions.api.md) | 권한 관리 |
| [employee-grant.api.md](./api/employee-grant.api.md) | 직원 권한 |
| [activity-logs.api.md](./api/activity-logs.api.md) | 활동 로그 |
| [controller.api.md](./api/controller.api.md) | IoT 컨트롤러 |
| [nfc.api.md](./api/nfc.api.md) | NFC 관리 |
| [nfc-reader-commands.api.md](./api/nfc-reader-commands.api.md) | NFC 리더 명령 |
| [recorder.api.md](./api/recorder.api.md) | 녹화 시스템 |
| [player.api.md](./api/player.api.md) | 플레이어/디스플레이 |
| [player-file-list.api.md](./api/player-file-list.api.md) | 플레이어 파일 |
| [ai-system.api.md](./api/ai-system.api.md) | AI 시스템 |

### DB 스키마

| 파일 | 설명 |
|------|------|
| [init_database.sql](./init_database.sql) | 전체 40 테이블 DDL (CREATE TABLE) |

### 배포 상세

| 파일 | 설명 |
|------|------|
| [plan_ku_wave_plat.md](./dev/plan_ku_wave_plat.md) | 운영 서버 셋업 스크립트 (PM2 + Nginx) |
| [plan_ku_ai_pc.md](./dev/plan_ku_ai_pc.md) | 강의실 PC 셋업 스크립트 (systemd) |
| [plan.md](./dev/plan.md) | 개발 계획 |
| [research.md](./dev/research.md) | 기술 조사 |

### 프로젝트 지침

| 파일 | 설명 |
|------|------|
| [CLAUDE.md](../CLAUDE.md) | 프로젝트 개발 지침 (기술 스택, 아키텍처, 규칙) |

---

## 앱별 빠른 참조

### API (apps/api)

- **프레임워크**: NestJS 10.3+ | **포트**: 8000 | **프리픽스**: `/api/v1`
- **모듈**: 22개 | **엔티티**: 41개 | **엔드포인트**: ~120개
- **인증**: JWT (글로벌) + M2M (NfcApiKey, PlayerApiKey, HMAC)
- **DB**: MariaDB 11.2, TypeORM (synchronize: false)
- 상세: [API 아키텍처](./architecture-api.md) | [API 계약](./api-contracts.md)

### Console (apps/console)

- **프레임워크**: Next.js 16+ (App Router) | **포트**: 3000
- **페이지**: 28개 | **API 클라이언트**: 19개 | **Query 훅**: 13개
- **UI**: shadcn/ui (22 프리미티브) + Tailwind | **상태**: Zustand + TanStack Query
- 상세: [Console 아키텍처](./architecture-console.md) | [컴포넌트 인벤토리](./component-inventory-console.md)

### NFC Agent (apps/nfc)

- **런타임**: Node.js standalone | **리더**: ACR122U USB
- **모드**: tag (운영), aid-test (디버깅)
- **통신**: REST API (M2M) + WebSocket + 오프라인 큐
- 상세: [NFC 아키텍처](./architecture-nfc.md)

### 공유 패키지

| 패키지 | 역할 | 소비자 |
|--------|------|--------|
| `@ku/types` | 200+ 공유 타입 | api, console, nfc |
| `@ku/contracts` | Zod 스키마 (SSOT) | api |
| `@ku/ui` | shadcn/ui 컴포넌트 | console |
| `@ku/config` | 린트/포맷 설정 | 전체 |

---

## 필수 규칙 (CRITICAL)

1. **DB 테이블 생성 금지** — 사용자 명시적 요청 없이 새 테이블 생성 불가
2. **기존 DB 우선 확인** — `docs/init_database.sql` 및 실제 DB 조회 후 개발
3. **API 스펙 확인** — FE 코드 작성 전 `docs/api/*.api.md` 필수 참조
4. **@ku/types 사용** — 로컬 타입 중복 정의 금지
5. **페이지 단위 단일 API** — 저장 시 하나의 엔드포인트로 원자적 처리
