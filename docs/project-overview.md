# KU-WAVE-PLAT 프로젝트 개요

> **프로젝트**: KU-WAVE-PLAT (건국대학교 WAVE AI 관리자 시스템)
> **생성일**: 2026-03-22
> **문서 유형**: BMAD 프로젝트 개요

---

## 1. 프로젝트 요약

**KU-WAVE-PLAT**은 건국대학교 캠퍼스 내 스마트 강의실 및 공간을 통합 관리하기 위한 엔터프라이즈급 관리자 시스템이다. NFC 출입 관리, ONVIF 카메라 녹화, AI 음성 인식, 디스플레이 콘텐츠 관리, IoT 디바이스 제어 등 캠퍼스 스마트 인프라 전체를 하나의 플랫폼에서 운영한다.

### 핵심 수치

| 항목 | 수치 |
|------|------|
| REST API 엔드포인트 | ~120개 |
| NestJS 모듈 | 22개 |
| TypeORM 엔티티 | 41개 |
| DB 테이블 | 40개 (8개 도메인) |
| 프론트엔드 페이지 | 28개 |
| 공유 타입 | 200+ |
| API 스펙 문서 | 16개 |

---

## 2. 시스템 구성

KU-WAVE-PLAT은 **pnpm + Turborepo** 기반 모노레포로 구성되며, 3개의 애플리케이션과 4개의 공유 패키지로 이루어져 있다.

### 애플리케이션

| 앱 | 경로 | 기술 스택 | 역할 |
|----|------|-----------|------|
| **API** | `apps/api` | NestJS 10.3+, TypeORM, MariaDB | RESTful API 서버 (~120 엔드포인트) |
| **Console** | `apps/console` | Next.js 16+, shadcn/ui, TanStack | 관리자 대시보드 (28 페이지) |
| **NFC Agent** | `apps/nfc` | Node.js standalone, nfc-pcsc | NFC 카드 태깅 에이전트 |

### 공유 패키지

| 패키지 | 경로 | 역할 |
|--------|------|------|
| **@ku/types** | `packages/types` | 공유 TypeScript 타입 (200+, 27 파일) |
| **@ku/contracts** | `packages/contracts` | Zod 검증 스키마 (Single Source of Truth) |
| **@ku/ui** | `packages/ui` | shadcn/ui 공유 컴포넌트 |
| **@ku/config** | `packages/config` | ESLint/TypeScript/Prettier 설정 |

---

## 3. 기술 스택 요약

### 인프라

| 분류 | 기술 |
|------|------|
| 패키지 관리 | pnpm 10.21+ |
| 빌드 시스템 | Turborepo 2.7+ |
| Node.js | >= 20.0.0 |
| 데이터베이스 | MariaDB 11.2 |
| 프로세스 관리 | PM2 (운영) |
| 웹 서버 | Nginx (리버스 프록시) |

### 백엔드 (apps/api)

| 분류 | 기술 |
|------|------|
| 프레임워크 | NestJS 10.3+ |
| ORM | TypeORM 0.3.19+ |
| 인증 | Passport + JWT (Access 15min, Refresh 7d) |
| 유효성 검사 | class-validator + class-transformer |
| 보안 | Helmet, bcrypt, CORS, Rate Limiting |
| API 문서 | Swagger/OpenAPI 3.0 |
| HTTP 클라이언트 | ofetch 기반 HttpClientModule |
| 파일 전송 | basic-ftp, ssh2-sftp-client |
| WebSocket | socket.io |

### 프론트엔드 (apps/console)

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16+ (App Router) |
| UI | shadcn/ui + Radix UI |
| 스타일링 | Tailwind CSS 3.4+ |
| 데이터 테이블 | TanStack Table 8+ |
| 차트 | Recharts 2+ |
| 폼 | React Hook Form + Zod |
| 상태 관리 | Zustand 5+ |
| 데이터 패칭 | TanStack Query 5+ |

### NFC Agent (apps/nfc)

| 분류 | 기술 |
|------|------|
| 런타임 | Node.js standalone (PM2/systemd) |
| NFC 리더 | ACR122U USB (nfc-pcsc) |
| 통신 | ofetch (REST), WebSocket |

---

## 4. 도메인 구조

시스템은 8개의 핵심 도메인으로 구분된다.

| 도메인 | 테이블 수 | 설명 |
|--------|----------|------|
| 시스템/인증 | 3 | 설정, 사용자, 활동 로그 |
| RBAC | 2 | 메뉴, 메뉴별 사용자 권한 |
| 물리 계층 | 3 | 건물, 공간, 사용자-건물 매핑 |
| IoT 컨트롤러 | 5 | 디바이스 프리셋, 명령, 공간 디바이스, 소켓 명령 |
| NFC/RFID | 4 | 리더, 카드, 태깅 로그, 리더 명령 |
| 디스플레이/DID | 11 | 콘텐츠, 플레이리스트, 플레이어, 그룹, 재생 로그 |
| 녹화 | 7 | 녹화기, 프리셋, FTP, 세션, 파일, 로그 |
| AI 시스템 | 6 | Worker 서버, 음성 명령, STT 세션, 강의 요약 |

---

## 5. 연관 문서

### 생성 문서 (BMAD)

| 문서 | 설명 |
|------|------|
| [소스 트리 분석](./source-tree-analysis.md) | 전체 디렉토리 구조 |
| [API 아키텍처](./architecture-api.md) | 백엔드 아키텍처 상세 |
| [Console 아키텍처](./architecture-console.md) | 프론트엔드 아키텍처 상세 |
| [NFC 아키텍처](./architecture-nfc.md) | NFC 에이전트 아키텍처 상세 |
| [데이터 모델](./data-models.md) | DB 스키마 및 엔티티 관계 |
| [API 계약](./api-contracts.md) | REST API 엔드포인트 명세 |
| [컴포넌트 인벤토리](./component-inventory-console.md) | UI 컴포넌트 목록 |
| [통합 아키텍처](./integration-architecture.md) | 시스템 간 통신 구조 |
| [개발 가이드](./development-guide.md) | 개발 환경 설정 및 워크플로우 |
| [배포 가이드](./deployment-guide.md) | 운영 배포 절차 |
| [프로젝트 파츠](./project-parts.json) | 모노레포 메타데이터 (JSON) |
| [문서 인덱스](./index.md) | 전체 문서 네비게이션 |

### 기존 문서

| 문서 | 설명 |
|------|------|
| `docs/api/*.api.md` | 16개 API 스펙 파일 |
| `docs/init_database.sql` | 전체 DB 스키마 |
| `docs/dev/plan_ku_wave_plat.md` | 운영 서버 셋업 (PM2 + Nginx) |
| `docs/dev/plan_ku_ai_pc.md` | 강의실 클라이언트 셋업 (systemd) |
| `CLAUDE.md` | 프로젝트 개발 지침 |

---

## 6. 배포 환경

| 환경 | 서버 | 구성 |
|------|------|------|
| 운영 서버 | Ubuntu 24.04 | Nginx(:80) → API(:8000) + Console(:3000), MariaDB(:3306), PM2 |
| 강의실 PC | Ubuntu 24.04 | ku_ai_pc (Python, STT, 마이크), systemd |
| NFC 리더 | 운영 서버 내 | ACR122U USB, PM2 관리 |

### URL 구성

| 서비스 | URL |
|--------|-----|
| 관리자 콘솔 | `http://<서버IP>/` |
| API | `http://<서버IP>/api/v1/` |
| Swagger | `http://<서버IP>/api/v1/docs` |
| 정적 파일 | `http://<서버IP>/uploads/` |
