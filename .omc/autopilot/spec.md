# NFC(RFID) 시스템 PRD

> **Version**: 2.0 (피드백 반영)
> **Date**: 2026-02-12
> **Status**: REVIEW PENDING
> **Branch**: feature/nfc

---

## 1. 개요

건국대학교 WAVE 플랫폼에 NFC 기반 출입/장비제어 시스템을 구축한다.
ACR122U USB NFC 리더기로 카드/스마트폰을 태깅하면, 해당 공간의 장비(프로젝터, 스크린, 조명 등)가 자동으로 ON/OFF되는 시스템이다.

### 3대 기능

| 기능 | 설명 |
|------|------|
| **태그관리** | 카드/폰 자동등록 + 관리자 승인 워크플로우 (건대 직원 확인) |
| **리더기관리** | 리더기 ↔ 호실 매핑, 전체 ON/OFF 제공 |
| **태깅로그** | 태깅 이력 리스트 |

### 핵심 시나리오

```
[시나리오 A: 최초 등록 (한번태그)]
  교수가 101호 리더기에 카드 최초 태깅
  → Agent: UID 읽기 → POST /nfc/tag
  → BE: 미등록 카드 → tb_nfc_log에 UNKNOWN 기록 → Agent에 "미등록" 응답
  → Agent: 경고 부저
  → 관리자: 콘솔 태그관리에서 미등록 태그 확인
  → 관리자: 사용자 매핑 + 건물/호실 접근 권한 설정 → 승인(ACTIVE)
  → tb_nfc_card 생성 + tb_user_building 매핑

[시나리오 B: 승인 후 입실]
  교수가 101호 리더기에 카드 태깅 (승인된 카드)
  → BE: 카드 확인(ACTIVE) → 권한 확인 → ENTER 판단
  → 101호 장비 전체 POWER_ON → 부저 1회 비프
  → tb_nfc_log + tb_control_log 기록

[시나리오 C: 퇴실]
  교수가 같은 리더기에 다시 태깅
  → BE: 마지막 로그 ENTER → 이번은 EXIT
  → 101호 장비 전체 POWER_OFF → 부저 1회 비프
```

---

## 2. 현재 상태 (As-Is)

### 2.1 이미 구축된 것 (변경 불필요)

| 구성요소 | 상태 | 위치 |
|----------|------|------|
| **DB 스키마** (3 테이블) | ✅ 완료 | `docs/init_database.sql` |
| **공유 타입** (15+ 인터페이스) | ✅ 완료 | `packages/types/src/nfc.types.ts` |
| **NFC Agent 앱** (ACR122U) | ✅ 완료 | `apps/nfc/` |
| **API 스펙** (15 엔드포인트) | ✅ 완료 | `docs/api/nfc.api.md` |
| **컨트롤러 시스템** (장비제어) | ✅ 완료 | `apps/api/src/modules/controller/` |

### 2.2 구축 필요 (To-Be)

| 구성요소 | 우선순위 | 설명 |
|----------|----------|------|
| **BE NFC 모듈** | CRITICAL | Entity, DTO, Service, Controller, Guard |
| **app.module.ts 통합** | CRITICAL | NfcModule 등록 |
| **API 스펙 보완** | HIGH | 미등록 태그 조회 엔드포인트 추가 |
| **.http 테스트 파일** | HIGH | 전체 엔드포인트 테스트 |
| **FE RFID 페이지** | MEDIUM | 이번 스코프: BE만. FE는 별도 진행 |

---

## 3. DB 스키마 (기존 테이블 사용 - 생성 금지)

### 3.1 tb_nfc_reader (리더기 마스터)

```sql
-- 이미 존재하는 테이블. 신규 생성 금지.
reader_seq          INT AUTO_INCREMENT PK
space_seq           INT NOT NULL           -- FK → tb_space (호실 매핑)
reader_name         VARCHAR(100) NOT NULL  -- 리더기명
reader_code         VARCHAR(50) NOT NULL   -- 자동생성 (RDR-001~999), UNIQUE
reader_serial       VARCHAR(100) NULL      -- 하드웨어 시리얼 (ACR122U 고유값)
reader_api_key      VARCHAR(100) NOT NULL  -- Agent 인증키, UNIQUE
reader_status       ENUM('ACTIVE','INACTIVE') DEFAULT 'ACTIVE'
reader_isdel        CHAR DEFAULT 'N'
reg_date, upd_date  DATETIME
```

