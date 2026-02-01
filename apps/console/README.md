# KU Console - 관리자 대시보드

Next.js 16+ App Router 기반 관리자 대시보드 애플리케이션

## 기술 스택

- **Framework**: Next.js 16.0+
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Tables**: TanStack Table
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: Sonner

## 프로젝트 구조

```
src/
├── app/
│   ├── (auth)/          # 인증 관련 페이지
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/     # 대시보드 페이지
│   │   ├── dashboard/   # 메인 대시보드
│   │   ├── users/       # 사용자 관리
│   │   ├── products/    # 상품 관리
│   │   ├── orders/      # 주문 관리
│   │   ├── customers/   # 고객 관리
│   │   ├── analytics/   # 분석
│   │   ├── settings/    # 설정
│   │   └── layout.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── layout/          # 레이아웃 컴포넌트
│   ├── ui/              # shadcn/ui 컴포넌트
│   └── data-display/    # 데이터 표시 컴포넌트
├── hooks/               # 커스텀 훅
├── lib/
│   ├── api/             # API 클라이언트
│   └── utils.ts         # 유틸리티 함수
└── stores/              # Zustand 스토어
```

## 시작하기

### 의존성 설치

```bash
pnpm install
```

### 환경 변수 설정

`.env.example` 파일을 `.env.local`로 복사하고 필요한 값을 설정하세요:

```bash
cp .env.example .env.local
```

### 개발 서버 실행

```bash
pnpm dev
```

애플리케이션이 [http://localhost:3001](http://localhost:3001)에서 실행됩니다.

### 빌드

```bash
pnpm build
```

### 타입 체크

```bash
pnpm typecheck
```

### Lint

```bash
pnpm lint
```

## 주요 기능

- 사용자 인증 및 권한 관리
- 대시보드 통계 및 차트
- 사용자 관리
- 상품 관리
- 주문 관리
- 고객 관리
- 데이터 분석
- 시스템 설정

## 개발 가이드

### 새로운 페이지 추가

1. `src/app/(dashboard)` 디렉토리에 새 폴더 생성
2. `page.tsx` 파일 생성
3. `src/components/layout/sidebar.tsx`에 네비게이션 추가

### 새로운 UI 컴포넌트 추가

shadcn/ui CLI를 사용하여 컴포넌트를 추가할 수 있습니다:

```bash
npx shadcn@latest add [component-name]
```

## 라이선스

Private
