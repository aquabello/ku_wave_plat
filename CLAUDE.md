# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**KU-WAVE-PLAT** - Konkuk University Wave Platform Admin System (건국대학교 WAVE AI 관리자 시스템)

Enterprise-grade admin system for Konkuk University Wave Platform built with NestJS backend and Next.js frontend in a monorepo architecture.

## Technology Stack

### Monorepo Management
- **Package Manager**: pnpm 10.21.0+ (required)
- **Build System**: Turborepo 2.7+
- **Node Version**: >= 20.0.0

### Backend (apps/api)
- **Framework**: NestJS 10.3+
- **Database**: MariaDB 11.2 (External Development DB)
- **ORM**: TypeORM 0.3.19+
- **Auth**: Passport + JWT (Access Token 15min, Refresh Token 7d)
- **Validation**: class-validator + class-transformer
- **Security**: Helmet, bcrypt (10 rounds), CORS whitelist
- **API Docs**: Swagger/OpenAPI 3.0
- **Language**: TypeScript 5.3+ (strict mode)

### Frontend (apps/console)
- **Framework**: Next.js 16.0+ (App Router)
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS 3.4+
- **Data Tables**: TanStack Table 8+
- **Charts**: Recharts 2+
- **Forms**: React Hook Form + Zod
- **State Management**: Zustand 5+
- **Data Fetching**: TanStack Query 5+
- **Language**: TypeScript 5.3+ (strict mode)

### Shared Packages
- **@ku/types**: Shared TypeScript types
- **@ku/ui**: Shared UI components
- **@ku/config**: Shared ESLint/TypeScript configs

## Essential Commands

### Development

```bash
# Install dependencies (required first step)
pnpm install

# Configure .env file (required before first run)
cp .env.example .env
# Edit .env with your development DB connection info:
# - DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE

# Start development servers
pnpm dev

# Development URLs:
# - Console: http://localhost:3000
# - API: http://localhost:8000
# - Swagger: http://localhost:8000/api/v1/docs
```

### Database Management

```bash
# Create database schema (first time only on development DB)
CREATE DATABASE ku_wave_plat
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

# TypeORM migrations (from apps/api)
pnpm --filter @ku/api migration:generate src/database/migrations/MigrationName
pnpm --filter @ku/api migration:run
pnpm --filter @ku/api migration:revert

# Seed database
pnpm --filter @ku/api seed:run
```

### Building & Testing

```bash
# Build entire monorepo
pnpm build

# Build specific app
pnpm build --filter=@ku/api
pnpm build --filter=@ku/console

# Run all tests
pnpm test

# Run specific test types
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:coverage

# Run tests for specific app
pnpm --filter @ku/api test
pnpm --filter @ku/console test:e2e

# Watch mode for API tests
pnpm --filter @ku/api test:watch
```

### Code Quality

```bash
# ESLint check
pnpm lint

# Format with Prettier
pnpm format

# TypeScript type checking
pnpm typecheck

# Clean build artifacts
pnpm clean
```

### Working with Specific Apps

```bash
# Run commands in specific workspace
pnpm --filter @ku/api <command>
pnpm --filter @ku/console <command>

# Examples:
pnpm --filter @ku/api start:dev
pnpm --filter @ku/console dev
```

## Architecture & Code Organization

### High-Level Architecture

This is a **monorepo** with two main applications sharing type definitions:

1. **apps/api** (NestJS Backend)
   - Provides RESTful API at `/api/v1/*`
   - Handles authentication, authorization (RBAC), and business logic
   - Connects to MariaDB for data persistence
   - Exposes Swagger documentation

2. **apps/console** (Next.js Frontend)
   - Admin dashboard with data tables, charts, and forms
   - Server Components for initial rendering, Client Components for interactivity
   - Communicates with backend API via TanStack Query
   - Uses Zustand for client-side state