### 3.2 tb_nfc_card (카드/태그 마스터)

```sql
card_seq            INT AUTO_INCREMENT PK
tu_seq              INT NOT NULL           -- FK → tb_users (소유자) ⚠️ NOT NULL
card_identifier     VARCHAR(64) NOT NULL   -- UID 또는 앱 고유값, UNIQUE
card_aid            VARCHAR(32) NULL       -- AID (HEX)
card_label          VARCHAR(100) NULL      -- 별칭
card_type           ENUM('CARD','PHONE') DEFAULT 'CARD'
card_status         ENUM('ACTIVE','INACTIVE','BLOCKED') DEFAULT 'ACTIVE'
card_isdel          CHAR DEFAULT 'N'
reg_date, upd_date  DATETIME
```

> **⚠️ 중요**: `tu_seq`가 NOT NULL이므로 사용자 매핑 없이 카드를 등록할 수 없다.
> 따라서 "자동등록"은 tb_nfc_card에 즉시 INSERT가 아니라, **tb_nfc_log에 UNKNOWN으로 기록**하여 미등록 태그를 캡처하는 방식이다.
> 관리자가 승인 시 사용자를 매핑하면서 tb_nfc_card에 INSERT한다.

### 3.3 tb_nfc_log (태깅 로그)

```sql
nfc_log_seq         INT AUTO_INCREMENT PK
reader_seq          INT NOT NULL           -- FK → tb_nfc_reader
card_seq            INT NULL               -- FK → tb_nfc_card (미등록 시 NULL) ← 자동등록의 핵심
tu_seq              INT NULL               -- FK → tb_users (미등록 시 NULL)
space_seq           INT NOT NULL           -- FK → tb_space (비정규화)
log_type            ENUM('ENTER','EXIT','DENIED','UNKNOWN') NOT NULL
tag_identifier      VARCHAR(64) NOT NULL   -- 태깅 시 읽힌 원본 식별값 ← 미등록 카드 추적에 사용
tag_aid             VARCHAR(32) NULL       -- 태깅 시 읽힌 AID
control_result      ENUM('SUCCESS','FAIL','PARTIAL','SKIPPED') NULL
control_detail      TEXT NULL              -- 장비별 제어 결과 JSON
tagged_at           DATETIME DEFAULT CURRENT_TIMESTAMP
```

### 3.4 관련 기존 테이블 (참조만)

| 테이블 | 용도 | NFC에서의 역할 |
|--------|------|----------------|
| `tb_space` | 공간(호실) 마스터 | 리더기 설치 호실 |
| `tb_building` | 건물 마스터 | 공간 → 건물 조인 |
| `tb_users` | 사용자 | 카드 소유자, 건대 직원 확인 |
| `tb_user_building` | 사용자-건물 매핑 | **권한 확인** (사용자가 해당 건물에 접근 가능한지) |
| `tb_space_device` | 공간-장비 매핑 | ENTER/EXIT 시 제어할 장비 목록 |
| `tb_preset_command` | 프리셋 명령어 | POWER_ON/POWER_OFF 명령어 |
| `tb_control_log` | 제어 로그 | NFC 트리거 제어 기록 (trigger_type='NFC') |

---

## 4. 시스템 아키텍처

### 4.1 전체 흐름

```
┌──────────────┐     USB      ┌──────────────┐    HTTP     ┌──────────────┐
│  NFC Card/   │ ──────────── │  ACR122U     │ ────────── │  NestJS API  │
│  Phone       │   태깅       │  + NFC Agent │  POST      │  (BE)        │
│              │              │  (apps/nfc)  │  /nfc/tag  │              │
└──────────────┘              └──────────────┘            └──────┬───────┘
                                    ▲                           │
                                    │ 부저 피드백                │
                                    │                           ▼
                              ┌─────┴────────┐    ┌──────────────────────────┐
                              │ Agent 응답   │    │  처리 분기               │
                              │ 처리         │    │                          │
                              └──────────────┘    │  미등록 → UNKNOWN 로그   │
                                                  │  승인카드 → ENTER/EXIT   │
                                                  │    → 장비 ON/OFF         │
                                                  │  차단/무권한 → DENIED    │
                                                  └──────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  관리자 콘솔 (JWT 인증)                                │
│                                                        │
│  [태그관리]          [리더기관리]       [태깅로그]      │
│   - 미등록 태그 목록   - 리더기 CRUD     - 태깅 이력   │
│   - 승인 워크플로우    - 호실 매핑       - 필터/검색   │
│   - 카드 CRUD         - API Key 관리                   │
│   - 사용자 매핑                                        │
│   - 건물/호실 권한                                     │
└────────────────────────────────────────────────────────┘
```

