# Notepad
<!-- Auto-managed by OMC. Manual edits preserved in MANUAL section. -->

## Priority Context
<!-- ALWAYS loaded. Keep under 500 chars. Critical discoveries only. -->
SESSION ROLE: Architecture & DB Design ONLY. No FE/BE code. All work via agents. Design artifacts only (ERD, schema, API spec, data flow). User is the architect lead - deliver design documents.

## Working Memory
<!-- Session notes. Auto-pruned after 7 days. -->
### 2026-02-08 22:01
## 2/8 오전 개발 진행사항

### 완료
1. **AuthGuard 개선** (`auth-guard.tsx`)
   - 3단계 blocking 토큰 검증: localStorage → JWT 만료(isTokenExpired) → 서버검증(raw fetch)
   - 로딩 스피너 표시 (기존 빈 화면 → "인증 확인 중...")
   - raw fetch로 onResponseError 이중 리다이렉트 방지
   - AuthStatus 3상태 관리: loading | authenticated | unauthenticated

2. **세션 만료 Toast 알림** (auth-guard.tsx + client.ts + login/page.tsx)
   - handleForceLogout에 reason 파라미터 추가 (token_expired | session_invalid)
   - client.ts onResponseError에 session_expired reason 추가
   - login/page.tsx에서 switch문으로 4가지 reason별 Toast 메시지 표시
   - Chrome MCP로 전체 테스트 완료 (6개 시나리오 통과)

### FE 남은 작업
1. **권한관리 건물 할당 API 미연동** - selectedBuildings 초기값이 빈 Set, 서버에서 사용자별 할당 건물 로드 안됨, 저장시 건물 데이터 미전송
2. **권한관리 페이징 없음** - 테이블에 페이징 UI 필요
3. **나머지 GNB 하위 페이지** - 컨트롤러, RFID, 화면공유, AI시스템, 디스플레이, 환경설정 등 미개발


## MANUAL
<!-- User content. Never auto-pruned. -->