3. **packages/** (Shared Code)
   - Type definitions shared between frontend and backend
   - UI component library based on shadcn/ui
   - Shared configuration for tools

### Backend Architecture (apps/api)

**Directory Structure**:
```
apps/api/src/
├── modules/              # Domain-driven feature modules
│   ├── auth/            # JWT authentication, login, logout
│   ├── users/           # User CRUD, role management
│   ├── dashboard/       # Statistics and metrics
│   ├── products/        # Product management
│   ├── orders/          # Order management
│   ├── customers/       # Customer management
│   ├── analytics/       # Analytics data
│   └── settings/        # System configuration
├── common/              # Shared code
│   ├── decorators/      # Custom decorators (@CurrentUser, @Roles)
│   ├── filters/         # Exception filters
│   ├── guards/          # Auth guards (JwtGuard, RolesGuard)
│   └── pipes/           # Validation pipes
├── config/              # Configuration modules
├── database/            # TypeORM config, migrations, seeds
├── app.module.ts        # Root module
└── main.ts             # Application entry point
```

**Key Patterns**:
- **Module Structure**: Each feature has a module with controller, service, DTOs, entities, and guards
- **DTOs**: Use class-validator decorators for validation (never trust client input)
- **Guards**: Apply JwtGuard for authentication, RolesGuard for authorization
- **Entities**: TypeORM entities with proper relations and indexes
- **Error Handling**: Standardized error responses via global exception filter
- **Swagger**: All endpoints documented with @Api* decorators

**Security Conventions**:
- All passwords hashed with bcrypt (10 rounds minimum)
- JWT tokens for stateless authentication
- Role-based access control (admin, manager, viewer)
- Input validation on all DTOs using class-validator
- SQL injection prevention via TypeORM parameterized queries
- Helmet middleware for security headers
- CORS configured with whitelist

### Frontend Architecture (apps/console)

**Directory Structure**:
```
apps/console/src/
├── app/                 # Next.js App Router
│   ├── (auth)/         # Auth layout group (login)
│   └── (dashboard)/    # Dashboard layout group (sidebar + header)
│       ├── dashboard/  # Home dashboard
│       ├── users/      # User management pages
│       ├── products/   # Product management pages
│       ├── orders/     # Order management pages
│       ├── customers/  # Customer management pages
│       ├── analytics/  # Analytics pages
│       └── settings/   # Settings pages
├── components/
│   ├── layout/         # Sidebar, Header, UserMenu
│   ├── data-display/   # DataTable, StatCard, Chart components
│   ├── forms/          # SearchFilter, DateRangePicker
│   └── ui/             # shadcn/ui primitives (Button, Dialog, etc.)
├── hooks/              # Custom React hooks
├── lib/                # Utilities, API client, helpers
├── stores/             # Zustand stores
└── types/              # Frontend-specific types
```

**Key Patterns**:
- **Route Groups**: `(auth)` for login, `(dashboard)` for admin pages with shared layout
- **Server Components**: Default for data fetching and initial rendering
- **Client Components**: Use `"use client"` for interactivity (forms, tables, modals)
- **Data Fetching**: TanStack Query for server state, Zustand for client state
- **Forms**: React Hook Form + Zod schema validation
- **Tables**: TanStack Table with server-side pagination, sorting, filtering
- **Charts**: Recharts for dashboard visualizations
- **Styling**: Tailwind with custom design tokens from shadcn/ui

**UI Conventions**:
- shadcn/ui components for consistency and accessibility
- Responsive design (mobile-first approach)
- Dark mode support via CSS variables
- Loading states with skeleton UI
- Error boundaries for graceful error handling
- Toast notifications for user feedback

### Shared Type System

The `packages/types` workspace contains shared TypeScript interfaces:
- User, Role, Permission types
- API request/response types
- Common enums and constants
- Database entity types (mirrored from backend)

**Important**: When modifying types, ensure compatibility between frontend and backend.

## Development Workflow

### Adding a New Feature

1. **Backend** (apps/api):
   ```bash
   # Generate module scaffold
   cd apps/api
   nest generate module modules/feature-name
   nest generate controller modules/feature-name
   nest generate service modules/feature-name

   # Create DTOs, entities, guards as needed
   # Add to feature.module.ts imports/exports
   # Update app.module.ts if needed
   ```

2. **Frontend** (apps/console):
   ```bash
   # Create page in app/(dashboard)/feature-name/page.tsx
   # Create components in components/feature-name/
   # Add API client functions in lib/api/
   # Create TanStack Query hooks if needed
   ```

3. **Shared Types** (packages/types):
   ```bash
   # Add new types in packages/types/src/
   # Export from packages/types/src/index.ts
   # Types automatically available in both apps
   ```

### Database Changes

1. Modify entity in `apps/api/src/modules/*/entities/`
2. Generate migration: `pnpm --filter @ku/api migration:generate src/database/migrations/DescriptiveName`
3. Review generated migration file
4. Run migration: `pnpm --filter @ku/api migration:run`
5. Update seed data if necessary

### Git Workflow

**Commit Messages**: Follow Conventional Commits
```
feat: add new feature
fix: bug fix
docs: documentation update
style: code formatting
refactor: code refactoring
test: add/update tests
chore: build process or tool changes
```

**Pre-commit Hooks**: Husky runs lint-staged automatically:
- ESLint checks modified files
- Prettier formats code
- TypeScript type checking

## Special Agent Context

This project includes specialized Claude Code agents in `.claude/agents/`:

- **ku-architect**: Commerce platform architecture expert (system design, MSA patterns, scalability)
- **ku-api**: NestJS backend specialist (API design, security, database optimization)
- **ku-console**: Next.js admin dashboard expert (data tables, charts, forms, UI/UX)

These agents are activated automatically based on context or can be invoked via Task tool.

## Frontend (apps/console) Development Rules - MANDATORY

### API Specification Reference (REQUIRED)
**Before writing ANY frontend code that calls an API, you MUST:**
1. Read the corresponding API spec file in `docs/api/` folder (e.g., `docs/api/settings.api.md`)
2. Verify endpoint URL, HTTP method, request/response schemas match the spec
3. **Echo confirmation**: After reading the API spec, ALWAYS output:
   ```
   [API Spec Verified] docs/api/{filename}.api.md - {endpoint} ({method})
   ```
4. If no API spec exists in `docs/api/`, ask the user before proceeding

### Shared Types Usage (REQUIRED)
**All frontend code MUST use types from `@ku/types` package:**
1. Check `packages/types/src/` for existing type definitions before creating local types
2. Import shared types: `import { TypeName } from '@ku/types'`
3. **NEVER** create duplicate type definitions in `apps/console/src/types/` if they already exist in `@ku/types`
4. If a new type is needed, add it to `packages/types/src/` and export from `packages/types/src/index.ts`
5. **Echo confirmation**: After importing types, ALWAYS output:
   ```
   [Types Reference] @ku/types/{filename} - {TypeName}
   ```

### FE Known Issues - 공통 주의사항 (REQUIRED)

**1. apiClient(ofetch) FormData 전송** (`lib/api/client.ts`)
- HTTP 클라이언트로 `ofetch`를 사용 (axios에서 마이그레이션 완료)
- ofetch는 `body`에 FormData를 전달하면 자동으로 `multipart/form-data`를 설정함
- Content-Type 수동 지정 불필요 (수동 지정 시 boundary 누락 오류 발생 가능)
```typescript
// WRONG - Content-Type 수동 지정 (boundary 누락됨)
await apiClient('/endpoint', {
  method: 'PUT',
  body: formData,
  headers: { 'Content-Type': 'multipart/form-data' },
});