### 4.2 인증 체계

| 영역 | 인증 방식 | 헤더 |
|------|-----------|------|
| Agent 태깅 (`POST /nfc/tag`) | **API Key** | `X-NFC-Api-Key: rdr_xxxxx` |
| 콘솔 관리 (나머지 전부) | **JWT Bearer** | `Authorization: Bearer {token}` |

**JwtAuthGuard 바이패스**: `POST /nfc/tag`에 `@Public()` 데코레이터 적용 → 전역 JwtAuthGuard 스킵 → 커스텀 `NfcApiKeyGuard`로 API Key 검증

### 4.3 BE 모듈 구조 (신규 생성)

```
apps/api/src/modules/nfc/
├── nfc.module.ts                    # NestJS 모듈 정의
├── nfc.controller.ts                # 16개 엔드포인트 (단일 컨트롤러)
├── services/
│   ├── nfc-tag.service.ts           # 핵심: 태깅 처리 + 장비 제어
│   ├── nfc-reader.service.ts        # 리더기 CRUD + 호실 매핑
│   ├── nfc-card.service.ts          # 카드 CRUD + 미등록 태그 조회 + 승인
│   ├── nfc-log.service.ts           # 태깅 로그 조회
│   └── nfc-stats.service.ts         # 대시보드 통계
├── dto/
│   ├── nfc-tag.dto.ts               # 태깅 요청 DTO
│   ├── nfc-reader.dto.ts            # 리더기 CRUD DTO
│   ├── nfc-card.dto.ts              # 카드 CRUD + 승인 DTO
│   └── nfc-log-query.dto.ts         # 로그 조회 파라미터
├── entities/
│   ├── tb-nfc-reader.entity.ts      # 리더기 Entity
│   ├── tb-nfc-card.entity.ts        # 카드 Entity
│   └── tb-nfc-log.entity.ts         # 로그 Entity
└── guards/
    └── nfc-api-key.guard.ts         # X-NFC-Api-Key 검증 Guard
```

---

## 5. 카드 자동등록 + 승인 워크플로우 (핵심 변경)

### 5.1 전체 흐름

```
[Phase 1: 최초 태깅 - 자동 캡처]

  사용자가 카드를 리더기에 태깅 (최초)
      │
      ▼
  POST /nfc/tag { identifier: "04A1B2C3D4E5F6" }
      │
      ▼
  tb_nfc_card에서 card_identifier 조회 → 없음 (미등록)
      │
      ▼
  tb_nfc_log에 기록:
    - card_seq: NULL
    - tu_seq: NULL
    - log_type: 'UNKNOWN'
    - tag_identifier: '04A1B2C3D4E5F6'  ← 식별값 캡처
    - tag_aid: 'D4100000030001' (있으면)
      │
      ▼
  Agent에 UNKNOWN 응답 → 경고 부저


[Phase 2: 관리자 승인]

  관리자가 콘솔 태그관리 화면 진입
      │
      ▼
  GET /nfc/cards/unregistered → 미등록 태그 목록
    [
      { identifier: "04A1B2C3D4E5F6", aid: "D410...", firstTaggedAt: "...", tagCount: 3, lastReaderName: "101호 리더기" }
    ]
      │
      ▼
  관리자가 미등록 태그 선택 → 승인 폼 작성:
    - 사용자 선택 (건대 직원 목록에서)
    - 카드 별칭 입력 (예: "김교수 카드")
    - 카드 유형 선택 (CARD / PHONE)
    - 건물/호실 접근 권한 설정
      │
      ▼
  POST /nfc/cards (승인 = 카드 등록)
    {
      "tuSeq": 5,
      "cardIdentifier": "04A1B2C3D4E5F6",
      "cardAid": "D4100000030001",
      "cardLabel": "김교수 카드",
      "cardType": "CARD"
    }
      │
      ▼
  tb_nfc_card INSERT (card_status: 'ACTIVE')
  tb_user_building INSERT (필요시, 건물 접근 권한)
      │
      ▼
  이후 태깅부터 ENTER/EXIT 정상 동작


[Phase 3: 승인 후 태깅]

  사용자가 같은 카드로 태깅
      │
      ▼
  tb_nfc_card에서 조회 → 있음 (card_status: 'ACTIVE')
      │
      ▼
  건물 권한 확인 (tb_user_building) → 통과
      │
      ▼
  ENTER/EXIT 토글 → 장비 제어 → 로그 기록 → 성공 응답
```

