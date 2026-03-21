# Console 아키텍처 (apps/console)

> **프로젝트**: KU-WAVE-PLAT
> **생성일**: 2026-03-22
> **문서 유형**: BMAD 아키텍처 문서 — 프론트엔드

---

## 1. 개요

Next.js 16+ App Router 기반의 관리자 대시보드로, 28개 페이지와 ~164개 TS/TSX 파일로 구성된다. shadcn/ui + Radix UI를 UI 프레임워크로, TanStack Query를 데이터 패칭 레이어로 사용한다.

---

## 2. App Router 구조

### 라우트 그룹

| 그룹 | 경로 | 역할 | 레이아웃 |
|------|------|------|----------|
| `(auth)` | `/login` | 인증 (로그인) | 미니멀 레이아웃 |
| `(dashboard)` | `/*` | 관리자 페이지 | Header(GNB) + Sidebar(LNB) + AuthGuard |

### 페이지 구성 (28개)

| 카테고리 | 페이지 | 경로 |
|----------|--------|------|
| **대시보드** | 통계/차트 | `/dashboard` |
| **IoT 제어** | 하드웨어 설정 | `/controller/hardware` |
| | 디바이스 제어 | `/controller/control` |
| | 소켓 명령 | `/controller/socket` |
| **NFC/RFID** | NFC 카드 관리 | `/rfid/tags` |
| | NFC 리더 관리 | `/rfid/readers` |
| | 태깅 로그 | `/rfid/logs` |
| **녹화** | 녹화기 목록 | `/recorder/list` |
| | 실시간 제어 | `/recorder/control` |
| | 녹화 이력 | `/recorder/history` |
| | 녹화 파일 | `/recorder/files` |
| | FTP 설정 | `/recorder/ftp` |
| **AI 시스템** | 강의 요약 | `/ai-system/lecture-summary` |
| | 음성 인식 | `/ai-system/speech` |
| | 음성 명령 | `/ai-system/voice-commands` |
| | Worker 서버 | `/ai-system/worker-servers` |
| **디스플레이** | 플레이어 장치 | `/display/player` |
| | 플레이리스트 | `/display/list` |
| | 콘텐츠 관리 | `/display/content` |
| | 콘텐츠 승인 | `/display/content-approval` |
| **회원** | 회원 관리 | `/members` |
| | RBAC 권한 | `/members/permissions` |
| | 활동 로그 | `/members/activity` |
| **설정** | 시스템 설정 | `/settings` |
| | 건물/공간 관리 | `/settings/buildings` |
| **사용자** | 사용자 관리 | `/users` |

---

## 3. 데이터 패칭 아키텍처

### TanStack Query (서버 상태)

13개의 커스텀 훅이 `hooks/` 디렉토리에 위치한다.

#### 폴링 설정

| 대상 | 폴링 주기 | 이유 |
|------|----------|------|
| 녹화기 상태 | 5초 | 실시간 녹화 상태 모니터링 |
| AI Worker 서버 | 30초 | 서버 가동 상태 확인 |
| FTP 파일 목록 | 10초 | 업로드 진행률 추적 |

#### 쿼리 훅 패턴

```typescript
// hooks/use-recorders.ts
export function useRecorders(params: RecorderListParams) {
  return useQuery({
    queryKey: ['recorders', params],
    queryFn: () => recorderApi.getList(params),
    refetchInterval: 5000, // 5초 폴링
  });
}
```

### Zustand (클라이언트 상태)

`stores/navigation.ts`에서 네비게이션 상태를 관리한다.

- 사이드바 열림/닫힘 상태
- 현재 활성 메뉴
- localStorage 영속화

---

## 4. API 클라이언트 레이어

### 구조

`lib/api/` 디렉토리에 19개 파일이 위치한다.

| 파일 | 역할 |
|------|------|
| `client.ts` | ofetch 기반 공통 HTTP 클라이언트 |
| `auth.ts` | 로그인, 로그아웃, 토큰 갱신 |
| `buildings.ts` | 건물 CRUD |
| `spaces.ts` | 공간 CRUD |
| `recorders.ts` | 녹화기 관리 |
| `nfc.ts` | NFC 관리 |
| `players.ts` | 플레이어 관리 |
| `contents.ts` | 콘텐츠 관리 |
| `settings.ts` | 시스템 설정 |
| `...` | 기타 도메인별 클라이언트 |

