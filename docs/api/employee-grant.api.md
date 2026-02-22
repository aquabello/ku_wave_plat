# Employee Grant API (직원 메뉴 권한 관리)

직원의 메뉴 접근 권한을 조회/수정하는 API.
PHP 레거시 `reqEmployee`의 `EMPLOYEE_GRANT`, `EMPLOYEE_GRANT_MOD`에 대응합니다.

> **Note**: 이 기능은 이미 Menus 모듈에 구현되어 있습니다.

## Endpoints

| Method | Path | Auth | Description | PHP 대응 |
|--------|------|------|-------------|----------|
| GET | `/api/v1/menus/users/:seq` | JWT Bearer | 사용자 메뉴 권한 조회 | EMPLOYEE_GRANT |
| PUT | `/api/v1/menus/users/:seq` | JWT Bearer | 사용자 메뉴 권한 일괄 저장 | EMPLOYEE_GRANT_MOD |

## GET /api/v1/menus/users/:seq

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| seq | number | Yes | 사용자 시퀀스 (tu_seq) |

### Headers
| Header | Value | Required |
|--------|-------|----------|
| Authorization | Bearer {accessToken} | Yes |

### Response (200)
```json
{
  "userSeq": 1,
  "menuSeqs": [1, 11, 12, 6, 61, 62, 63],
  "menuTree": [
    {
      "menuSeq": 1,
      "menuName": "컨트롤러",
      "menuCode": "controller",
      "menuOrder": 1,
      "children": [
        {
          "menuSeq": 11,
          "menuName": "하드웨어 설정",
          "menuCode": "controller-hardware",
          "menuPath": "/controller/hardware",
          "menuOrder": 1
        }
      ]
    }
  ]
}
```

## PUT /api/v1/menus/users/:seq

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| seq | number | Yes | 사용자 시퀀스 (tu_seq) |

### Headers
| Header | Value | Required |
|--------|-------|----------|
| Authorization | Bearer {accessToken} | Yes |
| Content-Type | application/json | Yes |

### Request Body
```json
{
  "menuSeqs": [1, 11, 12, 6, 61, 62, 63]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| menuSeqs | number[] | Yes | 허용할 메뉴 시퀀스 배열 (전체 교체) |

### Response (200)
Same as GET response above.

## 에러 응답

### 401 Unauthorized - 인증 실패
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden - 권한 없음
```json
{
  "statusCode": 403,
  "message": "권한이 없습니다."
}
```

### 404 Not Found - 사용자 없음
```json
{
  "statusCode": 404,
  "message": "존재하지 않는 사용자입니다."
}
```

## 레거시 매핑

| PHP 함수 | NestJS 대응 | 비고 |
|----------|------------|------|
| reqEmployee > EMPLOYEE_GRANT | GET /api/v1/menus/users/:seq | 동일 기능 |
| reqEmployee > EMPLOYEE_GRANT_MOD | PUT /api/v1/menus/users/:seq | 동일 기능, 메뉴 시퀀스 배열로 일괄 저장 |

## 변경 이력

| 버전 | 일자 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-02-22 | 초기 작성 |
