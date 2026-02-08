# Buildings API

Base URL: `http://localhost:8000/api/v1`
인증: 모든 요청에 `Authorization: Bearer {accessToken}` 필수

---

## GET /buildings

건물 리스트 조회 (페이징 + 검색). 삭제된 건물(building_isdel='Y') 제외.

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | number | N | 1 | 페이지 번호 (1부터) |
| limit | number | N | 10 | 페이지당 항목 수 (1~100) |
| search | string | N | - | 통합 검색 (건물명, 건물코드 LIKE) |

### Response (200)

```json
{
  "items": [
    {
      "no": 4,
      "buildingSeq": 1,
      "buildingName": "공학관 A동",
      "buildingCode": "BLD-001",
      "buildingLocation": "서울시 광진구",
      "buildingFloorCount": 10,
      "playerCount": 0,
      "assignedUserCount": 0
    }
  ],
  "total": 4,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| items[].no | number | 번호 (역순) |
| items[].buildingSeq | number | 건물 시퀀스 (PK) |
| items[].buildingName | string | 건물명 |
| items[].buildingCode | string | 건물 코드 (BLD-XXX) |
| items[].buildingLocation | string/null | 위치 설명 |
| items[].buildingFloorCount | number | 층수 |
| items[].playerCount | number | 플레이어 수 (추후 연동) |
| items[].assignedUserCount | number | 할당 사용자 수 (추후 연동) |
| total | number | 전체 수 |
| page | number | 현재 페이지 |
| limit | number | 페이지당 항목 수 |
| totalPages | number | 전체 페이지 수 |

### 정렬

- `building_name ASC` (건물명 오름차순)

---

## GET /buildings/:seq

건물 상세 조회.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| seq | number | 건물 시퀀스 |

### Response (200)

```json
{
  "buildingSeq": 1,
  "buildingName": "공학관 A동",
  "buildingCode": "BLD-001",
  "buildingLocation": "서울시 광진구",
  "buildingFloorCount": 10,
  "buildingOrder": 1,
  "buildingManagerName": "김담당",
  "buildingManagerPhone": "010-9999-8888",
  "buildingIsdel": "N",
  "regDate": "2026-01-01T00:00:00.000Z",
  "updDate": "2026-01-15T09:00:00.000Z"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 건물을 찾을 수 없습니다 |

---

## POST /buildings

건물 등록. 건물코드(BLD-XXX)는 자동 생성 (최대 999개).

### Request Body

```json
{
  "buildingName": "공학관 A동",
  "buildingLocation": "서울시 광진구",
  "buildingFloorCount": 10,
  "buildingOrder": 1,
  "buildingManagerName": "김담당",
  "buildingManagerPhone": "010-9999-8888"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| buildingName | string | Y | 건물명 |
| buildingLocation | string | N | 위치 설명 |
| buildingFloorCount | number | N | 층수 (기본 0) |
| buildingOrder | number | N | 정렬 순서 (기본 0) |
| buildingManagerName | string | N | 담당자명 |
| buildingManagerPhone | string | N | 담당자 연락처 |

### Response (201)

등록된 건물 정보 반환. `buildingCode`는 자동 생성 (BLD-001, BLD-002, ...).

### Error Responses

| Status | 설명 |
|--------|------|
| 409 | 건물 코드가 최대치(BLD-999)를 초과했습니다 |

---

## PUT /buildings/:seq

건물 수정. `buildingCode`는 수정 불가.

### Request Body

```json
{
  "buildingName": "공학관 B동",
  "buildingLocation": "서울시 광진구 능동로",
  "buildingFloorCount": 12,
  "buildingOrder": 2,
  "buildingManagerName": "박담당",
  "buildingManagerPhone": "010-1111-2222"
}
```

모든 필드 선택 사항 (보낸 필드만 수정됨).

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 건물을 찾을 수 없습니다 |

---

## DELETE /buildings/:seq

건물 삭제 (소프트 삭제, building_isdel='Y').

### Response (200)

```json
{
  "message": "건물이 삭제되었습니다"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 건물을 찾을 수 없습니다 |
