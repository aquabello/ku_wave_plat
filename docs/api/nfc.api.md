# NFC API (RFID 시스템)

Base URL: `http://localhost:8000/api/v1`

> NFC 시스템은 3개 영역으로 구성됩니다:
> - **Agent 태깅** (`POST /nfc/tag`): NFC Agent 전용 엔드포인트 (API Key 인증)
> - **리더기 관리** (`/nfc/readers`): 콘솔에서 리더기 CRUD (JWT 인증)
> - **태그 관리** (`/nfc/cards`): 콘솔에서 카드/폰 CRUD (JWT 인증)
> - **로그** (`/nfc/logs`): 태깅 이력 조회 (JWT 인증)

---

# 1. Agent 태깅 (NFC Agent → BE)

## POST /nfc/tag

NFC Agent가 태깅 감지 시 호출하는 핵심 엔드포인트.
JWT 인증이 아닌 **API Key 인증**을 사용합니다.

### 인증

| 헤더 | 값 | 설명 |
|------|------|------|
| X-NFC-Api-Key | `rdr_xxxxxxxx...` | 리더기 등록 시 발급된 API Key |

> `Authorization: Bearer` 헤더 불필요. JwtAuthGuard에서 이 엔드포인트만 제외.

### Request Body

```json
{
  "identifier": "04A1B2C3D4E5F6",
  "aid": "D4100000030001"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| identifier | string | Y | 카드 고유 식별값 (UID 또는 앱 반환 고유값) |
| aid | string | N | Application Identifier (HEX) |

### 처리 흐름

```
1. X-NFC-Api-Key → tb_nfc_reader (reader_seq, space_seq 확인)
2. identifier → tb_nfc_card (card_seq, tu_seq 확인)
3. space → building → tb_user_building (권한 확인)
4. 마지막 tb_nfc_log (같은 reader + card) → ENTER/EXIT 토글
5. ENTER → POWER_ON / EXIT → POWER_OFF (공간 전체 장비)
6. tb_control_log N건 + tb_nfc_log 1건 기록
7. 응답 반환
```

### Response (200) - 정상 입실

```json
{
  "result": "SUCCESS",
  "logType": "ENTER",
  "spaceName": "101호",
  "userName": "김교수",
  "controlResult": "SUCCESS",
  "controlSummary": {
    "totalDevices": 3,
    "successCount": 3,
    "failCount": 0
  },
  "message": "입실 처리 완료. 장비 3대 전원 ON"
}
```

### Response (200) - 정상 퇴실

```json
{
  "result": "SUCCESS",
  "logType": "EXIT",
  "spaceName": "101호",
  "userName": "김교수",
  "controlResult": "SUCCESS",
  "controlSummary": {
    "totalDevices": 3,
    "successCount": 3,
    "failCount": 0
  },
  "message": "퇴실 처리 완료. 장비 3대 전원 OFF"
}
```

### Response (200) - 부분 성공

```json
{
  "result": "PARTIAL",
  "logType": "ENTER",
  "spaceName": "101호",
  "userName": "김교수",
  "controlResult": "PARTIAL",
  "controlSummary": {
    "totalDevices": 3,
    "successCount": 2,
    "failCount": 1
  },
  "message": "입실 처리. 장비 2/3대 성공"
}
```

### Response (200) - 미등록 카드

```json
{
  "result": "UNKNOWN",
  "logType": "UNKNOWN",
  "spaceName": "101호",
  "userName": null,
  "controlResult": null,
  "controlSummary": null,
  "message": "미등록 카드입니다"
}
```

### Response (200) - 권한 없음

```json
{
  "result": "DENIED",
  "logType": "DENIED",
  "spaceName": "101호",
  "userName": "김교수",
  "controlResult": null,
  "controlSummary": null,
  "message": "이 공간에 대한 접근 권한이 없습니다"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| result | string | 처리 결과 (SUCCESS/PARTIAL/DENIED/UNKNOWN/ERROR) |
| logType | string | 태깅 유형 (ENTER/EXIT/DENIED/UNKNOWN) |
| spaceName | string | 리더기가 설치된 공간명 |
| userName | string/null | 카드 소유자 이름 (미등록 시 null) |
| controlResult | string/null | 장비 제어 결과 (SUCCESS/FAIL/PARTIAL/SKIPPED) |
| controlSummary | object/null | 제어 요약 |
| message | string | Agent 피드백용 메시지 |

> Agent는 `result` 값으로 부저 피드백을 제어합니다:
> - SUCCESS → 짧은 비프 1회
> - PARTIAL → 짧은 비프 2회
> - DENIED/UNKNOWN → 긴 비프 1회
> - ERROR → 긴 비프 3회

### Error Responses

| Status | 설명 |
|--------|------|
| 401 | 유효하지 않은 API Key |
| 403 | 비활성 리더기 (INACTIVE) |
| 500 | 서버 내부 오류 |

> 모든 경우(미등록, 권한 없음 포함)에서 200을 반환합니다.
> Agent가 HTTP 상태코드로 단순 분기할 수 있도록, 비즈니스 로직 결과는 body.result로 전달합니다.
> 401/403은 리더기 자체 문제일 때만 사용합니다.

---

# 2. 리더기 관리 (콘솔)

인증: 모든 요청에 `Authorization: Bearer {accessToken}` 필수

## GET /nfc/readers

리더기 목록 조회 (페이징 + 검색). 삭제된 리더기(reader_isdel='Y') 제외.

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | number | N | 1 | 페이지 번호 (1부터) |
| limit | number | N | 10 | 페이지당 항목 수 (1~100) |
| search | string | N | - | 통합 검색 (리더기명, 리더기코드 LIKE) |
| buildingSeq | number | N | - | 건물 필터 |
| spaceSeq | number | N | - | 공간 필터 |
| status | string | N | - | 상태 필터 (ACTIVE/INACTIVE) |

### Response (200)

```json
{
  "items": [
    {
      "no": 5,
      "readerSeq": 1,
      "readerName": "101호 입구 리더기",
      "readerCode": "RDR-001",
      "readerSerial": "ACR122U-S1234567",
      "readerStatus": "ACTIVE",
      "spaceSeq": 1,
      "spaceName": "101호",
      "buildingName": "공학관 A동",
      "regDate": "2026-02-09T00:00:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| items[].no | number | 번호 (역순) |
| items[].readerSeq | number | 리더기 시퀀스 (PK) |
| items[].readerName | string | 리더기명 |
| items[].readerCode | string | 리더기 코드 (RDR-XXX) |
| items[].readerSerial | string/null | 시리얼번호 |
| items[].readerStatus | string | 상태 (ACTIVE/INACTIVE) |
| items[].spaceSeq | number | 설치 공간 시퀀스 |
| items[].spaceName | string | 설치 공간명 |
| items[].buildingName | string | 건물명 |
| items[].regDate | string | 등록일 |

### 정렬

- `reader_code ASC`

---

## GET /nfc/readers/:readerSeq

리더기 상세 조회. API Key 포함.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| readerSeq | number | 리더기 시퀀스 |

### Response (200)

```json
{
  "readerSeq": 1,
  "readerName": "101호 입구 리더기",
  "readerCode": "RDR-001",
  "readerSerial": "ACR122U-S1234567",
  "readerApiKey": "rdr_a1b2c3d4e5f6g7h8i9j0",
  "readerStatus": "ACTIVE",
  "spaceSeq": 1,
  "spaceName": "101호",
  "spaceFloor": "1",
  "buildingSeq": 1,
  "buildingName": "공학관 A동",
  "readerIsdel": "N",
  "regDate": "2026-02-09T00:00:00.000Z",
  "updDate": "2026-02-09T09:00:00.000Z"
}
```

> `readerApiKey`는 상세 조회에서만 노출됩니다. 목록 조회에서는 제외.

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 리더기를 찾을 수 없습니다 |

---

## POST /nfc/readers

리더기 등록. `readerCode`(RDR-XXX)와 `readerApiKey`는 자동 생성.

### Request Body

```json
{
  "spaceSeq": 1,
  "readerName": "101호 입구 리더기",
  "readerSerial": "ACR122U-S1234567"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| spaceSeq | number | Y | 설치 공간 시퀀스 |
| readerName | string | Y | 리더기명 |
| readerSerial | string | N | 시리얼번호 (하드웨어 고유값) |

### Response (201)

등록된 리더기 정보 반환. `readerCode`는 자동 생성(RDR-001~RDR-999). `readerApiKey`는 자동 생성(UUID v4, `rdr_` prefix).

> 생성 응답에 `readerApiKey`가 포함됩니다. 이 값을 NFC Agent의 config.json에 설정합니다.

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 공간을 찾을 수 없습니다 |
| 409 | 리더기 코드가 최대치(RDR-999)를 초과했습니다 |

---

## PUT /nfc/readers/:readerSeq

리더기 수정. `readerCode`, `readerApiKey`는 수정 불가.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| readerSeq | number | 리더기 시퀀스 |

### Request Body

```json
{
  "spaceSeq": 2,
  "readerName": "102호 입구 리더기 (이전)",
  "readerSerial": "ACR122U-S1234567",
  "readerStatus": "ACTIVE"
}
```

모든 필드 선택 사항 (보낸 필드만 수정됨).

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 리더기를 찾을 수 없습니다 |

---

## DELETE /nfc/readers/:readerSeq

리더기 삭제 (소프트 삭제, reader_isdel='Y').

### Response (200)

```json
{
  "message": "리더기가 삭제되었습니다"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 리더기를 찾을 수 없습니다 |

---

## POST /nfc/readers/:readerSeq/regenerate-key

API Key 재발급. 기존 키는 즉시 무효화됨.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| readerSeq | number | 리더기 시퀀스 |

### Response (200)

```json
{
  "readerSeq": 1,
  "readerApiKey": "rdr_new_key_xxxxx",
  "message": "API Key가 재발급되었습니다. NFC Agent config를 업데이트하세요."
}
```

> 보안 사고 시 키를 즉시 교체할 수 있습니다.

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 리더기를 찾을 수 없습니다 |

---

# 3. 태그 관리 (콘솔)

인증: 모든 요청에 `Authorization: Bearer {accessToken}` 필수

## GET /nfc/cards

카드/태그 목록 조회 (페이징 + 검색). 삭제된 카드(card_isdel='Y') 제외.

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | number | N | 1 | 페이지 번호 (1부터) |
| limit | number | N | 10 | 페이지당 항목 수 (1~100) |
| search | string | N | - | 통합 검색 (카드 별칭, 소유자명, 식별값 LIKE) |
| type | string | N | - | 유형 필터 (CARD/PHONE) |
| status | string | N | - | 상태 필터 (ACTIVE/INACTIVE/BLOCKED) |

### Response (200)

```json
{
  "items": [
    {
      "no": 10,
      "cardSeq": 1,
      "tuSeq": 5,
      "userName": "김교수",
      "cardIdentifier": "04A1B2C3D4E5F6",
      "cardAid": "D4100000030001",
      "cardLabel": "김교수 스마트폰",
      "cardType": "PHONE",
      "cardStatus": "ACTIVE",
      "lastTaggedAt": "2026-02-09T09:00:00.000Z",
      "regDate": "2026-02-09T00:00:00.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| items[].no | number | 번호 (역순) |
| items[].cardSeq | number | 카드 시퀀스 (PK) |
| items[].tuSeq | number | 소유자 시퀀스 |
| items[].userName | string | 소유자 이름 |
| items[].cardIdentifier | string | 카드 고유 식별값 |
| items[].cardAid | string/null | AID (HEX) |
| items[].cardLabel | string/null | 카드 별칭 |
| items[].cardType | string | 유형 (CARD/PHONE) |
| items[].cardStatus | string | 상태 (ACTIVE/INACTIVE/BLOCKED) |
| items[].lastTaggedAt | string/null | 마지막 태깅 시각 (tb_nfc_log에서 조회) |
| items[].regDate | string | 등록일 |

### 정렬

- `reg_date DESC` (최신 등록순)

---

## GET /nfc/cards/:cardSeq

카드 상세 조회.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| cardSeq | number | 카드 시퀀스 |

### Response (200)

```json
{
  "cardSeq": 1,
  "tuSeq": 5,
  "userName": "김교수",
  "userEmail": "kim@konkuk.ac.kr",
  "cardIdentifier": "04A1B2C3D4E5F6",
  "cardAid": "D4100000030001",
  "cardLabel": "김교수 스마트폰",
  "cardType": "PHONE",
  "cardStatus": "ACTIVE",
  "cardIsdel": "N",
  "lastTaggedAt": "2026-02-09T09:00:00.000Z",
  "tagCount": 156,
  "regDate": "2026-02-09T00:00:00.000Z",
  "updDate": "2026-02-09T09:00:00.000Z"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| tagCount | number | 총 태깅 횟수 (tb_nfc_log COUNT) |

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 카드를 찾을 수 없습니다 |

---

## POST /nfc/cards

카드/태그 등록.

### Request Body

```json
{
  "tuSeq": 5,
  "cardIdentifier": "04A1B2C3D4E5F6",
  "cardAid": "D4100000030001",
  "cardLabel": "김교수 스마트폰",
  "cardType": "PHONE"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| tuSeq | number | Y | 소유자 시퀀스 |
| cardIdentifier | string | Y | 카드 고유 식별값 (UNIQUE) |
| cardAid | string | N | AID (HEX) |
| cardLabel | string | N | 카드 별칭 |
| cardType | string | N | 유형 (CARD/PHONE, 기본 CARD) |

### Response (201)

등록된 카드 정보 반환.

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 사용자를 찾을 수 없습니다 |
| 409 | 이미 등록된 식별값입니다 (card_identifier 중복) |

---

## PUT /nfc/cards/:cardSeq

카드 수정. `cardIdentifier`는 수정 불가.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| cardSeq | number | 카드 시퀀스 |

### Request Body

```json
{
  "tuSeq": 5,
  "cardAid": "D4100000030001",
  "cardLabel": "김교수 스마트폰 (교체)",
  "cardType": "PHONE",
  "cardStatus": "ACTIVE"
}
```

모든 필드 선택 사항 (보낸 필드만 수정됨).

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 카드를 찾을 수 없습니다 |

---

## DELETE /nfc/cards/:cardSeq

카드 삭제 (소프트 삭제, card_isdel='Y').

### Response (200)

```json
{
  "message": "카드가 삭제되었습니다"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 카드를 찾을 수 없습니다 |

---

# 4. NFC 로그 (콘솔)

인증: 모든 요청에 `Authorization: Bearer {accessToken}` 필수

## GET /nfc/logs

NFC 태깅 로그 조회 (페이징 + 필터).

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | number | N | 1 | 페이지 번호 (1부터) |
| limit | number | N | 20 | 페이지당 항목 수 (1~100) |
| buildingSeq | number | N | - | 건물 필터 |
| spaceSeq | number | N | - | 공간 필터 |
| readerSeq | number | N | - | 리더기 필터 |
| logType | string | N | - | 태깅 유형 필터 (ENTER/EXIT/DENIED/UNKNOWN) |
| controlResult | string | N | - | 제어 결과 필터 (SUCCESS/FAIL/PARTIAL/SKIPPED) |
| startDate | string | N | - | 시작일 (YYYY-MM-DD) |
| endDate | string | N | - | 종료일 (YYYY-MM-DD) |
| search | string | N | - | 통합 검색 (사용자명, 공간명 LIKE) |

### Response (200)

```json
{
  "items": [
    {
      "no": 500,
      "nfcLogSeq": 1,
      "readerName": "101호 입구 리더기",
      "readerCode": "RDR-001",
      "spaceName": "101호",
      "buildingName": "공학관 A동",
      "userName": "김교수",
      "cardLabel": "김교수 스마트폰",
      "logType": "ENTER",
      "tagIdentifier": "04A1B2C3D4E5F6",
      "controlResult": "SUCCESS",
      "controlSummary": {
        "totalDevices": 3,
        "successCount": 3,
        "failCount": 0
      },
      "taggedAt": "2026-02-09T09:00:00.000Z"
    },
    {
      "no": 499,
      "nfcLogSeq": 2,
      "readerName": "101호 입구 리더기",
      "readerCode": "RDR-001",
      "spaceName": "101호",
      "buildingName": "공학관 A동",
      "userName": null,
      "cardLabel": null,
      "logType": "UNKNOWN",
      "tagIdentifier": "AABBCCDDEE",
      "controlResult": null,
      "controlSummary": null,
      "taggedAt": "2026-02-09T08:50:00.000Z"
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 20,
  "totalPages": 25
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| items[].no | number | 번호 (역순) |
| items[].nfcLogSeq | number | NFC 로그 시퀀스 |
| items[].readerName | string | 리더기명 |
| items[].readerCode | string | 리더기 코드 |
| items[].spaceName | string | 공간명 |
| items[].buildingName | string | 건물명 |
| items[].userName | string/null | 사용자명 (미등록 시 null) |
| items[].cardLabel | string/null | 카드 별칭 (미등록 시 null) |
| items[].logType | string | 태깅 유형 (ENTER/EXIT/DENIED/UNKNOWN) |
| items[].tagIdentifier | string | 태깅 시 읽힌 식별값 (raw) |
| items[].controlResult | string/null | 장비 제어 결과 |
| items[].controlSummary | object/null | 제어 요약 (control_detail JSON에서 추출) |
| items[].taggedAt | string | 태깅 시각 (ISO 8601) |

### 정렬

- `tagged_at DESC` (최신순)

---

## GET /nfc/logs/:nfcLogSeq

NFC 로그 상세 조회. 장비별 제어 결과 포함.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| nfcLogSeq | number | NFC 로그 시퀀스 |

### Response (200)

```json
{
  "nfcLogSeq": 1,
  "readerSeq": 1,
  "readerName": "101호 입구 리더기",
  "readerCode": "RDR-001",
  "spaceSeq": 1,
  "spaceName": "101호",
  "buildingName": "공학관 A동",
  "cardSeq": 1,
  "userName": "김교수",
  "cardLabel": "김교수 스마트폰",
  "cardType": "PHONE",
  "logType": "ENTER",
  "tagIdentifier": "04A1B2C3D4E5F6",
  "tagAid": "D4100000030001",
  "controlResult": "SUCCESS",
  "controlDetails": [
    {
      "spaceDeviceSeq": 1,
      "deviceName": "101호 프로젝터",
      "commandType": "POWER_ON",
      "resultStatus": "SUCCESS",
      "resultMessage": "명령어 전송 완료"
    },
    {
      "spaceDeviceSeq": 2,
      "deviceName": "101호 스크린",
      "commandType": "POWER_ON",
      "resultStatus": "SUCCESS",
      "resultMessage": "명령어 전송 완료"
    },
    {
      "spaceDeviceSeq": 3,
      "deviceName": "101호 조명",
      "commandType": "POWER_ON",
      "resultStatus": "SUCCESS",
      "resultMessage": "명령어 전송 완료"
    }
  ],
  "taggedAt": "2026-02-09T09:00:00.000Z"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| controlDetails | array | 장비별 제어 결과 (control_detail JSON 파싱) |
| controlDetails[].spaceDeviceSeq | number | 공간장비 시퀀스 |
| controlDetails[].deviceName | string | 장비명 |
| controlDetails[].commandType | string | 실행된 명령 유형 |
| controlDetails[].resultStatus | string | 결과 (SUCCESS/FAIL/TIMEOUT) |
| controlDetails[].resultMessage | string/null | 결과 메시지 |

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 로그를 찾을 수 없습니다 |

---

# 5. NFC 대시보드 통계 (콘솔)

## GET /nfc/stats

NFC 시스템 현황 요약 (RFID 메인 대시보드용).

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| buildingSeq | number | N | - | 건물 필터 |

### Response (200)

```json
{
  "readers": {
    "total": 20,
    "active": 18,
    "inactive": 2
  },
  "cards": {
    "total": 150,
    "active": 140,
    "blocked": 5,
    "inactive": 5,
    "byType": {
      "CARD": 80,
      "PHONE": 70
    }
  },
  "today": {
    "totalTags": 234,
    "enters": 120,
    "exits": 110,
    "denied": 3,
    "unknown": 1
  },
  "activeSpaces": [
    {
      "spaceSeq": 1,
      "spaceName": "101호",
      "currentUser": "김교수",
      "enteredAt": "2026-02-09T09:00:00.000Z"
    }
  ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| readers | object | 리더기 현황 |
| cards | object | 카드 현황 |
| today | object | 오늘 태깅 통계 |
| activeSpaces | array | 현재 사용 중인 공간 (마지막 로그가 ENTER인 공간) |

---

# 엔드포인트 요약

| # | Method | Endpoint | 인증 | 설명 |
|---|--------|----------|------|------|
| 1 | POST | /nfc/tag | API Key | Agent 태깅 처리 |
| 2 | GET | /nfc/readers | JWT | 리더기 목록 |
| 3 | GET | /nfc/readers/:readerSeq | JWT | 리더기 상세 |
| 4 | POST | /nfc/readers | JWT | 리더기 등록 |
| 5 | PUT | /nfc/readers/:readerSeq | JWT | 리더기 수정 |
| 6 | DELETE | /nfc/readers/:readerSeq | JWT | 리더기 삭제 |
| 7 | POST | /nfc/readers/:readerSeq/regenerate-key | JWT | API Key 재발급 |
| 8 | GET | /nfc/cards | JWT | 카드 목록 |
| 9 | GET | /nfc/cards/:cardSeq | JWT | 카드 상세 |
| 10 | POST | /nfc/cards | JWT | 카드 등록 |
| 11 | PUT | /nfc/cards/:cardSeq | JWT | 카드 수정 |
| 12 | DELETE | /nfc/cards/:cardSeq | JWT | 카드 삭제 |
| 13 | GET | /nfc/logs | JWT | NFC 로그 목록 |
| 14 | GET | /nfc/logs/:nfcLogSeq | JWT | NFC 로그 상세 |
| 15 | GET | /nfc/stats | JWT | NFC 대시보드 통계 |
