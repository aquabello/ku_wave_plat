# 녹화기 관리 시스템 설계서

> 각 호실별 녹화기 등록, PTZ/녹화 제어, FTP 파일 전송, 상태 모니터링, 녹화파일 관리 통합 시스템
>
> 작성일: 2026-02-22 | GNB: 화면공유 → 녹화기관리 변경

---

## 목차

1. [시스템 개요](#1-시스템-개요)
2. [메뉴 구조](#2-메뉴-구조)
3. [전체 아키텍처](#3-전체-아키텍처)
4. [DB 설계](#4-db-설계)
5. [BE 개발 업무](#5-be-개발-업무)
6. [FE 개발 업무](#6-fe-개발-업무)
7. [개발 단계](#7-개발-단계)

---

## 1. 시스템 개요

### 배경

- 건국대학교 각 강의실(호실)에 녹화기 1대씩 설치 (고정 IP)
- 녹화기를 관리 콘솔에서 원격 제어 (PTZ, 녹화 시작/종료)
- 녹화 완료 후 FTP 서버로 파일 자동 업로드
- 강의실마다 사용하는 교수가 다르므로 사용자 매핑 필요

### 핵심 기능 5가지

```
┌──────────────────────────────────────────────────────────────┐
│                  녹화기 관리 시스템 (5대 기능)                   │
│                                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌───────┐ │
│  │ ① 녹화기 │ │ ② 녹화기 │ │ ③ FTP    │ │ ④ 상태 │ │ ⑤ 파일│ │
│  │   등록    │ │   제어    │ │   관리    │ │   확인  │ │  관리  │ │
│  │          │ │          │ │          │ │        │ │       │ │
│  │ 건물/공간│ │ PTZ 제어 │ │ FTP 설정 │ │ ON/OFF │ │ 목록  │ │
│  │ 매핑 등록│ │ 녹화 제어│ │ 자동전송 │ │ 사용자 │ │ 다운  │ │
│  │ 사용자   │ │ 프리셋   │ │ 재시도   │ │ 모니터 │ │ 로드  │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ └───────┘ │
│                                                                │
│  LNB: 녹화기 등록 | 녹화기 제어 | 녹화 이력 | 녹화파일 | FTP설정 │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. 메뉴 구조

### GNB 변경

| menu_seq | 현재 | 변경 후 | 비고 |
|----------|------|---------|------|
| 3 | 화면공유 (screen-share) | **녹화기관리** (recorder) | GNB명 + 코드 변경 |

### LNB 신규 (녹화기관리 하위)

| menu_seq | 메뉴명 | 코드 | 경로 | 순서 | 설명 |
|----------|--------|------|------|------|------|
| 31 | 녹화기 등록 | recorder-list | /recorder/list | 1 | 녹화기 CRUD + 사용자 배정 |
| 32 | 녹화기 제어 | recorder-control | /recorder/control | 2 | PTZ/녹화 실시간 제어 |
| 33 | 녹화 이력 | recorder-history | /recorder/history | 3 | 녹화 세션 이력 조회 |
| 34 | 녹화파일 관리 | recorder-files | /recorder/files | 4 | FTP 파일 목록/다운로드 |
| 35 | FTP 설정 | recorder-ftp | /recorder/ftp | 5 | FTP 서버 설정 관리 |

> 기존 화면공유 LNB (menu_seq 31, 32)는 soft delete 후 신규 메뉴로 대체

---

## 3. 전체 아키텍처

### 시스템 구성도

```
┌─────────────────────────────────────────────────────────────┐
│                    Console (FE - Next.js)                    │
│  녹화기 등록 | 제어 UI (PTZ패드) | 파일관리 | FTP설정 | 이력   │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API (/api/v1/recorders/*)
┌──────────────────────▼──────────────────────────────────────┐
│                     API (BE - NestJS)                        │
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Recorders  │ │ Recorder   │ │ FTP      │ │ Health     │ │
│  │ Module     │ │ Control    │ │ Module   │ │ Monitor    │ │
│  │            │ │ Module     │ │          │ │ (Cron)     │ │
│  │ CRUD       │ │ PTZ/녹화   │ │ 설정CRUD │ │ 30초 주기   │ │
│  │ 사용자배정 │ │ 프리셋     │ │ 파일관리 │ │ 상태체크    │ │
│  └─────┬──────┘ └─────┬──────┘ └────┬─────┘ └──────┬─────┘ │
└────────┼──────────────┼─────────────┼───────────────┼───────┘
         │              │             │               │
    ┌────▼────┐   ┌─────▼─────┐  ┌───▼────┐   ┌─────▼──────┐
    │MariaDB  │   │녹화기      │  │FTP     │   │녹화기       │
    │ 7 tables│   │HTTP API   │  │Server  │   │Ping + API  │
    │         │   │PTZ/녹화   │  │파일저장 │   │Health Check│
    └─────────┘   └───────────┘  └────────┘   └────────────┘
```

### 통신 흐름

| 구간 | 프로토콜 | 설명 |
|------|----------|------|
| FE → BE | REST API (HTTPS) | 녹화기 CRUD, 제어 명령, 파일 조회/다운로드 |
| BE → 녹화기 | HTTP API | PTZ, 녹화 시작/종료, 프리셋, 상태 확인 |
| BE → FTP | FTP/SFTP | 파일 목록 조회, 다운로드 스트림 중계 |
| 녹화기 → FTP | FTP Push | 녹화 완료 후 자동 업로드 (녹화기 자체 기능) |
| BE (Cron) → 녹화기 | HTTP Ping/API | 30초~1분 주기 상태 체크 |

### 녹화-FTP 업로드 흐름

```
[교수가 녹화 시작]
     │
     ▼
[콘솔 FE] ──POST /control/record/start──▶ [BE API]
                                             │
                                             ▼
                                        [녹화기 HTTP API 호출]
                                        녹화기 자체 녹화 시작
                                             │
                                      (녹화 진행 중...)
                                             │
[교수가 녹화 종료]
     │
     ▼
[콘솔 FE] ──POST /control/record/stop──▶ [BE API]
                                             │
                                             ▼
                                        [녹화기 HTTP API 호출]
                                        녹화기 자체 녹화 종료
                                             │
                                             ▼
                                        [녹화기 → FTP 자동 Push]
                                        (녹화기에 FTP 설정 사전 등록)
                                             │
                                             ▼
                                        [BE Cron: FTP 파일 감지]
                                        tb_recording_file 레코드 생성
                                        ftp_status = 'COMPLETED'
                                             │
                                        (실패 시)
                                             ▼
                                        ftp_status = 'FAILED'
                                        ftp_retry_count++
                                        최대 3회 자동 재시도 (Cron)
```

---

## 4. DB 설계

### ERD

```mermaid
erDiagram
    tb_building ||--o{ tb_space : "has"
    tb_space ||--o| tb_recorder : "has 0..1"
    tb_recorder ||--o{ tb_recorder_user : "assigned to"
    tb_users ||--o{ tb_recorder_user : "uses"
    tb_recorder ||--o{ tb_recorder_preset : "has"
    tb_recorder ||--o{ tb_recording_session : "records"
    tb_users ||--o{ tb_recording_session : "starts"
    tb_recorder_preset }o--o{ tb_recording_session : "used in"
    tb_recording_session ||--o{ tb_recording_file : "produces"
    tb_ftp_config }o--o{ tb_recording_file : "uploaded via"
    tb_recorder ||--o| tb_ftp_config : "configured with"
    tb_recorder ||--o{ tb_recorder_log : "logs"
    tb_users ||--o{ tb_recorder_log : "executed by"

    tb_recorder {
        int recorder_seq PK "녹화기 시퀀스"
        int space_seq FK_UK "공간 시퀀스 (1:1)"
        varchar recorder_name "녹화기명"
        varchar recorder_ip "고정 IP"
        int recorder_port "통신 포트 (기본 80)"
        enum recorder_protocol "HTTP ONVIF RTSP"
        varchar recorder_username "녹화기 로그인 ID"
        varchar recorder_password "녹화기 로그인 PW (AES)"
        varchar recorder_model "모델명"
        enum recorder_status "ONLINE OFFLINE ERROR"
        int current_user_seq FK "현재 사용자"
        datetime last_health_check "마지막 상태 확인"
        char recorder_isdel "삭제여부"
    }

    tb_recorder_user {
        int recorder_user_seq PK "시퀀스"
        int recorder_seq FK "녹화기"
        int tu_seq FK "사용자(교수)"
        char is_default "기본 사용자"
        char recorder_user_isdel "삭제여부"
    }

    tb_recorder_preset {
        int rec_preset_seq PK "프리셋 시퀀스"
        int recorder_seq FK "녹화기"
        varchar preset_name "프리셋명"
        int preset_number "녹화기 내부 번호"
        float pan_value "Pan"
        float tilt_value "Tilt"
        float zoom_value "Zoom"
        char preset_isdel "삭제여부"
    }

    tb_ftp_config {
        int ftp_config_seq PK "FTP설정 시퀀스"
        int recorder_seq FK "녹화기(NULL=글로벌)"
        varchar ftp_name "설정명"
        varchar ftp_host "호스트"
        int ftp_port "포트"
        varchar ftp_username "계정"
        varchar ftp_password "비밀번호 (AES)"
        varchar ftp_path "업로드 경로"
        enum ftp_protocol "FTP SFTP FTPS"
        char is_default "기본 설정"
        char ftp_isdel "삭제여부"
    }

    tb_recording_session {
        int rec_session_seq PK "세션 시퀀스"
        int recorder_seq FK "녹화기"
        int tu_seq FK "녹화 시작 사용자"
        enum session_status "RECORDING COMPLETED FAILED CANCELLED"
        int rec_preset_seq FK "사용 프리셋"
        varchar session_title "강의명"
        datetime started_at "시작"
        datetime ended_at "종료"
        int duration_sec "녹화 시간(초)"
    }

    tb_recording_file {
        int rec_file_seq PK "파일 시퀀스"
        int rec_session_seq FK "세션"
        varchar file_name "파일명"
        bigint file_size "크기(bytes)"
        varchar file_format "포맷"
        enum ftp_status "PENDING UPLOADING COMPLETED FAILED RETRY"
        int ftp_config_seq FK "FTP설정"
        varchar ftp_uploaded_path "업로드 경로"
        int ftp_retry_count "재시도 횟수"
        char file_isdel "삭제여부"
    }

    tb_recorder_log {
        int rec_log_seq PK "로그 시퀀스"
        int recorder_seq FK "녹화기"
        int tu_seq FK "실행자"
        enum log_type "PTZ REC_START REC_STOP PRESET STATUS POWER"
        enum result_status "SUCCESS FAIL TIMEOUT"
        datetime executed_at "실행 시각"
    }
```

### 신규 테이블 요약

| # | 테이블명 | 설명 | 주요 관계 |
|---|----------|------|-----------|
| 1 | `tb_recorder` | 녹화기 마스터 | tb_space 1:1 |
| 2 | `tb_recorder_user` | 녹화기-교수 매핑 | tb_recorder N:M tb_users |
| 3 | `tb_recorder_preset` | PTZ 프리셋 | tb_recorder 1:N |
| 4 | `tb_ftp_config` | FTP 서버 설정 | tb_recorder 1:N (NULL=글로벌) |
| 5 | `tb_recording_session` | 녹화 세션 | tb_recorder 1:N |
| 6 | `tb_recording_file` | 녹화 파일 | tb_recording_session 1:N |
| 7 | `tb_recorder_log` | 명령 실행 로그 | tb_recorder 1:N |

### 설계 포인트

| 항목 | 설계 판단 | 근거 |
|------|----------|------|
| tb_recorder vs tb_space_device | 별도 테이블 신설 | PTZ/FTP/세션 등 녹화기 고유 기능이 많아 generic device에 맞지 않음 |
| uk_recorder_space UNIQUE | 공간당 녹화기 1대 보장 | 요구사항 "각호실 1대씩" 반영 |
| current_user_seq 비정규화 | tb_recorder에 직접 보관 | "누가 사용하는지" 빠른 조회 |
| recorder_password / ftp_password | AES 암호화 | API 호출 시 복호화 필요 (bcrypt 단방향 불가) |
| tb_ftp_config.recorder_seq NULL 허용 | 글로벌 기본 설정 지원 | NULL=전체 공용, 값=전용 FTP |
| ftp_retry_count 최대 3회 | Cron 기반 자동 재시도 | 무한 재시도 방지 |

> DDL 스크립트: `docs/init_database.sql` 하단에 추가됨

---

## 5. BE 개발 업무

### 모듈 구조

```
apps/api/src/modules/recorders/
├── recorders.module.ts              // 모듈 정의
├── recorders.controller.ts          // 녹화기 CRUD + 사용자 배정
├── recorders.service.ts             // 녹화기 비즈니스 로직
├── recorder-control.controller.ts   // PTZ / 녹화 제어
├── recorder-control.service.ts      // 녹화기 HTTP 통신 래퍼
├── recorder-health.service.ts       // 상태 모니터링 Cron
├── dto/
│   ├── create-recorder.dto.ts
│   ├── update-recorder.dto.ts
│   ├── assign-user.dto.ts
│   ├── ptz-command.dto.ts
│   ├── recording-command.dto.ts
│   ├── create-preset.dto.ts
│   └── update-preset.dto.ts
├── entities/
│   ├── recorder.entity.ts
│   ├── recorder-user.entity.ts
│   ├── recorder-preset.entity.ts
│   ├── recording-session.entity.ts
│   ├── recording-file.entity.ts
│   └── recorder-log.entity.ts
└── enums/
    ├── recorder-status.enum.ts
    ├── recorder-protocol.enum.ts
    ├── session-status.enum.ts
    ├── ftp-status.enum.ts
    └── log-type.enum.ts

apps/api/src/modules/ftp/
├── ftp.module.ts
├── ftp.controller.ts                // FTP 설정 CRUD + 연결 테스트
├── ftp.service.ts                   // FTP 클라이언트 래퍼
├── ftp-upload.service.ts            // 업로드 상태 관리 + 재시도 Cron
├── dto/
│   ├── create-ftp-config.dto.ts
│   └── update-ftp-config.dto.ts
└── entities/
    └── ftp-config.entity.ts

apps/api/src/modules/recordings/
├── recordings.module.ts
├── recordings.controller.ts         // 세션 이력 + 파일 관리
├── recordings.service.ts
└── dto/
    └── query-recordings.dto.ts
```

### API 엔드포인트 요약

> 상세 스펙: `docs/api/recorder.api.md` 참조

| # | 그룹 | 엔드포인트 수 | 설명 |
|---|------|-------------|------|
| 1 | 녹화기 CRUD | 8개 | 목록/상세/등록/수정/삭제 + 사용자 배정 |
| 2 | 녹화기 제어 | 5개 | PTZ/녹화시작/녹화종료/프리셋적용/상태 |
| 3 | 프리셋 관리 | 4개 | CRUD |
| 4 | 녹화 세션/파일 | 5개 | 이력조회/파일목록/다운로드/재시도 |
| 5 | FTP 설정 | 5개 | CRUD + 연결 테스트 |
| 6 | 녹화기 로그 | 1개 | 명령 로그 조회 |

### 핵심 기술 사항

| 영역 | 구현 방식 | npm 패키지 |
|------|----------|-----------|
| 녹화기 통신 | HttpService로 녹화기 HTTP API 호출 | `@nestjs/axios` |
| 상태 모니터링 | Cron 30초~1분 주기 | `@nestjs/schedule` |
| FTP 클라이언트 | FTP/SFTP 접속 | `basic-ftp` / `ssh2-sftp-client` |
| 파일 다운로드 | FTP → Stream → Response pipe | 메모리 절약 스트림 방식 |
| FTP 재시도 | 실패 시 자동 재시도 (최대 3회) | `@nestjs/schedule` Cron |
| 비밀번호 암호화 | AES-256-CBC 양방향 암호화 | `crypto` (내장) |

---

## 6. FE 개발 업무

### 페이지 구조

```
apps/console/src/app/(dashboard)/recorder/
├── layout.tsx                       // 녹화기관리 레이아웃
├── list/
│   └── page.tsx                     // 녹화기 등록/관리
├── control/
│   └── page.tsx                     // 녹화기 제어 (PTZ + 녹화)
├── history/
│   └── page.tsx                     // 녹화 세션 이력
├── files/
│   └── page.tsx                     // 녹화파일 관리
└── ftp/
    └── page.tsx                     // FTP 설정

apps/console/src/components/recorder/
├── recorder-register-dialog.tsx     // 녹화기 등록/수정 다이얼로그
├── recorder-user-select.tsx         // 사용자 배정 컴포넌트
├── ptz-control-pad.tsx              // PTZ 방향 패드 UI
├── zoom-slider.tsx                  // 줌 슬라이더
├── preset-button-group.tsx          // 프리셋 버튼 그룹
├── recording-control-panel.tsx      // 녹화 시작/종료 패널
├── recorder-status-badge.tsx        // 상태 배지 (ONLINE/OFFLINE/ERROR)
├── ftp-config-dialog.tsx            // FTP 설정 다이얼로그
└── ftp-status-badge.tsx             // FTP 업로드 상태 배지
```

### 페이지별 UI 구성

#### (1) 녹화기 등록 (`/recorder/list`)

| 구성요소 | 설명 |
|----------|------|
| 필터바 | 건물 Select + 상태 필터 + 검색 |
| DataTable | No, 건물, 호실, IP, 상태 배지, 사용자, 관리 버튼 |
| 등록 Dialog | 건물→호실 연동 Select, IP/포트/프로토콜, 로그인 정보, 사용자 배정 |

#### (2) 녹화기 제어 (`/recorder/control`)

| 구성요소 | 설명 |
|----------|------|
| 좌측 | 건물/호실 Select → 녹화기 상태 정보 (현재 사용자, 녹화 상태) |
| 우측 상단 | PTZ 방향 패드 (상하좌우 + 줌 슬라이더) |
| 우측 중간 | 프리셋 버튼 그룹 (칠판, 강단, 전체 등) + 프리셋 추가 |
| 우측 하단 | 녹화 시작/종료 버튼 + 강의명 입력 |

#### (3) 녹화 이력 (`/recorder/history`)

| 구성요소 | 설명 |
|----------|------|
| 필터바 | 건물/기간/상태 필터 |
| DataTable | No, 건물, 호실, 강의명, 사용자, 시작시각, 시간, 상태 |

#### (4) 녹화파일 관리 (`/recorder/files`)

| 구성요소 | 설명 |
|----------|------|
| 필터바 | 건물/FTP상태/기간 필터 |
| DataTable | No, 파일명, 크기, 포맷, FTP상태, 업로드일, 다운로드/재시도 버튼 |

#### (5) FTP 설정 (`/recorder/ftp`)

| 구성요소 | 설명 |
|----------|------|
| DataTable | No, 설정명, 호스트, 프로토콜, 기본설정, 관리 버튼 |
| 설정 Dialog | 호스트/포트/계정/비밀번호/경로/프로토콜/패시브모드 + 연결 테스트 버튼 |

---

## 7. 개발 단계

| 단계 | 작업 | BE | FE | 의존성 |
|------|------|-----|-----|--------|
| **Phase 1** | DB 테이블 생성 + Entity 작성 | DDL 실행, Entity 코드 | - | 없음 |
| **Phase 2** | 녹화기 CRUD + 사용자 배정 | API 구현 | 녹화기 목록/등록 페이지 | Phase 1 |
| **Phase 3** | FTP 설정 | API 구현 + 연결 테스트 | FTP 설정 페이지 | Phase 1 |
| **Phase 4** | 녹화기 제어 (PTZ/녹화) | 제어 API + 녹화기 통신 | 제어 UI (PTZ패드, 녹화버튼) | Phase 2 |
| **Phase 5** | 프리셋 관리 | 프리셋 CRUD API | 프리셋 등록/적용 UI | Phase 4 |
| **Phase 6** | 녹화 세션/파일 관리 | 세션 이력 + 파일 API | 이력/파일 페이지 | Phase 4, 3 |
| **Phase 7** | 상태 모니터링 | Health Check Cron | 상태 배지 실시간 반영 | Phase 2 |
| **Phase 8** | FTP 업로드 관리 | 자동 업로드 + 재시도 Cron | 업로드 상태 표시 + 재시도 | Phase 3, 6 |

> Phase 2~3은 병렬 개발 가능 (의존성 없음)
> Phase 4~5는 순차 진행 (제어 → 프리셋)
