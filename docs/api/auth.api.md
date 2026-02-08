# Auth API

Base URL: `http://localhost:8000/api/v1`

---

## POST /auth/login

사용자 로그인. 인증 불필요 (Public).

### Request

```json
{
  "id": "admin",
  "password": "비밀번호"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | string | Y | 사용자 아이디 |
| password | string | Y | 비밀번호 |

### Response (200)

```json
{
  "accessToken": "eyJhbGci...",
  "user": {
    "seq": 1,
    "id": "admin",
    "name": "관리자",
    "email": "kuadmin@konnkuk.ac.kr",
    "type": "SUPER",
    "step": "OK"
  },
  "menus": [
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
        },
        {
          "menuSeq": 12,
          "menuName": "제어관리",
          "menuCode": "controller-control",
          "menuPath": "/controller/control",
          "menuOrder": 2
        }
      ]
    }
  ]
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| accessToken | string | JWT 액세스 토큰 (15분) |
| user.seq | number | 사용자 시퀀스 |
| user.id | string | 사용자 아이디 |
| user.name | string | 사용자 이름 |
| user.email | string | 이메일 |
| user.type | string | 타입 (SUPER, ADMIN, USER 등) |
| user.step | string | 상태 (OK=승인) |
| menus | array | 메뉴 권한 트리 (GNB + LNB) |

### menus 구조

| 필드 | 타입 | 설명 |
|------|------|------|
| menuSeq | number | 메뉴 시퀀스 |
| menuName | string | 메뉴명 (GNB 표시용) |
| menuCode | string | 메뉴 코드 (식별자) |
| menuOrder | number | 정렬 순서 |
| children | array | 하위 LNB 메뉴 목록 |
| children[].menuSeq | number | LNB 메뉴 시퀀스 |
| children[].menuName | string | LNB 메뉴명 (사이드바 표시용) |
| children[].menuCode | string | LNB 메뉴 코드 |
| children[].menuPath | string | 라우트 경로 (FE 라우팅용) |
| children[].menuOrder | number | 정렬 순서 |

### 메뉴 권한 로직

- **SUPER 사용자**: 전체 메뉴 반환 (7개 GNB + 16개 LNB)
- **일반 사용자**: `tb_menu_users` 테이블에 할당된 메뉴만 반환

### FE 활용 가이드

1. 로그인 성공 시 `menus` 배열을 store(Zustand)에 저장
2. **GNB (상단 메뉴)**: `menus` 배열의 1레벨 항목으로 렌더링
3. **LNB (사이드 메뉴)**: 선택된 GNB의 `children`으로 렌더링
4. **라우팅**: `menuPath` 값으로 Next.js 라우팅 연결
5. `menus`에 없는 경로 접근 시 403 또는 리다이렉트 처리
6. 브라우저 새로고침 시 store가 초기화되므로, 저장된 토큰으로 재로그인하거나 localStorage에 menus 캐시

### Error Responses

| Status | 설명 |
|--------|------|
| 401 | 아이디 또는 비밀번호 불일치 |
| 401 | 승인되지 않은 회원 (step !== 'OK') |

---

## 토큰 버전 (권한 변경 시 강제 재로그인)

관리자가 사용자의 메뉴 권한을 변경(`PUT /menus/users/:seq`)하면, 해당 사용자의 기존 토큰이 즉시 무효화됩니다.

### 동작 원리

1. 로그인 시 JWT에 `tokenVer` 포함 (DB `tu_token_ver` 값)
2. 매 API 요청마다 JWT의 `tokenVer`과 DB의 `tu_token_ver` 비교
3. 관리자가 권한 저장 → `tu_token_ver +1` 증가
4. 해당 사용자의 기존 토큰 `tokenVer` 불일치 → **401 반환**

### 401 응답 (권한 변경)

```json
{
  "message": "권한이 변경되었습니다. 다시 로그인해주세요.",
  "error": "Unauthorized",
  "statusCode": 401
}
```

### FE 처리 가이드

1. **401 응답의 `message`가 `"권한이 변경되었습니다"`를 포함하면** → 토큰/store 초기화 후 로그인 페이지로 이동
2. 일반 401 (토큰 만료)과 구분하여 사용자에게 안내 메시지 표시 권장
3. 예시: `"권한이 변경되어 자동 로그아웃 되었습니다. 다시 로그인해주세요."`

---

## POST /auth/logout

로그아웃. Bearer 토큰 필수.

### Request Headers

```
Authorization: Bearer {accessToken}
```

### Response (200)

```json
{
  "message": "로그아웃되었습니다"
}
```
