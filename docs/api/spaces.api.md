# Spaces API (공간 관리)

Base URL: `http://localhost:8000/api/v1`
인증: 모든 요청에 `Authorization: Bearer {accessToken}` 필수

> 공간은 건물(tb_building)의 하위 리소스입니다. 모든 API는 건물 시퀀스를 경로에 포함합니다.

---

## GET /buildings/:buildingSeq/spaces

건물에 속한 공간 목록 조회 (페이징 + 검색). 삭제된 공간(space_isdel='Y') 제외.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| buildingSeq | number | 건물 시퀀스 |

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | number | N | 1 | 페이지 번호 (1부터) |
| limit | number | N | 10 | 페이지당 항목 수 (1~100) |
| search | string | N | - | 통합 검색 (공간명, 공간코드 LIKE) |
| floor | string | N | - | 층 필터 (예: "1", "B1") |
| type | string | N | - | 유형 필터 (강의실, 실험실, 사무실, 회의실, 기타) |

### Response (200)

```json
{
  "items": [
    {
      "no": 5,
      "spaceSeq": 1,
      "buildingSeq": 1,
      "spaceName": "101호",
      "spaceCode": "SPC-001",
      "spaceFloor": "1",
      "spaceType": "강의실",
      "spaceCapacity": 40,
      "spaceDescription": "멀티미디어 강의실",
      "spaceOrder": 1
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
| items[].spaceSeq | number | 공간 시퀀스 (PK) |
| items[].buildingSeq | number | 소속 건물 시퀀스 |
| items[].spaceName | string | 공간명 |
| items[].spaceCode | string | 공간 코드 (SPC-XXX) |
| items[].spaceFloor | string/null | 층 |
| items[].spaceType | string/null | 공간 유형 |
| items[].spaceCapacity | number | 수용 인원 |
| items[].spaceDescription | string/null | 공간 설명 |
| items[].spaceOrder | number | 정렬 순서 |
| total | number | 전체 수 |
| page | number | 현재 페이지 |
| limit | number | 페이지당 항목 수 |
| totalPages | number | 전체 페이지 수 |

### 정렬

- `space_order ASC, space_name ASC`

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 건물을 찾을 수 없습니다 |

---

## GET /buildings/:buildingSeq/spaces/:spaceSeq

공간 상세 조회.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| buildingSeq | number | 건물 시퀀스 |
| spaceSeq | number | 공간 시퀀스 |

### Response (200)

```json
{
  "spaceSeq": 1,
  "buildingSeq": 1,
  "spaceName": "101호",
  "spaceCode": "SPC-001",
  "spaceFloor": "1",
  "spaceType": "강의실",
  "spaceCapacity": 40,
  "spaceDescription": "멀티미디어 강의실",
  "spaceOrder": 1,
  "spaceIsdel": "N",
  "regDate": "2026-02-09T00:00:00.000Z",
  "updDate": "2026-02-09T09:00:00.000Z"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 공간을 찾을 수 없습니다 |

---

## POST /buildings/:buildingSeq/spaces

공간 등록. 공간코드(SPC-XXX)는 자동 생성 (최대 999개).

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| buildingSeq | number | 건물 시퀀스 |

### Request Body

```json
{
  "spaceName": "101호",
  "spaceFloor": "1",
  "spaceType": "강의실",
  "spaceCapacity": 40,
  "spaceDescription": "멀티미디어 강의실",
  "spaceOrder": 1
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| spaceName | string | Y | 공간명 |
| spaceFloor | string | N | 층 (예: "1", "B1") |
| spaceType | string | N | 공간 유형 (강의실/실험실/사무실/회의실/기타) |
| spaceCapacity | number | N | 수용 인원 (기본 0) |
| spaceDescription | string | N | 공간 설명/메모 |
| spaceOrder | number | N | 정렬 순서 (기본 0) |

### Response (201)

등록된 공간 정보 반환. `spaceCode`는 자동 생성 (SPC-001, SPC-002, ...).

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 건물을 찾을 수 없습니다 |
| 409 | 공간 코드가 최대치(SPC-999)를 초과했습니다 |

---

## PUT /buildings/:buildingSeq/spaces/:spaceSeq

공간 수정. `spaceCode`는 수정 불가.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| buildingSeq | number | 건물 시퀀스 |
| spaceSeq | number | 공간 시퀀스 |

### Request Body

```json
{
  "spaceName": "101호 (리모델링)",
  "spaceFloor": "1",
  "spaceType": "실험실",
  "spaceCapacity": 30,
  "spaceDescription": "리모델링 완료 실험실",
  "spaceOrder": 1
}
```

모든 필드 선택 사항 (보낸 필드만 수정됨).

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 공간을 찾을 수 없습니다 |

---

## DELETE /buildings/:buildingSeq/spaces/:spaceSeq

공간 삭제 (소프트 삭제, space_isdel='Y').

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| buildingSeq | number | 건물 시퀀스 |
| spaceSeq | number | 공간 시퀀스 |

### Response (200)

```json
{
  "message": "공간이 삭제되었습니다"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 공간을 찾을 수 없습니다 |

---

## 건물 목록 API 변경사항

### GET /buildings 응답에 spaceCount 추가

기존 `GET /buildings` 응답의 각 항목에 `spaceCount` 필드를 추가합니다.

```json
{
  "items": [
    {
      "no": 1,
      "buildingSeq": 1,
      "buildingName": "공학관 A동",
      "buildingCode": "BLD-001",
      "buildingLocation": "서울시 광진구",
      "buildingFloorCount": 10,
      "spaceCount": 15,
      "playerCount": 0,
      "assignedUserCount": 0
    }
  ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| items[].spaceCount | number | 해당 건물의 등록된 공간 수 (삭제 제외) |
