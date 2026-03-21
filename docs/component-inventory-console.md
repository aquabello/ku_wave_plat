# 컴포넌트 인벤토리 (apps/console)

> **프로젝트**: KU-WAVE-PLAT
> **생성일**: 2026-03-22
> **문서 유형**: BMAD 컴포넌트 인벤토리

---

## 1. 개요

Console 앱은 shadcn/ui + Radix UI 기반의 UI 프리미티브와 커스텀 레이아웃/도메인 컴포넌트로 구성된다. 총 ~164개 TS/TSX 파일이 존재하며, 여기서는 재사용 가능한 핵심 컴포넌트를 분류한다.

---

## 2. UI 프리미티브 (components/ui/)

shadcn/ui 기반으로 Radix UI 프리미티브를 래핑한 22개 컴포넌트이다. Tailwind CSS 변수로 테마를 제어한다.

| 컴포넌트 | 기반 | 용도 |
|----------|------|------|
| `Button` | Radix Slot | 버튼 (variant: default/destructive/outline/secondary/ghost/link) |
| `Input` | native | 텍스트 입력 |
| `Label` | Radix Label | 폼 라벨 |
| `Select` | Radix Select | 드롭다운 선택 |
| `Checkbox` | Radix Checkbox | 체크박스 |
| `Switch` | Radix Switch | 토글 스위치 |
| `RadioGroup` | Radix RadioGroup | 라디오 버튼 그룹 |
| `Textarea` | native | 텍스트 영역 |
| `Dialog` | Radix Dialog | 모달 다이얼로그 |
| `AlertDialog` | Radix AlertDialog | 확인/취소 다이얼로그 |
| `Sheet` | Radix Dialog | 슬라이드 패널 (모바일 사이드바) |
| `Popover` | Radix Popover | 팝오버 |
| `Tooltip` | Radix Tooltip | 툴팁 |
| `DropdownMenu` | Radix DropdownMenu | 드롭다운 메뉴 |
| `Table` | native | 데이터 테이블 래퍼 |
| `Tabs` | Radix Tabs | 탭 네비게이션 |
| `Card` | native | 카드 컨테이너 |
| `Badge` | native | 상태 배지 |
| `Separator` | Radix Separator | 구분선 |
| `ScrollArea` | Radix ScrollArea | 스크롤 영역 |
| `Skeleton` | native | 로딩 스켈레톤 |
| `Sonner` | sonner | 토스트 알림 |

---

## 3. 레이아웃 컴포넌트 (components/layout/)

대시보드 라우트 그룹 `(dashboard)/layout.tsx`에서 사용되는 레이아웃 컴포넌트이다.

| 컴포넌트 | 역할 | 상세 |
|----------|------|------|
| `Sidebar` | LNB (좌측 네비게이션) | 메뉴 트리 렌더링, 접힘/펼침 토글, 현재 경로 하이라이트 |
| `Header` | GNB (상단 바) | 로고, 건물/공간 선택, 알림, 사용자 메뉴 |
| `UserMenu` | 사용자 드롭다운 | 프로필, 설정, 로그아웃 |

### 레이아웃 구조

```
┌────────────────────────────────────────┐
│              Header (GNB)              │
├──────────┬─────────────────────────────┤
│          │                             │
│ Sidebar  │        Page Content         │
│  (LNB)   │                             │
│          │                             │
│          │                             │
│          │                             │
└──────────┴─────────────────────────────┘
```

---

## 4. 인증 컴포넌트 (components/auth/)

| 컴포넌트 | 역할 |
|----------|------|
| `LoginForm` | 로그인 폼 (ID/PW 입력, Zod 검증) |
| `AuthGuard` | 인증 상태 확인, 미인증 시 로그인 리다이렉트 |

---

## 5. 데이터 표시 컴포넌트 (components/data-display/)

| 컴포넌트 | 역할 |
|----------|------|
| `DataTable` | TanStack Table 래퍼 (서버사이드 페이지네이션/정렬/필터) |
| `Pagination` | 페이지네이션 UI |
| `StatCard` | 대시보드 통계 카드 |
| `StatusBadge` | 상태별 색상 배지 (녹화중/대기/오류 등) |

---

## 6. 데이터 테이블 패턴

TanStack Table 8+을 사용하며, 모든 목록 페이지에서 일관된 패턴을 따른다.

### 표준 구조

```tsx
// 페이지 컴포넌트
function ListPage() {
  const [params, setParams] = useState<ListParams>({
    page: 1,
    limit: 20,
    sort: 'reg_date',
    order: 'DESC',
  });

  const { data, isLoading } = useListQuery(params);

  const columns = useMemo(() => [
    columnHelper.accessor('name', { header: '이름' }),
    columnHelper.accessor('status', {
      header: '상태',
      cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    }),
    // ...
  ], []);

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      totalCount={data?.totalCount ?? 0}
      params={params}
      onParamsChange={setParams}
      isLoading={isLoading}
    />
  );
}
```

