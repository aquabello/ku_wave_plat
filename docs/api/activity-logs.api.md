# Activity Logs API

Base URL: `http://localhost:8000/api/v1`
인증: 모든 요청에 `Authorization: Bearer {accessToken}` 필수

---

## GET /activity-logs

활동로그 리스트 조회 (페이징 + 검색 + 필터).

### 권한별 조회 범위

| 사용자 타입 | 조회 범위 |
|------------|----------|
| SUPER (관리자) | 전체 활동로그 |
| 일반 사용자 | **본인의 활동로그만** 조회 |

- 일반 사용자는 `tu_seq` 기준으로 자동 필터링 (별도 파라미터 불필요)
- 상세 조회(`GET /activity-logs/:seq`)도 동일하게 본인 로그만 접근 가능

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | number | N | 1 | 페이지 번호 (1부터) |
| limit | number | N | 10 | 페이지당 항목 수 (1~100) |
| search | string | N | - | 통합 검색 (사용자ID, 이름 LIKE) |
| httpMethod | string | N | - | HTTP 메서드 필터 (GET, POST, PUT, PATCH, DELETE) |
| actionName | string | N | - | 행위명 필터 (LIKE 검색, 예: "로그인", "건물") |
| startDate | string | N | - | 시작일 (YYYY-MM-DD) |
| endDate | string | N | - | 종료일 (YYYY-MM-DD) |

### Response (200)

```json
{
  "items": [
    {
      "no": 8,
      "logSeq": "8",
      "tuId": "admin",
      "tuName": "관리자",
      "actionName": "건물 목록 조회",
      "httpMethod": "GET",
      "requestUrl": "/api/v1/buildings?page=1&limit=10",
      "statusCode": 200,
      "durationMs": 48,
      "regDate": "2026-02-07T15:10:01.000Z"
    }
  ],
  "total": 8,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| items[].no | number | 번호 (역순) |
| items[].logSeq | string | 로그 시퀀스 (BIGINT) |
| items[].tuId | string/null | 사용자 아이디 (미인증 요청은 null) |
| items[].tuName | string/null | 사용자 이름 |
| items[].actionName | string/null | 행위명 (자동 매핑) |
| items[].httpMethod | string | HTTP 메서드 |
| items[].requestUrl | string | 요청 URL (쿼리스트링 포함) |
| items[].statusCode | number/null | HTTP 응답 코드 |
| items[].durationMs | number/null | 처리시간 (ms) |
| items[].regDate | Date/null | 발생일시 |
| total | number | 전체 수 |
| page | number | 현재 페이지 |
| limit | number | 페이지당 항목 수 |
| totalPages | number | 전체 페이지 수 |

### 행위명 자동 매핑 (actionName) — `GNB > LNB > 행위` 포맷

| 요청 | actionName |
|------|-----------|
| POST /auth/login | 인증 > 로그인 |
| POST /auth/logout | 인증 > 로그아웃 |
| POST /auth/refresh | 인증 > 토큰 갱신 |
| GET /users | 회원관리 > 사용자 목록 > 목록 조회 |
| POST /users | 회원관리 > 사용자 목록 > 등록 |
| GET /users/:seq | 회원관리 > 사용자 목록 > 상세 조회 |
| PUT /users/:seq | 회원관리 > 사용자 목록 > 수정 |
| DELETE /users/:seq | 회원관리 > 사용자 목록 > 삭제 |
| PATCH /users/:seq/reset-password | 회원관리 > 사용자 목록 > 비밀번호 초기화 |
| GET /permissions | 회원관리 > 권한 관리 > 목록 조회 |
| GET /menus | 회원관리 > 권한 관리 > 메뉴 트리 조회 |
| GET /menus/users/:seq | 회원관리 > 권한 관리 > 메뉴 권한 조회 |
| PUT /menus/users/:seq | 회원관리 > 권한 관리 > 메뉴 권한 저장 |
| GET /buildings | 환경설정 > 건물관리 > 목록 조회 |
| POST /buildings | 환경설정 > 건물관리 > 등록 |
| GET /buildings/:seq | 환경설정 > 건물관리 > 상세 조회 |
| PUT /buildings/:seq | 환경설정 > 건물관리 > 수정 |
| DELETE /buildings/:seq | 환경설정 > 건물관리 > 삭제 |
| GET /settings | 환경설정 > 시스템 설정 > 조회 |
| PUT /settings/:seq | 환경설정 > 시스템 설정 > 수정 |
| 기타 GET | 조회 |
| 기타 POST | 등록 |
| 기타 PUT/PATCH | 수정 |
| 기타 DELETE | 삭제 |

### 참고

- 로그인 요청은 인증 전이므로 `tuId`/`tuName`이 null
- `/activity-logs`, `/docs`, `/health` 경로는 로깅 제외
- 민감 정보 자동 마스킹 (password, token 등 → "********")

---

## GET /activity-logs/:seq

활동로그 상세 조회. 요청/응답 JSON 데이터 포함.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| seq | number | 로그 시퀀스 |

### Response (200)

```json
{
  "no": 0,
  "logSeq": "1",
  "tuId": null,
  "tuName": null,
  "actionName": "로그인",
  "httpMethod": "POST",
  "requestUrl": "/api/v1/auth/login",
  "statusCode": 200,
  "durationMs": 154,
  "regDate": "2026-02-07T15:08:54.000Z",
  "tuSeq": null,
  "requestBody": {
    "id": "admin",
    "password": "********"
  },
  "responseBody": {
    "accessToken": "********",
    "user": {
      "seq": 1,
      "id": "admin",
      "name": "관리자",
      "type": "SUPER",
      "step": "OK"
    }
  },
  "ipAddress": "::1",
  "userAgent": "Mozilla/5.0 ..."
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| (리스트 필드 전부 포함) | | |
| tuSeq | number/null | 사용자 시퀀스 |
| requestBody | object/null | 요청 데이터 (JSON, 민감정보 마스킹) |
| responseBody | object/null | 응답 데이터 (JSON, 민감정보 마스킹) |
| ipAddress | string/null | 클라이언트 IP |
| userAgent | string/null | User-Agent |

### FE 가이드

- 리스트에서 행 클릭 시 상세 모달/페이지로 이동
- `requestBody`/`responseBody`는 JSON 뷰어로 표시 (예: react-json-view)
- 민감정보는 "********"로 이미 마스킹되어 있으므로 그대로 표시

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 활동로그를 찾을 수 없습니다 |
