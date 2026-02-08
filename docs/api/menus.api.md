# Menus API

Base URL: `http://localhost:8000/api/v1`
인증: 모든 요청에 `Authorization: Bearer {accessToken}` 필수

---

## GET /menus

전체 메뉴 트리 조회 (GNB + LNB 계층). 권한 관리 화면에서 메뉴 할당 시 사용.

### Response (200)

```json
[
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
```

### FE 가이드

- 권한 관리 화면에서 사용자에게 메뉴를 할당할 때 체크박스 목록 용도로 사용
- GNB를 체크하면 하위 LNB 전체 선택 UX 권장

---

## GET /menus/users/:seq

사용자별 할당된 메뉴 권한 조회.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| seq | number | 사용자 시퀀스 |

### Response (200)

```json
{
  "userSeq": 2,
  "menuSeqs": [1, 6, 11, 12, 61, 62, 63],
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

| 필드 | 타입 | 설명 |
|------|------|------|
| userSeq | number | 사용자 시퀀스 |
| menuSeqs | number[] | 할당된 메뉴 시퀀스 배열 (체크박스 상태 복원용) |
| menuTree | array | 할당된 메뉴의 트리 구조 |

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 회원을 찾을 수 없습니다 |

---

## PUT /menus/users/:seq

사용자 메뉴 권한 일괄 저장. 기존 권한 전체 삭제 후 새로 저장.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| seq | number | 사용자 시퀀스 |

### Request Body

```json
{
  "menuSeqs": [1, 6, 11, 12, 61, 62, 63]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| menuSeqs | number[] | Y | 할당할 메뉴 시퀀스 배열 (GNB + LNB 모두 포함) |

### Response (200)

저장 후 `GET /menus/users/:seq`와 동일한 형태 반환.

### FE 가이드 - 권한 관리 화면 흐름

1. `GET /menus` → 전체 메뉴 트리 조회 (체크박스 목록)
2. `GET /menus/users/:seq` → 해당 사용자의 기존 할당 조회 (`menuSeqs`로 체크 상태 복원)
3. 관리자가 체크박스 변경
4. `PUT /menus/users/:seq` → 변경된 `menuSeqs` 배열 전송 (일괄 저장)

### 권한 저장 시 강제 재로그인

- 권한 저장 성공 시, **해당 사용자의 기존 토큰이 즉시 무효화**됩니다 (토큰 버전 +1)
- 해당 사용자가 다음 API 호출 시 401 응답 → 재로그인 필요
- 관리자 화면에 "권한이 저장되었습니다. 해당 사용자는 재로그인이 필요합니다." 안내 권장
- 상세 동작은 `auth.api.md` > **토큰 버전** 섹션 참고

### Error Responses

| Status | 설명 |
|--------|------|
| 404 | 해당 회원을 찾을 수 없습니다 |