// CORRECT - ofetch가 FormData 감지 후 자동 설정
await apiClient('/endpoint', {
  method: 'PUT',
  body: formData,
});
```

**2. next/image 대신 img 태그 사용** (개발환경 localhost)
- Next.js 16이 private IP(localhost/127.0.0.1)로의 이미지 프록시를 차단함
- 에러: `upstream image resolved to private ip`
- BE에서 서빙하는 이미지를 표시할 때 `next/image` 대신 일반 `<img>` 태그 사용
```tsx
// WRONG - localhost에서 이미지 프록시 차단됨
<Image src={imageUrl} alt="..." fill />

// CORRECT - 직접 로드
<img src={imageUrl} alt="..." className="object-contain" />
```

**3. BE 정적 파일 URL 생성 시 API prefix 제거** (`lib/api/settings.ts`)
- `NEXT_PUBLIC_API_URL`에 `/api/v1` prefix가 포함되어 있음
- 정적 파일(이미지, 첨부파일)은 API prefix 없이 서빙되므로 origin만 추출하여 사용
```typescript
// WRONG - http://localhost:8000/api/v1/uploads/file.jpg (404)
const url = `${process.env.NEXT_PUBLIC_API_URL}/${path}`;

// CORRECT - http://localhost:8000/uploads/file.jpg
const origin = new URL(process.env.NEXT_PUBLIC_API_URL).origin;
const url = `${origin}/${path}`;
```

**4. React Hook Form + 비동기 데이터 로딩 패턴**
- `useEffect` + `form.reset()`으로 비동기 데이터를 동기화하면 Radix UI 컴포넌트(Select 등)와 validation state 불일치 발생
- **반드시 자식 컴포넌트 패턴 사용**: 데이터 로드 완료 후 form 컴포넌트를 렌더링하여 `defaultValues`에 실제 데이터 주입
```tsx
// WRONG - form.reset()으로 동기화 시 validation 깨짐
function Page() {
  const { data } = useQuery({...});
  const form = useForm({ defaultValues: { field: '' } });
  useEffect(() => { if (data) form.reset(data); }, [data]);
}