### 5.2 미등록 태그 조회 API (신규)

```
GET /nfc/cards/unregistered
```

tb_nfc_log에서 `card_seq IS NULL`인 레코드 중 고유한 `tag_identifier`를 추출하여, 이미 tb_nfc_card에 등록된 identifier를 제외한 목록을 반환한다.

**Query Parameters:**

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | number | N | 1 | 페이지 번호 |
| limit | number | N | 10 | 페이지당 항목 수 |

**Response (200):**

```json
{
  "items": [
    {
      "tagIdentifier": "04A1B2C3D4E5F6",
      "tagAid": "D4100000030001",
      "firstTaggedAt": "2026-02-12T09:00:00.000Z",
      "lastTaggedAt": "2026-02-12T10:30:00.000Z",
      "tagCount": 3,
      "lastReaderName": "101호 입구 리더기",
      "lastSpaceName": "101호"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

**SQL 로직:**

```sql
SELECT
  nl.tag_identifier AS tagIdentifier,
  MAX(nl.tag_aid) AS tagAid,
  MIN(nl.tagged_at) AS firstTaggedAt,
  MAX(nl.tagged_at) AS lastTaggedAt,
  COUNT(*) AS tagCount,
  -- 마지막 태깅 리더기 정보 (서브쿼리)
  (SELECT r.reader_name FROM tb_nfc_log nl2
   JOIN tb_nfc_reader r ON nl2.reader_seq = r.reader_seq
   WHERE nl2.tag_identifier = nl.tag_identifier AND nl2.card_seq IS NULL
   ORDER BY nl2.tagged_at DESC LIMIT 1) AS lastReaderName,
  (SELECT s.space_name FROM tb_nfc_log nl3
   JOIN tb_space s ON nl3.space_seq = s.space_seq
   WHERE nl3.tag_identifier = nl.tag_identifier AND nl3.card_seq IS NULL
   ORDER BY nl3.tagged_at DESC LIMIT 1) AS lastSpaceName
FROM tb_nfc_log nl
WHERE nl.card_seq IS NULL
  AND nl.tag_identifier NOT IN (
    SELECT card_identifier FROM tb_nfc_card WHERE card_isdel = 'N'
  )
GROUP BY nl.tag_identifier
ORDER BY MAX(nl.tagged_at) DESC
```

### 5.3 승인 시 건물/호실 권한 설정

카드 승인(POST /nfc/cards) 시 사용자에게 건물 접근 권한도 함께 부여할 수 있다.

**옵션 A**: 카드 등록 API에 `buildingSeqs` 배열 포함 → 동시에 tb_user_building에 INSERT
**옵션 B**: 카드 등록은 순수 CRUD, 건물 권한은 기존 권한 관리 모듈에서 별도 처리

**권장: 옵션 A** - 승인 시 한 번에 처리 (UX 관점에서 자연스러움)

```json
// POST /nfc/cards - 승인 요청 (확장)
{
  "tuSeq": 5,
  "cardIdentifier": "04A1B2C3D4E5F6",
  "cardAid": "D4100000030001",
  "cardLabel": "김교수 카드",
  "cardType": "CARD",
  "buildingSeqs": [1, 2]       // 접근 가능 건물 목록 (선택)
}
```

> `buildingSeqs` 포함 시:
> - 해당 사용자의 기존 tb_user_building 매핑은 유지
> - 새 건물만 추가 INSERT (UPSERT 패턴, 중복 무시)

---

## 6. POST /nfc/tag 태깅 처리 (상세)

### 6.1 처리 흐름

```
[1] API Key 검증 (NfcApiKeyGuard)
    ├─ X-NFC-Api-Key 헤더 추출
    ├─ tb_nfc_reader WHERE reader_api_key=? AND reader_isdel='N'
    ├─ 없음 → 401 Unauthorized
    └─ reader_status='INACTIVE' → 403 Forbidden