### 지원 기능

| 기능 | 처리 위치 |
|------|----------|
| 페이지네이션 | 서버 (page, limit 파라미터) |
| 정렬 | 서버 (sort, order 파라미터) |
| 검색/필터 | 서버 (search, filter 파라미터) |
| 컬럼 표시/숨김 | 클라이언트 |
| 행 선택 | 클라이언트 |

---

## 7. 폼 패턴

React Hook Form + Zod를 사용하는 표준 폼 패턴이다.

### CRUD 폼 구조

```tsx
// 자식 컴포넌트 패턴 (비동기 데이터)
function EditPage() {
  const { data, isLoading } = useDetailQuery(id);
  if (isLoading) return <Skeleton />;
  return <EditForm key={data.seq} data={data} />;
}

function EditForm({ data }: { data: DetailType }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: data,
  });

  const mutation = useUpdateMutation();

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField control={form.control} name="name" render={...} />
        <Button type="submit" disabled={mutation.isPending}>저장</Button>
      </form>
    </Form>
  );
}
```

### Multipart 폼 (파일 업로드)

```tsx
// 페이지 단위 단일 API 호출 (CRITICAL RULE)
const onSubmit = async (values: FormValues) => {
  const formData = new FormData();
  formData.append('name', values.name);
  if (values.file) formData.append('file', values.file);

  // ofetch가 Content-Type 자동 설정 (수동 지정 금지)
  await apiClient('/endpoint', { method: 'PUT', body: formData });
};
```

---

## 8. 차트 패턴

Recharts 2+를 사용하는 대시보드 차트이다.

| 차트 유형 | 용도 |
|-----------|------|
| LineChart | 시간별 추이 (녹화 세션, 태깅 수) |
| BarChart | 카테고리별 비교 (건물별 공간 수) |
| PieChart | 비율 (콘텐츠 유형 분포) |
| AreaChart | 누적 추이 |

---

## 9. 드래그 앤 드롭

DnD-kit을 사용하여 콘텐츠 정렬을 구현한다.

| 적용 위치 | 기능 |
|-----------|------|
| 플레이리스트 콘텐츠 | 콘텐츠 순서 변경 (sort_order) |

---

## 10. 상태 관리

### Zustand 스토어

| 스토어 | 파일 | 용도 |
|--------|------|------|
| `navigationStore` | `stores/navigation.ts` | 사이드바 상태, 현재 메뉴, localStorage 영속화 |

### TanStack Query 훅 (hooks/)

| 훅 | 파일 | 도메인 |
|----|------|--------|
| `useAuth` | `hooks/use-auth.ts` | 인증/로그인/로그아웃 |
| `useBuildings` | `hooks/use-buildings.ts` | 건물 CRUD |
| `useSpaces` | `hooks/use-spaces.ts` | 공간 CRUD |
| `useRecorders` | `hooks/use-recorders.ts` | 녹화기 (5초 폴링) |
| `useNfc` | `hooks/use-nfc.ts` | NFC 관리 |
| `usePlayers` | `hooks/use-players.ts` | 플레이어 관리 |
| `useContents` | `hooks/use-contents.ts` | 콘텐츠 관리 |
| `usePlaylists` | `hooks/use-playlists.ts` | 플레이리스트 |
| `useSettings` | `hooks/use-settings.ts` | 시스템 설정 |
| `useUsers` | `hooks/use-users.ts` | 사용자 관리 |
| `useAiSystem` | `hooks/use-ai-system.ts` | AI 시스템 (30초 폴링) |
| `useController` | `hooks/use-controller.ts` | IoT 제어 |
| `useDashboard` | `hooks/use-dashboard.ts` | 대시보드 통계 |

---

## 11. API 클라이언트 (lib/api/)

| 파일 | 도메인 |
|------|--------|
| `client.ts` | ofetch 공통 클라이언트 (인터셉터, 에러 핸들링) |
| `auth.ts` | 인증 API |
| `buildings.ts` | 건물 API |
| `spaces.ts` | 공간 API |
| `users.ts` | 사용자 API |
| `settings.ts` | 설정 API |
| `recorders.ts` | 녹화기 API |
| `recordings.ts` | 녹화 세션/파일 API |
| `ftp.ts` | FTP API |
| `nfc.ts` | NFC API |
| `players.ts` | 플레이어 API |
| `playlists.ts` | 플레이리스트 API |
| `contents.ts` | 콘텐츠 API |
| `player-groups.ts` | 플레이어 그룹 API |
| `play-logs.ts` | 재생 로그 API |
| `ai-system.ts` | AI 시스템 API |
| `controller.ts` | IoT 컨트롤러 API |
| `menus.ts` | 메뉴 API |
| `activity-logs.ts` | 활동 로그 API |