### 주의사항 (Known Issues)

#### ofetch FormData 전송

```typescript
// 올바른 패턴 — Content-Type 수동 지정 금지
await apiClient('/endpoint', {
  method: 'PUT',
  body: formData,  // ofetch가 자동으로 multipart/form-data 설정
});
```

#### 정적 파일 URL

```typescript
// NEXT_PUBLIC_API_URL에 /api/v1 포함 — origin만 추출
const origin = new URL(process.env.NEXT_PUBLIC_API_URL).origin;
const url = `${origin}/${path}`;
```

#### next/image 제한

```tsx
// localhost에서 private IP 프록시 차단 — img 태그 사용
<img src={imageUrl} alt="..." className="object-contain" />
```

---

## 5. 폼 처리

### React Hook Form + Zod

모든 폼은 React Hook Form과 Zod 스키마 검증을 조합하여 사용한다.

#### 비동기 데이터 로딩 패턴 (필수)

`useEffect` + `form.reset()` 대신 **자식 컴포넌트 패턴**을 사용해야 한다.

```tsx
// 올바른 패턴 — 데이터 로드 후 자식에서 form 초기화
function Page() {
  const { data, isLoading } = useQuery({...});
  if (isLoading) return <Loading />;
  return <FormChild key={data.id} data={data} />;
}

function FormChild({ data }: { data: FormData }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: data, // 정확한 값으로 초기화
  });
  // ...
}
```

---

## 6. UI 컴포넌트 시스템

### shadcn/ui + Radix UI

22개의 UI 프리미티브가 `components/ui/`에 위치한다. 상세 목록은 [컴포넌트 인벤토리](./component-inventory-console.md) 참조.

### 레이아웃 컴포넌트

| 컴포넌트 | 위치 | 역할 |
|----------|------|------|
| `Sidebar` | `components/layout/` | LNB (좌측 네비게이션) |
| `Header` | `components/layout/` | GNB (상단 네비게이션) |
| `UserMenu` | `components/layout/` | 사용자 메뉴 (로그아웃 등) |

### 스타일링

- **Tailwind CSS 3.4+**: 유틸리티 퍼스트 스타일링
- **CSS 변수**: shadcn/ui 디자인 토큰
- **다크 모드**: CSS 변수 기반 지원
- **반응형**: 모바일 퍼스트 접근

---

## 7. 데이터 테이블

TanStack Table 8+을 사용하며, 서버 사이드 처리를 기본으로 한다.

| 기능 | 구현 방식 |
|------|----------|
| 페이지네이션 | 서버 사이드 (API 파라미터) |
| 정렬 | 서버 사이드 |
| 필터링 | 서버 사이드 |
| 컬럼 표시/숨김 | 클라이언트 사이드 |

---

## 8. 차트

Recharts 2+를 사용하여 대시보드 시각화를 구현한다.

- 통계 차트 (라인, 바, 파이)
- 실시간 모니터링 그래프
- 녹화 현황 차트

---

## 9. WebSocket 통합

socket.io-client를 사용하여 API 서버와 실시간 통신한다.

| 용도 | 설명 |
|------|------|
| 녹화기 상태 | 녹화 시작/중지 실시간 알림 |
| IoT 제어 | 디바이스 제어 피드백 |
| NFC 태깅 | 실시간 태깅 이벤트 표시 |

---

## 10. 드래그 앤 드롭

DnD-kit을 사용하여 콘텐츠 순서 정렬을 구현한다.

- 플레이리스트 내 콘텐츠 순서 변경
- 드래그 핸들 기반 인터랙션

---

## 11. 알림

Sonner를 사용하여 토스트 알림을 제공한다.

- 성공/실패/경고 메시지
- API 응답 결과 알림
- 실시간 이벤트 알림

---

## 12. 서버/클라이언트 컴포넌트 전략

| 유형 | 용도 |
|------|------|
| Server Component (기본) | 데이터 패칭, 초기 렌더링, SEO |
| Client Component (`"use client"`) | 인터랙션 (폼, 테이블, 모달, 차트) |

대부분의 페이지는 Server Component에서 데이터를 패칭하고, Client Component로 인터랙티브 UI를 렌더링하는 구조를 따른다.