[2] 카드 식별
    ├─ body.identifier → tb_nfc_card WHERE card_identifier=? AND card_isdel='N'
    │
    ├─ [없음: 미등록 카드] ─────────────────────────────┐
    │   tb_nfc_log 기록 (card_seq=NULL, log_type=UNKNOWN) │
    │   return { result: 'UNKNOWN', message: '미등록 카드' }│
    │                                                       │
    ├─ [card_status='INACTIVE'] ────────────────────────────┤
    │   tb_nfc_log 기록 (log_type=DENIED)                   │
    │   return { result: 'DENIED', message: '미승인 카드' }  │
    │                                                       │
    ├─ [card_status='BLOCKED'] ─────────────────────────────┤
    │   tb_nfc_log 기록 (log_type=DENIED)                   │
    │   return { result: 'DENIED', message: '차단된 카드' }  │
    │                                                       │
    └─ [card_status='ACTIVE'] → 다음 단계                   │

[3] 권한 확인
    ├─ card.tu_seq → tb_users (사용자 확인)
    ├─ reader.space_seq → tb_space → building_seq (건물 확인)
    ├─ tb_user_building WHERE tu_seq=? AND building_seq=?
    └─ 없음 → DENIED (권한 없음)

[4] ENTER/EXIT 토글 판단
    ├─ tb_nfc_log에서 동일 reader_seq + card_seq의 마지막 ENTER/EXIT 로그 조회
    ├─ 마지막이 ENTER → 이번은 EXIT
    ├─ 마지막이 EXIT 또는 없음 → 이번은 ENTER
    └─ DENIED/UNKNOWN 로그는 토글에 영향 없음

[5] 장비 제어
    ├─ reader.space_seq로 tb_space_device 조회 (ACTIVE, device_isdel='N')
    ├─ 장비 없음 → controlResult=SKIPPED, 제어 건너뜀
    ├─ ENTER → commandType='POWER_ON'
    ├─ EXIT → commandType='POWER_OFF'
    ├─ 각 장비 프리셋에서 해당 commandType 명령어 찾기
    ├─ sendCommand() 호출 (TCP/UDP/WOL/HTTP)
    └─ tb_control_log에 기록 (trigger_type='NFC')

[6] NFC 로그 기록
    └─ tb_nfc_log 1건 (control_detail에 장비별 결과 JSON)

[7] 응답 반환
    └─ { result, logType, spaceName, userName, controlResult, controlSummary, message }
