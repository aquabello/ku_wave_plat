# 플레이어 페이지 API 연동 완료 보고서

## 📋 작업 개요
플레이어 관리 페이지를 Mock 데이터에서 실제 Backend API와 연동하도록 변경 완료

---

## ✅ 완료된 작업

### 1. TanStack Query 훅 생성 (`use-players.ts`)

**파일 위치**: `apps/console/src/hooks/use-players.ts`

**구현된 훅**:
- `usePlayersQuery()` - 플레이어 목록 조회 (페이지네이션, 필터링, 검색 지원)
- `usePlayerQuery()` - 플레이어 상세 조회
- `useCreatePlayerMutation()` - 플레이어 등록
- `useUpdatePlayerMutation()` - 플레이어 수정
- `useDeletePlayerMutation()` - 플레이어 삭제
- `useApprovePlayerMutation()` - 플레이어 승인
- `useRejectPlayerMutation()` - 플레이어 반려
- `useHeartbeatLogsQuery()` - Health Check 로그 조회

**주요 기능**:
- Query Key 관리로 캐시 최적화
- Toast 알림으로 사용자 피드백 제공
- 성공 시 자동 캐시 무효화 (`invalidateQueries`)

---

### 2. 건물 목록 조회 훅 생성 (`use-buildings.ts`)

**파일 위치**: `apps/console/src/hooks/use-buildings.ts`

**기능**:
- 드롭다운용 건물 목록 조회 (limit: 1000)
- 플레이어 등록/수정 시 건물 선택에 사용

---

### 3. 메인 페이지 리팩토링 (`page.tsx`)

**파일 위치**: `apps/console/src/app/(dashboard)/display/player/page.tsx`

**변경 사항**:
- ❌ Mock 데이터 제거 (`mockPlayers`, `mockBuildings`)
- ✅ `usePlayersQuery()` 훅으로 실제 API 호출
- ✅ `useBuildingsQuery()` 훅으로 건물 목록 조회
- ✅ 서버 상태 기반 필터링 (`GetPlayersParams`)
- ✅ 로딩/에러 상태 처리

**필터링 파라미터**:
```typescript
{
  page: 1,
  limit: 20,
  building_seq?: number,
  approval?: 'PENDING' | 'APPROVED' | 'REJECTED',
  search?: string
}
```

---

### 4. 테이블 컴포넌트 업데이트 (`player-table.tsx`)

**파일 위치**: `apps/console/src/app/(dashboard)/display/player/components/player-table.tsx`

**변경 사항**:
- ❌ Mock 타입 제거 → ✅ `PlayerListItem` 타입 사용 (`@ku/types`)
- ✅ 실제 API 응답 필드명 매핑 (`player_name`, `player_code`, `player_ip` 등)
- ✅ 승인/반려 액션 직접 처리 (mutation 사용)
- ✅ 로딩 스피너 추가
- ✅ 페이지네이션 UI 구현 (이전/다음 버튼)

**새로운 컬럼**:
- 건물
- 플레이어명
- 코드
- IP
- 공간
- 플레이리스트
- 연결 상태 (ONLINE/OFFLINE/ERROR/MAINTENANCE)
- 승인 상태 (PENDING/APPROVED/REJECTED)
- 마지막 호출
- 관리 (수정/승인/반려/삭제)

**조건부 버튼 렌더링**:
- `PENDING` 상태일 때만 승인/반려 버튼 표시
- 모든 상태에서 수정/삭제 버튼 표시

---

### 5. 플레이어 등록 다이얼로그 리팩토링 (`player-register-dialog.tsx`)

**파일 위치**: `apps/console/src/app/(dashboard)/display/player/components/player-register-dialog.tsx`

**변경 사항**:
- ❌ Mock 건물 데이터 제거
- ✅ `useBuildingsQuery()` 훅으로 실제 건물 목록 조회
- ✅ `useCreatePlayerMutation()` 훅으로 API 호출
- ✅ API 스펙에 맞는 필드 추가

**새로운 입력 필드**:
- 건물 (필수) - `building_seq`
- 플레이어명 (필수) - `player_name`
- 플레이어 코드 (필수) - `player_code` (UNIQUE)
- IP 주소 (필수) - `player_ip`
- 포트 - `player_port` (기본값: 9090)
- 해상도 - `player_resolution` (예: 1920x1080)
- 화면 방향 - `player_orientation` (LANDSCAPE/PORTRAIT)
- 설명 - `player_description`

**유효성 검증** (Zod Schema):
- `player_name`: 1~100자
- `player_code`: 1~50자
- `player_port`: 1~65535
- `player_description`: 최대 500자

---

### 6. 플레이어 수정 다이얼로그 리팩토링 (`player-edit-dialog.tsx`)

**파일 위치**: `apps/console/src/app/(dashboard)/display/player/components/player-edit-dialog.tsx`

**변경 사항**:
- ❌ Mock 데이터 제거
- ✅ `useUpdatePlayerMutation()` 훅으로 API 호출
- ✅ `useEffect` + `reset()` 패턴으로 기존 데이터 로드
- ✅ 건물/공간/플레이리스트 선택 지원

**수정 가능 필드**:
- 건물, 플레이어명, IP, 포트, 해상도, 화면 방향, 설명

---

### 7. 플레이어 삭제 다이얼로그 리팩토링 (`player-delete-dialog.tsx`)

