# 플레이어 관리 페이지

## 개요
KU_Wave_Plat의 플레이어 관리 페이지입니다. Mock 데이터 기반으로 모든 기능이 동작하는 프로토타입입니다.

## 페이지 접속
- URL: `http://localhost:3000/display/player`
- 개발 서버가 실행 중이어야 합니다: `pnpm dev`

## 주요 기능

### 1. 플레이어 목록 조회
- 5개의 Mock 플레이어 데이터 표시
- 법학관 2개, 공학관 3개
- TanStack Table을 사용한 데이터 테이블

### 2. 필터링 & 검색
- **건물 필터**: 전체, 법학관, 공학관, 상허연구도서관
- **검색 조건**: IP 주소, 플레이어명
- **실시간 필터링**: 클라이언트 사이드에서 즉시 반영

### 3. 플레이어 등록
- "플레이어 등록" 버튼 클릭
- 건물 선택 (선택사항)
- 플레이어명 입력 (필수)
- IP 주소 입력 (필수, IPv4 검증)
- 수동 등록 시 자동으로 "미승인" 상태로 등록

### 4. 플레이어 수정
- 각 행의 "연필" 아이콘 클릭
- 건물, 플레이어명, IP 주소 수정 가능
- React Hook Form + Zod 검증

### 5. 승인/승인취소
- 각 행의 "체크" 또는 "X" 아이콘 클릭
- 승인 시: 상태 "승인"으로 변경 + 승인일 자동 설정
- 승인취소 시: 상태 "미승인"으로 변경 + 승인일 제거

### 6. 플레이어 삭제
- 각 행의 "휴지통" 아이콘 클릭
- 확인 다이얼로그 표시
- 확인 시 플레이어 삭제

### 7. 엑셀 다운로드
- "엑셀 다운로드" 버튼 클릭
- 현재는 Toast 알림만 표시 (기능 준비 중)

## 테이블 컬럼

| 컬럼 | 설명 |
|------|------|
| No. | 플레이어 ID |
| 플레이어명 | 플레이어 이름 |
| IP 주소 | IPv4 주소 (monospace font) |
| 건물 | 소속 건물명 |
| 플레이리스트 | 할당된 플레이리스트 (없으면 "-") |
| 마지막 호출 | 상대 시간 표시 ("2일 전", "1개월 전" 등) |
| 상태 | Badge: 승인(green) / 미승인(gray) |
| 승인일 | 승인된 날짜 (YYYY. M. D. 형식) |
| 비고 | 메모 |
| 관리 | 수정/승인/삭제 버튼 |

## 기술 스택
- **UI Framework**: Next.js 16 App Router
- **UI Components**: shadcn/ui + Radix UI
- **Table**: TanStack Table v8
- **Forms**: React Hook Form + Zod
- **Date Formatting**: date-fns (한국어 locale 지원)
- **Notifications**: Sonner (Toast)
- **State Management**: React useState (로컬 상태)

## 파일 구조
```
apps/console/src/app/(dashboard)/display/player/
├── page.tsx                          # 메인 페이지
├── mock-data.ts                      # Mock 데이터
├── components/
│   ├── player-table.tsx              # 테이블 컴포넌트
│   ├── player-register-dialog.tsx    # 등록 다이얼로그
│   ├── player-edit-dialog.tsx        # 수정 다이얼로그
│   └── player-delete-dialog.tsx      # 삭제 확인 다이얼로그
└── README.md                         # 이 문서
```

## Mock 데이터
총 5개의 플레이어:
1. 법학관 1층 왼쪽 (192.168.1.1) - 승인
2. 법학관 1층 오른쪽 (192.168.1.2) - 승인
3. 공학관 2층 로비 (192.168.2.1) - 승인
4. 공학관 3층 복도 (192.168.2.2) - 미승인
5. 공학관 1층 입구 (192.168.2.3) - 승인

## 검증 규칙
- **플레이어명**: 필수 입력
- **IP 주소**: 필수 입력, IPv4 형식 검증 (예: 192.168.1.1)
- **건물**: 선택사항

## UI/UX 특징
- 반응형 디자인 (모바일/태블릿/데스크톱)
- Skeleton UI 대신 즉시 로딩 (Mock 데이터)
- Toast 알림으로 사용자 피드백
- 아이콘 기반 직관적인 액션 버튼
- 상대 시간 표시 (date-fns formatDistanceToNow)
- 상태별 색상 구분 (승인: 초록, 미승인: 회색)

## 향후 API 연동 시
1. `mock-data.ts`의 Mock 데이터를 제거
2. TanStack Query를 사용한 서버 상태 관리
3. 페이지네이션, 서버사이드 정렬/필터링 구현
4. 실제 엑셀 다운로드 기능 추가 (xlsx 라이브러리)
5. 에러 핸들링 및 로딩 상태 추가

## 테스트 방법
1. 개발 서버 실행: `pnpm dev`
2. 브라우저에서 접속: `http://localhost:3000/display/player`
3. 각 기능 테스트:
   - 필터 변경 (건물 선택)
   - 검색 (IP/플레이어명)
   - 플레이어 등록
   - 플레이어 수정
   - 승인/승인취소
   - 플레이어 삭제
