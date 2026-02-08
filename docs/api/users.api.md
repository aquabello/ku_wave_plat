# Users API

Base URL: `http://localhost:8000/api/v1`
인증: 모든 요청에 `Authorization: Bearer {accessToken}` 필수

---

## GET /users

사용자 리스트 조회 (페이징 + 검색). 삭제된 사용자(tu_isdel='Y') 제외.

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | number | N | 1 | 페이지 번호 (1부터) |
| limit | number | N | 10 | 페이지당 항목 수 (1~100) |
| search | string | N | - | 통합 검색 (아이디, 이름, 이메일 LIKE) |

### Response (200)

```json
{
  "items": [
    {
      "no": 10,
      "seq": 5,
      "id": "user01",
      "name": "홍길동",
      "lastAccessDate": "2026-01-15T09:30:00.000Z",
      "step": "OK",
      "approvedDate": "2026-01-10T14:00:00.000Z"
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
| items[].no | number | 번호 (역순, 전체 기준 DESC) |
| items[].seq | number | 사용자 시퀀스 (PK) |
| items[].id | string | 아이디 |
| items[].name | string | 이름 |
| items[].lastAccessDate | Date/null | 마지막 접속일시 |
| items[].step | string/null | 승인 상태 (NORMAL=대기, OK=승인, ST=대기, BN=반려) |
| items[].approvedDate | Date/null | 승인일시 |
| total | number | 전체 수 |
| page | number | 현재 페이지 |
| limit | number | 페이지당 항목 수 |
| totalPages | number | 전체 페이지 수 |

### 정렬

- `tu_seq DESC` (최신 등록 순)

---

## GET /users/:seq

사용자 상세 조회. 비밀번호 필드 제외하고 반환.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| seq | number | 사용자 시퀀스 |

### Response (200)

```json
{
  "seq": 1,
  "id": "admin",
  "name": "관리자",
  "phone": "010-1234-5678",
  "email": "kuadmin@konnkuk.ac.kr",
  "isDel": null,
  "step": "OK",
  "type": "SUPER",
  "approvedDate": "2026-01-10T14:00:00.000Z",
  "contentYn": "Y",
  "workType": null,
  "lastAccessDate": "2026-02-07T15:08:54.000Z",
  "regDate": "2026-01-01T00:00:00.000Z"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 회원을 찾을 수 없습니다 |

---

## POST /users

회원 등록. 아이디와 이름만 입력. 비밀번호는 별도 API(PATCH /users/:seq/reset-password)로 설정.

### Request Body

```json
{
  "id": "user01",
  "name": "홍길동"
}
```

| 필드 | 타입 | 필수 | 최대 | 설명 |
|------|------|------|------|------|
| id | string | Y | 20자 | 아이디 (중복 불가) |
| name | string | Y | 50자 | 이름 |

### Response (201)

등록된 사용자 정보 반환 (비밀번호 제외). `step`은 자동으로 `NORMAL` 설정.

### Error Responses

| Status | 설명 |
|--------|------|
| 400 | 필수 필드 누락 또는 유효성 검증 실패 |
| 409 | 이미 사용 중인 아이디입니다 |

### FE 가이드 - 회원 등록 2단계 프로세스

1. `POST /users` → 회원 등록 (id, name)
2. `PATCH /users/:seq/reset-password` → 비밀번호 설정

---

## PUT /users/:seq

회원 정보 수정.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| seq | number | 사용자 시퀀스 |

### Request Body

```json
{
  "name": "홍길동",
  "phone": "010-1234-5678",
  "email": "user@example.com",
  "step": "OK"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| name | string | N | 이름 (최대 50자) |
| phone | string | N | 휴대폰 (최대 15자) |
| email | string | N | 이메일 (최대 50자) |
| step | string | N | 상태 변경 (ST, OK, BN) |

### 참고

- `step`을 `OK`로 변경하면 `approvedDate`가 자동으로 현재 시간으로 설정됨

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 회원을 찾을 수 없습니다 |

---

## PATCH /users/:seq/reset-password

비밀번호 초기화.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| seq | number | 사용자 시퀀스 |

### Request Body

```json
{
  "newPassword": "newPassword123!"
}
```

### Response (200)

```json
{
  "message": "비밀번호가 초기화되었습니다"
}
```

---

## DELETE /users/:seq

회원 삭제 (소프트 삭제, tu_isdel='Y').

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| seq | number | 사용자 시퀀스 |

### Response (200)

```json
{
  "message": "회원이 삭제되었습니다"
}
```

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 회원을 찾을 수 없습니다 |