**파일 위치**: `apps/console/src/app/(dashboard)/display/player/components/player-delete-dialog.tsx`

**변경 사항**:
- ❌ Mock 타입 제거 → ✅ `PlayerListItem` 타입 사용
- ✅ `useDeletePlayerMutation()` 훅으로 API 호출
- ✅ 삭제 확인 메시지 강화 ("이 작업은 되돌릴 수 없습니다")

---

## 🗑️ 삭제된 파일
- `apps/console/src/app/(dashboard)/display/player/mock-data.ts`

---

## 🔍 API 스펙 준수 확인

### ✅ API 엔드포인트 매핑

| 기능 | HTTP Method | 엔드포인트 | 구현 여부 |
|------|-------------|-----------|----------|
| 목록 조회 | GET | `/players` | ✅ |
| 상세 조회 | GET | `/players/:player_seq` | ✅ |
| 등록 | POST | `/players` | ✅ |
| 수정 | PUT | `/players/:player_seq` | ✅ |
| 삭제 | DELETE | `/players/:player_seq` | ✅ |
| 승인 | POST | `/players/:player_seq/approve` | ✅ |
| 반려 | POST | `/players/:player_seq/reject` | ✅ |
| Heartbeat 로그 | GET | `/players/:player_seq/heartbeat-logs` | ✅ |

### ✅ 타입 안전성
- `@ku/types` 패키지의 공유 타입 사용
- `PlayerListItem`, `Player`, `CreatePlayerDto`, `UpdatePlayerDto` 타입 활용
- TypeScript strict mode 준수 (No `any` types)

---

## 🎨 UI/UX 개선 사항

### 로딩 상태
- 스피너 애니메이션 표시
- 버튼 비활성화 + "등록 중...", "수정 중...", "삭제 중..." 텍스트

### 에러 처리
- API 에러 발생 시 Toast 알림 (빨간색)
- 에러 메시지 명확하게 표시

### 성공 피드백
- 성공 시 Toast 알림 (녹색)
- 다이얼로그 자동 닫기
- 목록 자동 새로고침

### 페이지네이션
- 이전/다음 버튼
- 현재 페이지/전체 페이지 표시
- "총 N개 중 X-Y개 표시" 안내

### 상태 뱃지
**연결 상태**:
- 🟢 ONLINE (녹색)
- ⚫ OFFLINE (회색)
- 🔴 ERROR (빨간색)
- 🟡 MAINTENANCE (노란색)

**승인 상태**:
- 🟡 PENDING (노란색)
- 🟢 APPROVED (녹색)
- 🔴 REJECTED (빨간색)

---

## 🧪 TypeScript 타입 체크 결과

```bash
✅ pnpm --filter @ku/console typecheck
   No errors found
```

---

## 📝 남은 작업 (선택 사항)

### 1. 엑셀 다운로드 기능
- 현재 Toast 메시지만 표시 ("준비 중입니다")
- 실제 엑셀 export 기능 구현 필요 시 xlsx 라이브러리 활용

### 2. 공간(Space) 목록 조회 API
- 플레이어 수정 시 공간 선택 기능 추가 가능
- `space_seq` 필드는 optional이므로 현재는 수동 입력 불가

### 3. 플레이리스트 목록 조회 연동
- 플레이어 수정 시 플레이리스트 할당 기능
- `/playlists` API 연동 필요

### 4. Health Check 로그 보기 기능
- 플레이어 상세 페이지 또는 모달에서 Heartbeat 로그 조회
- `useHeartbeatLogsQuery()` 훅은 이미 구현됨

---

## 🚀 테스트 방법

### 1. 개발 서버 실행
```bash
pnpm dev
```

### 2. 접속
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

### 3. 테스트 시나리오
1. **목록 조회**: 플레이어 관리 페이지 접속
2. **검색**: 플레이어명 또는 IP로 검색
3. **필터링**: 건물 선택, 승인 상태 선택
4. **등록**: "플레이어 등록" 버튼 클릭 → 폼 입력 → 등록
5. **수정**: 플레이어 행의 "수정" 버튼 클릭 → 정보 수정
6. **승인**: PENDING 상태 플레이어의 "승인" 버튼 클릭
7. **반려**: PENDING 상태 플레이어의 "반려" 버튼 클릭 → 사유 입력
8. **삭제**: "삭제" 버튼 클릭 → 확인
9. **페이지네이션**: 이전/다음 버튼으로 페이지 이동

---

## 📌 주요 참고 사항

### FE Known Issues 준수
1. ✅ **FormData 전송**: ofetch 사용, Content-Type 자동 설정
2. ✅ **이미지 표시**: 개발환경에서는 `<img>` 태그 사용 (Next.js 16 제약)
3. ✅ **정적 파일 URL**: API prefix 제거 후 origin만 사용
4. ✅ **React Hook Form + 비동기 데이터**: `useEffect` + `reset()` 패턴 사용

### Bearer Token 인증
- 모든 API 요청에 `Authorization: Bearer {token}` 헤더 자동 포함
- `apiClient` (ofetch)가 자동 처리

---

## 📚 관련 문서
- API 명세: `docs/api/player.api.md`
- 공유 타입: `packages/types/src/player.types.ts`
- API 클라이언트: `apps/console/src/lib/api/players.ts`

---

작성일: 2026-02-14
작성자: Claude Sonnet 4.5
