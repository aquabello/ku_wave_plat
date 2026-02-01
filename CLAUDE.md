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
- **Database**: MariaDB 11.2 via Docker
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

# Start development (auto-starts MariaDB + both apps)
pnpm dev

# Start development without DB check (force mode)
pnpm dev:force

# Start development with manual DB verification
pnpm dev:manual

# Development URLs:
# - Console: http://localhost:3000
# - API: http://localhost:4000
# - Swagger: http://localhost:4000/api/v1/docs
```

### Database Management

```bash
# Start MariaDB container
pnpm db:start

# Stop MariaDB container
pnpm db:stop

# Restart MariaDB container
pnpm db:restart

# View MariaDB logs
pnpm db:logs

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
- API backend: `4000`
- MariaDB: `3306` (Docker container)

### Environment Variables
- Copy `.env.example` to `.env` before first run
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
- Ensure Docker is running: `docker ps`
- Start MariaDB: `pnpm db:start`
- Check logs: `pnpm db:logs`

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