```

### 6.2 에지 케이스 처리

| 상황 | 처리 | result | logType |
|------|------|--------|---------|
| **미등록 카드** (최초 태깅) | 로그 캡처, 장비 제어 X | UNKNOWN | UNKNOWN |
| 미승인 카드 (INACTIVE) | 로그 기록, 장비 제어 X | DENIED | DENIED |
| 차단된 카드 (BLOCKED) | 로그 기록, 장비 제어 X | DENIED | DENIED |
| 건물 권한 없음 | 로그 기록, 장비 제어 X | DENIED | DENIED |
| 공간에 장비 없음 | 로그 기록, controlResult=SKIPPED | SUCCESS | ENTER/EXIT |
| 장비 전체 성공 | 정상 | SUCCESS | ENTER/EXIT |
| 장비 일부 실패 | 부분 성공 | PARTIAL | ENTER/EXIT |
| 장비 전체 실패 | 로그 기록 | SUCCESS | ENTER/EXIT |

> **설계 원칙**: 장비 제어 실패와 관계없이 `logType`은 ENTER/EXIT로 기록. `controlResult`로 장비 상태를 별도 추적.

---

## 7. NFC API Key Guard

```
@Injectable()
export class NfcApiKeyGuard implements CanActivate {
  - request.headers['x-nfc-api-key'] 추출
  - tb_nfc_reader WHERE reader_api_key=? AND reader_isdel='N'
  - 없음 → 401 UnauthorizedException
  - reader_status='INACTIVE' → 403 ForbiddenException
  - request.nfcReader = { readerSeq, spaceSeq, readerName, ... } 주입
  - return true
}
```

컨트롤러 적용:

```typescript
@Public()                    // JwtAuthGuard 바이패스
@UseGuards(NfcApiKeyGuard)   // API Key 검증
@Post('tag')
async tag(@Body() dto, @Req() req) {
  return this.nfcTagService.processTag(dto, req.nfcReader);
}
```

---

## 8. 리더기관리 (CRUD + 호실 매핑)

### 8.1 핵심 개념

리더기 1대 = 호실 1개 매핑 (`space_seq`).
리더기에 태깅하면 매핑된 호실의 장비가 전체 ON/OFF.

### 8.2 자동 코드/키 생성

```
readerCode: 'RDR-001' ~ 'RDR-999' (자동 증가, 수정 불가)
readerApiKey: 'rdr_' + UUID v4 (자동 생성, 재발급 가능)
```

### 8.3 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /nfc/readers | 리더기 목록 (페이징, 검색, 필터) |
| GET | /nfc/readers/:readerSeq | 리더기 상세 (API Key 포함) |
| POST | /nfc/readers | 리더기 등록 (호실 매핑 + 코드/키 자동생성) |
| PUT | /nfc/readers/:readerSeq | 리더기 수정 (호실 변경 가능, 코드/키 변경 불가) |
| DELETE | /nfc/readers/:readerSeq | 리더기 삭제 (소프트) |
| POST | /nfc/readers/:readerSeq/regenerate-key | API Key 재발급 |

---

## 9. 태그관리 (CRUD + 승인 워크플로우)

### 9.1 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| **GET** | **/nfc/cards/unregistered** | **미등록 태그 목록 (신규)** |
| GET | /nfc/cards | 등록된 카드 목록 (페이징, 검색, 필터) |
| GET | /nfc/cards/:cardSeq | 카드 상세 (태깅 횟수 포함) |
| POST | /nfc/cards | 카드 등록/승인 (사용자 매핑 + 건물 권한) |
| PUT | /nfc/cards/:cardSeq | 카드 수정 (identifier 변경 불가) |
| DELETE | /nfc/cards/:cardSeq | 카드 삭제 (소프트) |

### 9.2 관리자 태그관리 화면 흐름

```
[태그관리 페이지]
  │
  ├─ [탭 1: 미등록 태그] ← GET /nfc/cards/unregistered
  │   │  identifier | AID | 최초 태깅 | 태깅 횟수 | 마지막 리더기 | [승인]
  │   │
  │   └─ [승인 버튼 클릭]
  │       → 승인 모달/폼:
  │         - 사용자 선택 (드롭다운, 건대 직원 목록)
  │         - 카드 별칭 입력
  │         - 유형 선택 (CARD/PHONE)
  │         - 건물 선택 (접근 가능 건물, 다중 선택)
  │       → POST /nfc/cards (승인 실행)
  │
  └─ [탭 2: 등록된 카드] ← GET /nfc/cards
      │  소유자 | 식별값 | 별칭 | 유형 | 상태 | 마지막 태깅 | [수정] [삭제] [차단]
      │
      ├─ 상태 변경: PUT /nfc/cards/:cardSeq { cardStatus: 'BLOCKED' }
      └─ 삭제: DELETE /nfc/cards/:cardSeq
```

---

## 10. 태깅로그

### 10.1 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /nfc/logs | 태깅 로그 목록 (페이징, 필터, 날짜범위) |
| GET | /nfc/logs/:nfcLogSeq | 태깅 로그 상세 (장비별 제어 결과 포함) |
| GET | /nfc/stats | NFC 대시보드 통계 |

### 10.2 로그 목록 (JOIN)

```sql
SELECT nl.*,
  r.reader_name, r.reader_code,
  s.space_name, b.building_name,
  u.tu_name AS userName, c.card_label