// CORRECT - 데이터 로드 후 자식 컴포넌트에서 form 초기화
function Page() {
  const { data, isLoading } = useQuery({...});
  if (isLoading) return <Loading />;
  return <FormChild key={data.id} data={data} />;
}
function FormChild({ data }) {
  const form = useForm({ defaultValues: data }); // 정확한 값으로 초기화
}
```

### Violation of these rules is NOT acceptable. These are blocking requirements.

## CRITICAL RULES - 절대 위반 금지

### 1. DB 테이블 생성 금지
- **사용자가 명시적으로 "테이블을 만들어라"고 요청하기 전까지 절대로 새 테이블을 생성하지 마라.**
- migration 파일 생성, `CREATE TABLE`, `synchronize: true` 모두 금지.
- `synchronize`는 항상 `false`로 유지한다.

### 2. 기존 DB 테이블 우선 확인 (필수)
- **API 개발 전에 반드시 `docs/init_database.sql`과 실제 DB를 조회하여 기존 테이블이 있는지 확인하라.**
- 기존 테이블이 존재하면 해당 테이블을 그대로 사용한다. 중복 테이블을 만들지 마라.
- Entity는 기존 테이블의 컬럼명, 타입, 제약조건을 정확히 매핑해야 한다.
- DB 확인 명령어 예시:
  ```sql
  SHOW TABLES;
  DESCRIBE tb_table_name;
  SELECT * FROM tb_table_name LIMIT 5;
  ```

### 3. .http 테스트 파일 Bearer 토큰 필수
- **`/auth/login`을 제외한 모든 API의 .http 테스트에는 반드시 `Authorization: Bearer {{token}}`을 포함해야 한다.**
- 각 `.http` 파일 상단에 `@token` 변수를 선언하고, 모든 요청에서 `{{token}}`으로 참조한다.
- 로그인 API로 발급받은 `accessToken` 값을 `@token`에 붙여넣어 사용한다.
- JwtAuthGuard가 글로벌 적용되어 있으므로, Bearer 토큰 없이는 401 Unauthorized가 반환된다.
```
@token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.PASTE_YOUR_TOKEN_HERE

### API 요청 예시
GET http://localhost:8000/api/v1/some-endpoint
Authorization: Bearer {{token}}
```

### 4. 페이지 단위 API 단일 호출
- **하나의 페이지에서 저장 버튼을 누르면 API를 한 번만 호출한다.**
- 설정값 + 파일 업로드 등 여러 데이터를 저장할 때 별도 API로 분리하지 말고, 하나의 엔드포인트에서 `multipart/form-data`로 원자적으로 처리한다.
- 하나라도 실패하면 전체 롤백되어야 한다.

### 지침 확인 프로토콜
- **새 세션 시작 시 또는 개발 작업 착수 전에 반드시 이 CRITICAL RULES를 확인하고, 아래와 같이 echo 출력하여 사용자에게 인지시켜라:**
  ```
  [CRITICAL RULES 확인 완료] 1.테이블생성금지 2.기존DB우선확인 3.http파일Bearer필수 4.페이지단위API단일호출
  ```

### 이 규칙을 위반하면 안 됩니다. 모든 개발 작업에 우선 적용됩니다.

---

## Important Notes

### TypeScript Strict Mode
- Both apps use TypeScript strict mode
- Never use `any` types - define explicit interfaces
- All function parameters and return types should be typed

### API Versioning
- All API routes prefixed with `/api/v1/`
- Swagger available at `/api/v1/docs`

### RBAC Roles
- **admin**: Full system access
- **manager**: Limited administrative access
- **viewer**: Read-only access

### Port Configuration
- Console frontend: `3000`
- API backend: `8000`
- MariaDB: `3306` (External Development DB)

### Environment Variables
- Copy `.env.example` to `.env` before first run
- Configure DB connection: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- Never commit `.env` files
- Required variables documented in `.env.example`

### Performance Considerations
- Use pagination for all list endpoints (prevent large data transfers)
- Implement database indexes on foreign keys and frequently queried fields
- Use Redis caching for frequently accessed data (when implemented)
- Optimize N+1 queries with proper eager loading

### Testing Strategy
- **Unit tests**: Service layer logic (target 80%+ coverage)
- **Integration tests**: Controller + Service + Database
- **E2E tests**: Critical user flows with Playwright

## Common Issues & Solutions

### Database connection fails
- Check .env file has correct DB connection info
- Verify `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` values
- Ensure database `ku_wave_plat` exists on development DB server
- Test connection manually: `mysql -h DB_HOST -u DB_USERNAME -p`

### pnpm install fails
- Verify pnpm version: `pnpm --version` (should be 10.21.0+)
- Clear cache: `pnpm store prune`
- Delete node_modules and reinstall

### TypeScript errors after pulling changes
- Run `pnpm install` to update dependencies
- Run `pnpm typecheck` to verify
- Check if shared types in `packages/types` were modified

### Turbo cache issues
- Clear Turbo cache: `rm -rf .turbo`
- Run clean: `pnpm clean`
- Rebuild: `pnpm build`
