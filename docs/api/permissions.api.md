# Permissions API

Base URL: `http://localhost:8000/api/v1`
인증: 모든 요청에 `Authorization: Bearer {accessToken}` 필수

---

## GET /permissions

권한 목록 조회. 사용자별 할당된 메뉴/건물 권한을 포함하여 반환.

### Query Parameters

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | number | N | 1 | 페이지 번호 (1부터) |
| limit | number | N | 10 | 페이지당 항목 수 (1~100) |
| search | string | N | - | 통합 검색 (아이디, 이름 LIKE) |

### Response (200)

```json
{
  "items": [
    {
      "no": 3,
      "seq": 1,
      "id": "admin",
      "name": "관리자",
      "userType": "SUPER",
      "step": "OK",
      "assignedBuildings": [],
      "assignedMenus": ["컨트롤러", "RFID", "회원관리"]
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| items[].no | number | 번호 (역순) |
| items[].seq | number | 사용자 시퀀스 |
| items[].id | string | 아이디 |
| items[].name | string | 이름 |
| items[].userType | string/null | 사용자 타입 (SUPER, ADMIN, USER 등) |
| items[].step | string/null | 상태 (OK=승인) |
| items[].assignedBuildings | string[] | 할당된 건물명 목록 (추후 연동) |
| items[].assignedMenus | string[] | 할당된 GNB 메뉴명 목록 |
| total | number | 전체 수 |
| page | number | 현재 페이지 |
| limit | number | 페이지당 항목 수 |
| totalPages | number | 전체 페이지 수 |

### FE 가이드

- `assignedMenus`: tb_menu_users에 할당된 GNB 메뉴 이름 배열
- `assignedBuildings`: 현재 빈 배열 (건물 권한 기능 추가 시 연동 예정)
- 권한 관리 화면에서 사용자별 메뉴/건물 할당 현황을 테이블로 표시