FROM tb_nfc_log nl
LEFT JOIN tb_nfc_reader r ON nl.reader_seq = r.reader_seq
LEFT JOIN tb_space s ON nl.space_seq = s.space_seq
LEFT JOIN tb_building b ON s.building_seq = b.building_seq
LEFT JOIN tb_nfc_card c ON nl.card_seq = c.card_seq
LEFT JOIN tb_users u ON nl.tu_seq = u.tu_seq
ORDER BY nl.tagged_at DESC
```

### 10.3 로그 상세 - control_detail 파싱

```
tb_nfc_log.control_detail (TEXT) 에 JSON 문자열 저장
→ 상세 API에서 JSON.parse하여 controlDetails 배열로 반환
→ 항목: { spaceDeviceSeq, deviceName, commandType, resultStatus, resultMessage }
```

---

## 11. ControlService 연동

### 11.1 전략

기존 `ControlService`의 `executeBatch()`를 직접 호출하지 않고, **`executeForNfc()` public 메서드를 추가**한다.

이유:
- `executeBatch()`는 JWT 인증된 사용자 기준, NFC는 카드 소유자 기준
- `trigger_type`을 `'NFC'`로 저장해야 함 (기존은 `'MANUAL'` 기본값)
- 반환 형식이 NFC 로그용 `control_detail` JSON에 맞춰야 함

### 11.2 executeForNfc() 설계

```typescript
// ControlService에 추가
async executeForNfc(
  spaceSeq: number,
  commandType: 'POWER_ON' | 'POWER_OFF',
  tuSeq: number,  // 카드 소유자
): Promise<{
  results: Array<{
    spaceDeviceSeq: number;
    deviceName: string;
    commandType: string;
    resultStatus: 'SUCCESS' | 'FAIL' | 'TIMEOUT';
    resultMessage: string | null;
  }>;
  successCount: number;
  failCount: number;
}> {
  // 1. 해당 공간의 활성 장비 조회 (device_isdel='N', device_status='ACTIVE')
  // 2. 각 장비의 프리셋에서 commandType 명령어 찾기
  // 3. sendCommand() 호출 (기존 private → 내부 호출)
  // 4. tb_control_log에 기록 (trigger_type='NFC', tu_seq=카드소유자)
  // 5. 결과 반환
}
```

### 11.3 모듈 의존성

```
NfcModule
  imports: [ControlModule]  ← ControlService 주입

ControlModule
  exports: [ControlService]  ← 이미 되어 있음
```

---

## 12. 엔드포인트 전체 요약 (16개)

| # | Method | Endpoint | 인증 | 설명 |
|---|--------|----------|------|------|
| 1 | POST | /nfc/tag | API Key | Agent 태깅 처리 |
| 2 | GET | /nfc/readers | JWT | 리더기 목록 |
| 3 | GET | /nfc/readers/:readerSeq | JWT | 리더기 상세 |
| 4 | POST | /nfc/readers | JWT | 리더기 등록 |
| 5 | PUT | /nfc/readers/:readerSeq | JWT | 리더기 수정 |
| 6 | DELETE | /nfc/readers/:readerSeq | JWT | 리더기 삭제 |
| 7 | POST | /nfc/readers/:readerSeq/regenerate-key | JWT | API Key 재발급 |
| **8** | **GET** | **/nfc/cards/unregistered** | **JWT** | **미등록 태그 목록 (신규)** |
| 9 | GET | /nfc/cards | JWT | 등록된 카드 목록 |
| 10 | GET | /nfc/cards/:cardSeq | JWT | 카드 상세 |
| 11 | POST | /nfc/cards | JWT | 카드 등록/승인 |
| 12 | PUT | /nfc/cards/:cardSeq | JWT | 카드 수정 |
| 13 | DELETE | /nfc/cards/:cardSeq | JWT | 카드 삭제 |
| 14 | GET | /nfc/logs | JWT | 태깅 로그 목록 |
| 15 | GET | /nfc/logs/:nfcLogSeq | JWT | 태깅 로그 상세 |
| 16 | GET | /nfc/stats | JWT | NFC 대시보드 통계 |

---

## 13. 개발 작업 목록

### Phase 1: BE NFC 모듈

| # | 작업 | 파일 | 설명 |
|---|------|------|------|
| 1 | Entity | `entities/tb-nfc-reader.entity.ts` | 리더기 테이블 매핑 |
| 2 | Entity | `entities/tb-nfc-card.entity.ts` | 카드 테이블 매핑 |
| 3 | Entity | `entities/tb-nfc-log.entity.ts` | 로그 테이블 매핑 |
| 4 | Guard | `guards/nfc-api-key.guard.ts` | API Key 검증 |
| 5 | DTO | `dto/nfc-tag.dto.ts` | 태깅 요청 |
| 6 | DTO | `dto/nfc-reader.dto.ts` | 리더기 CRUD |
| 7 | DTO | `dto/nfc-card.dto.ts` | 카드 CRUD + 승인 (buildingSeqs) |
| 8 | DTO | `dto/nfc-log-query.dto.ts` | 로그 조회 |
| 9 | Service | `services/nfc-tag.service.ts` | **핵심** 태깅 + 장비제어 |
| 10 | Service | `services/nfc-reader.service.ts` | 리더기 CRUD + 코드/키 |
| 11 | Service | `services/nfc-card.service.ts` | 카드 CRUD + 미등록 조회 + 승인 |
| 12 | Service | `services/nfc-log.service.ts` | 로그 조회 |
| 13 | Service | `services/nfc-stats.service.ts` | 통계 |
| 14 | Controller | `nfc.controller.ts` | 16개 엔드포인트 |
| 15 | Module | `nfc.module.ts` | 모듈 정의 |
| 16 | 기존 수정 | `control.service.ts` | executeForNfc() 추가 |
| 17 | 기존 수정 | `app.module.ts` | NfcModule 등록 |

### Phase 2: 테스트

| # | 작업 | 파일 |
|---|------|------|
| 18 | .http 테스트 | `apps/api/test/nfc.http` (16개 엔드포인트) |
| 19 | ACR122U 실기기 | 자동등록 → 승인 → ENTER/EXIT 풀 시나리오 |

### Phase 3: API 스펙 업데이트

| # | 작업 | 파일 |
|---|------|------|
| 20 | 스펙 추가 | `docs/api/nfc.api.md` (미등록 태그 API 추가) |

---

## 14. 비기능 요구사항

### 14.1 보안
- API Key 평문 저장 (UUID v4 기반, 충분히 랜덤)
- API Key는 상세 조회에서만 노출
- POST /nfc/tag는 @Public() + NfcApiKeyGuard

### 14.2 성능
- 태깅 응답 < 2초 (장비 제어 포함)
- 장비 제어 타임아웃: 5초
- 모든 조회 인덱스 활용 (이미 생성됨)

### 14.3 가용성
- NFC Agent 오프라인 큐: 최대 100건
- 장비 제어 실패해도 로그는 항상 기록

---

## 15. ACR122U 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | **미등록 카드 최초 태깅** | UNKNOWN + 경고 부저 + 로그 캡처 |
| 2 | 콘솔에서 미등록 태그 확인 | GET /nfc/cards/unregistered에 표시 |
| 3 | 관리자가 사용자 매핑 + 승인 | POST /nfc/cards → ACTIVE |
| 4 | **승인된 카드로 태깅** | ENTER + 장비 POWER_ON + 비프 |
| 5 | 같은 카드로 재태깅 | EXIT + 장비 POWER_OFF + 비프 |
| 6 | 권한 없는 건물 태깅 | DENIED + 경고 부저 |
| 7 | 차단된 카드 태깅 | DENIED + 경고 부저 |
| 8 | BE 서버 다운 중 태깅 | 오프라인 큐 저장 |

---

## 16. 결정 사항 (피드백 반영)

| 항목 | 결정 |
|------|------|
| 카드 등록 방식 | **자동 캡처** (최초 태깅 시 tb_nfc_log에 기록) + 관리자 승인 |
| 한번태그 의미 | 최초 1회 등록용 태깅 → 이후 ENTER/EXIT 토글 |
| 승인 시 정보 | 사용자 매핑 + 건물/호실 접근 권한 (tb_user_building) |
| ControlService 연동 | executeForNfc() public 메서드 추가 |
| FE 범위 | BE만 (FE는 별도 진행) |

---

## 17. 요약

| 항목 | 내용 |
|------|------|
| **3대 기능** | 태그관리(승인 워크플로우), 리더기관리(호실 매핑), 태깅로그 |
| **개발 범위** | BE NFC 모듈 17개 파일 + .http 테스트 + API 스펙 보완 |
| **신규 테이블** | 없음 (기존 3개 테이블 사용) |
| **신규 API** | GET /nfc/cards/unregistered (미등록 태그 조회) |
| **핵심 흐름** | 최초 태깅(캡처) → 관리자 승인 → ENTER/EXIT 장비제어 |
| **인증** | API Key (Agent) / JWT (콘솔) |
| **기존 수정** | ControlService + app.module.ts |
| **테스트** | .http 16개 엔드포인트 + ACR122U 실기기 |
