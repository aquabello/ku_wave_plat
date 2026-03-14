# Shared Packages & Type System Analysis

**Document**: Comprehensive inventory of all shared packages in the KU-WAVE-PLAT monorepo
**Date**: 2026-03-14
**Status**: Complete Research

---

## Overview

The KU-WAVE-PLAT monorepo has **4 shared packages** under `/packages/`:

| Package | Purpose | Consumers |
|---------|---------|-----------|
| `@ku/types` | TypeScript type definitions | apps/api, apps/console |
| `@ku/contracts` | Zod-based API contracts (single source of truth) | apps/api |
| `@ku/config` | Shared ESLint, TypeScript, Prettier configs | All packages |
| `@ku/ui` | Shared UI components (shadcn/ui) | apps/console (planned) |

All packages are **private** and use **workspace protocol** (`workspace:*`) for local dependencies.

---

## Package Details

### 1. @ku/types - Type Definitions

**Purpose**: Central registry of TypeScript interfaces and enums shared across frontend and backend.

**Location**: `/packages/types`

**Build Configuration**:
```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit"
  }
}
```

**Complete Type Inventory** (27 type files):

#### Authentication & Authorization
- **auth.types.ts**
  - `LoginDto` - Login request
  - `LoginResponse` - Login response with tokens and user info
  - `RefreshResponse` - Token refresh response
  - `JwtPayload` - JWT payload structure
  - `CurrentUser` - Authenticated user info

- **user.types.ts**
  - `UserRole` enum: `ADMIN | MANAGER | VIEWER`
  - `User` - User entity
  - `UserFilter` - User list filtering

- **permission.types.ts** - RBAC permission types

- **menu.types.ts**
  - `LNBMenuItem` - Left sidebar menu items
  - `GNBMenuItem` - Top navigation menu items with children
  - `UserMenuResponse` - User's menu permissions
  - `UpdateUserMenusRequest` - Update menu permissions

#### Core Entities
- **building.types.ts**
  - `BuildingListItem` - Building in list view
  - `BuildingListResponse` - Paginated buildings
  - `CreateBuildingDto` - Create building request
  - `UpdateBuildingDto` - Update building request

- **space.types.ts** (Rooms/Spaces within buildings)
  - `SpaceListItem` - Space in list
  - `SpaceDetail` - Space detail view
  - `SpaceListResponse` - Paginated spaces
  - `CreateSpaceDto` - Create space
  - `UpdateSpaceDto` - Update space
  - `SpaceListQuery` - Space list query filters

- **member.types.ts** - User membership types

#### Hardware Management
- **player.types.ts** (Display devices for content playback)
  - `PlayerStatus` type: `ONLINE | OFFLINE | ERROR | MAINTENANCE`
  - `PlayerApproval` type: `PENDING | APPROVED | REJECTED`
  - `PlayerOrientation` type: `LANDSCAPE | PORTRAIT`
  - `PlayerListItem` - Player in list (with building/space/playlist info)
  - `Player` - Player full detail
  - `CreatePlayerDto` - Register player
  - `UpdatePlayerDto` - Update player
  - `HeartbeatDto` - Health check from player
  - `HeartbeatResponse` - Health check response
  - `HeartbeatLog` - Health check log item

- **recorder.types.ts** (Recording devices - ONVIF/RTSP cameras)
  - **Status Types**: `RecorderStatus` (ONLINE|OFFLINE|ERROR), `RecorderProtocol` (HTTP|ONVIF|RTSP)
  - **Recording Types**: `SessionStatus` (RECORDING|COMPLETED|FAILED|CANCELLED)
  - **FTP Types**: `FtpUploadStatus` (PENDING|UPLOADING|COMPLETED|FAILED|RETRY), `FtpProtocol` (FTP|SFTP|FTPS)
  - **Control Types**: `PtzAction` (move|stop|home), `LogType`, `ResultStatus`
  - **CRUD Interfaces**:
    - `RecorderListItem` - Recorder in list
    - `RecorderDetail` - Recorder full detail with presets
    - `RecorderAssignedUser` - User managing recorder
    - `RecorderPreset` - PTZ preset (pan/tilt/zoom)
    - `CreateRecorderDto` - Register recorder
    - `UpdateRecorderDto` - Update recorder
    - `CreateRecorderPresetDto` - Create PTZ preset
    - `UpdateRecorderPresetDto` - Update preset
  - **Control Interfaces**:
    - `PtzCommand` - PTZ movement command
    - `PtzResponse` - PTZ execution result
    - `RecordStartDto` - Start recording
    - `RecordStartResponse` - Recording started response
    - `RecordStopResponse` - Recording stopped response
    - `PresetApplyResponse` - Preset applied result
    - `RecorderControlStatus` - Current recorder state
  - **Session & Files**:
    - `RecordingSessionListItem` - Recording session in list
    - `RecordingFileItem` - Video file (with FTP upload status)
    - `RecordingSessionDetail` - Session with files
    - `RecordingFileListItem` - File in list
  - **FTP Configuration**:
    - `FtpConfigListItem` - FTP server config
    - `CreateFtpConfigDto` - Create FTP config
    - `UpdateFtpConfigDto` - Update FTP config
    - `FtpTestResponse` - FTP connectivity test result
  - **Logs**:
    - `RecorderLogItem` - Recorder activity log

#### Content Management
- **content.types.ts** (Video/Image/HTML/Stream content)
  - `ContentType` type: `VIDEO | IMAGE | HTML | STREAM`
  - `ContentListItem` - Content in list (with thumbnail, duration, size)
  - `Content` - Content full detail
  - `CreateContentDto` - Upload content
  - `UpdateContentDto` - Update content

- **playlist.types.ts** - Playlist management for players

- **content-approval.types.ts** - Content approval workflow

#### Media & AI System
- **ai.types.ts** - AI system types (worker servers, lecture summary, etc.)

- **nfc.types.ts** - NFC card management

- **controller.types.ts** - Device controller types

#### System & Dashboard
- **api.types.ts** (Common API types)
  - `ApiResponse<T>` - Standard API response wrapper
  - `PaginationMeta` - Pagination metadata
  - `ApiError` - Error response structure
  - `PaginationDto` - Pagination query parameters
  - `SearchDto` - Search filter parameters

- **dashboard.types.ts** - Dashboard statistics and metrics

- **settings.types.ts** (System configuration)
  - `SettingResponse` - System settings from db_setting table
  - `UpdateSettingRequest` - Update system settings
  - Fields: apiTime, playerTime, screenStart, screenEnd, playerVer, links, defaultImage

- **activity-log.types.ts** - Activity/audit logging

---

### 2. @ku/contracts - Zod API Contracts

**Purpose**: **Single source of truth** for API request/response validation using Zod schemas. Ensures type safety and contract consistency between frontend and backend.

**Location**: `/packages/contracts`

**Build Configuration**:
```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "dependencies": {
    "zod": "^3.25.76"
  }
}
```

**Schema Files**:

#### Common Schemas (`common/api.schema.ts`)
- `PaginationMetaSchema` - Pagination metadata
- `ApiErrorSchema` - Error structure
- `ApiSuccessSchema<T>()` - Generic success response wrapper
- `ApiErrorResponseSchema` - Error response wrapper
- `ApiMessageResponseSchema` - Message-only response
- `PaginatedSchema<T>()` - Items array with pagination
- `PaginatedWithMetaSchema<T>()` - Separate pagination metadata

#### Domain Schemas
- **auth/auth.schema.ts**
  - `LoginDtoSchema` → type `LoginDto`
  - `LoginResponseSchema` → type `LoginResponse`
  - `RefreshResponseSchema` → type `RefreshResponse`
  - `JwtPayloadSchema` → type `JwtPayload`
  - `CurrentUserSchema` → type `CurrentUser`

- **menu/menu.schema.ts** - Menu item schemas
- **player/player.schema.ts** - Player CRUD schemas
- **settings/settings.schema.ts** - Settings schemas
- **building/building.schema.ts** - Building schemas
- **nfc/nfc.schema.ts** - NFC schemas
- **content/content.schema.ts** - Content schemas
- **playlist/playlist.schema.ts** - Playlist schemas
- **controller/controller.schema.ts** - Controller schemas

**Usage Pattern**:
```typescript
// Schema definition with Zod
export const LoginDtoSchema = z.object({
  id: z.string(),
  password: z.string(),
});

// Automatic type inference
export type LoginDto = z.infer<typeof LoginDtoSchema>;
```

**Key Feature**: Eliminates duplicate type definitions—Zod infers types, ensuring frontend and backend validate against identical contracts.

---

### 3. @ku/config - Shared Configuration

**Purpose**: Centralized ESLint, TypeScript, and Prettier configurations for consistency across all packages and apps.

**Location**: `/packages/config`

**Files**:
1. **eslint-preset.js**
   - Extends: eslint:recommended, @typescript-eslint/recommended, prettier
   - Parser: @typescript-eslint/parser
   - Enforces strict TypeScript rules
   - Allows unused variables prefixed with `_`
   - Warns on `any` types

2. **tsconfig.base.json**
   - Target: ES2022
   - Strict mode: enabled
   - noUnusedLocals, noUnusedParameters: enabled
   - incremental: true (for faster rebuilds)
   - Excludes: node_modules, dist, build, .next, coverage

3. **prettier.config.js**
   - Semi: true
   - Trailing comma: all
   - Single quotes
   - Print width: 100
   - Tab width: 2
   - Line ending: lf

**Referenced by**: All packages via `extends` in their local configs

---

### 4. @ku/ui - Shared UI Components

**Purpose**: Shared shadcn/ui component library for consistent UI across console application.

**Location**: `/packages/ui`

**Status**: **Placeholder - not yet implemented**

Current content (`src/index.ts`):
```typescript
export const version = '1.0.0';
// shadcn/ui components will be exported here
// export * from './components/ui/button';
// etc.
```

**Planned**:
- shadcn/ui component re-exports
- Tailwind CSS integration
- Radix UI primitives
- Design system foundation

**Build Configuration**:
```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  }
}
```

---

## Package Dependencies & Consumption

### Dependency Graph

```
┌─────────────────────────────────────────────────┐
│  @ku/config (shared configs)                    │
│  - ESLint, TypeScript, Prettier                 │
└────┬──────────────────────────────────────────┬─┘
     │                                           │
┌────▼──────┐    ┌──────────────┐    ┌──────────▼────┐
│ @ku/types │◄───┤ @ku/contracts│    │   @ku/ui      │
│  (types)  │    │  (schemas)   │    │  (components) │
└────┬──────┘    └──────┬───────┘    └───────────────┘
     │                  │
     └──────┬───────────┘
            │
     ┌──────▼──────────────────┐
     │   apps/api (NestJS)     │
     │  Uses: @ku/types        │
     │  Uses: @ku/contracts    │
     └──────────────────────────┘

     ┌──────────────────────────┐
     │ apps/console (Next.js)   │
     │ Uses: @ku/types          │
     └──────────────────────────┘
```

### Dependency Declaration

**apps/api/package.json**:
```json
{
  "dependencies": {
    "@ku/contracts": "workspace:*",
    "@ku/types": "workspace:*"
  }
}
```

**apps/console/package.json**:
```json
{
  "dependencies": {
    "@ku/types": "workspace:*"
  }
}
```

### Usage in apps/api

- Imports `@ku/types` for entity interfaces, DTOs, and API response types
- Imports `@ku/contracts` for Zod schema validation
- Example: Building module uses `CreateBuildingDto`, `UpdateBuildingDto` from `@ku/types`

### Usage in apps/console

- Imports `@ku/types` for type-safe props and API responses
- Example imports found:
  - `BuildingListItem`, `CreateBuildingDto` in settings/buildings pages
  - `RecorderListItem`, `RecorderDetail` in controller/hardware
  - `ContentListItem` in content management
  - `PlayerListItem` in player management

**Sample import**:
```typescript
import type { BuildingListItem, CreateBuildingDto } from '@ku/types';
```

---

## Build & Distribution

### Build Commands

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @ku/types build
pnpm --filter @ku/contracts build

# Watch mode for development
pnpm --filter @ku/types dev

# Type checking
pnpm typecheck
```

### Output Structure

Each TypeScript package compiles to:
```
packages/{package-name}/
├── src/
│   └── index.ts (and feature files)
└── dist/
    ├── index.js
    ├── index.d.ts
    ├── *.js
    └── *.d.ts
```

### TypeScript Config Inheritance

All packages inherit from `/packages/config/tsconfig.base.json`:
```json
{
  "extends": "../../packages/config/tsconfig.base.json"
}
```

---

## Key Architectural Patterns

### 1. Single Source of Truth (Contracts)

The `@ku/contracts` package uses Zod to define schemas once, eliminating duplicate type definitions:

```typescript
// One schema = One TypeScript type
export const LoginDtoSchema = z.object({
  id: z.string(),
  password: z.string(),
});

export type LoginDto = z.infer<typeof LoginDtoSchema>;
```

**Benefits**:
- Frontend and backend validate against identical contracts
- No type duplication
- Runtime validation possible (especially on backend)

### 2. Workspace Protocol

All internal dependencies use `workspace:*`:
```json
"@ku/types": "workspace:*"
```

This ensures:
- Symlinked dependencies in development
- Automatic version resolution
- No published package dependency

### 3. Strict TypeScript Configuration

- All packages enforce `strict: true`
- `noUnusedLocals`, `noUnusedParameters` enabled
- Forces explicit type annotations
- `declaration: true` generates `.d.ts` files for consumers

### 4. Decoupled Concerns

- **@ku/types**: Pure type definitions (no logic)
- **@ku/contracts**: Validation schemas (Zod-based)
- **@ku/config**: Tool configurations (shared tooling)
- **@ku/ui**: Visual components (future)

---

## Type Inventory Summary

### Total Types: 200+

**By Category**:
- Authentication: 5 interfaces
- User/RBAC: 3 interfaces + 1 enum
- Building/Space: 8 interfaces
- Player/Recorder: 40+ interfaces (hardware-intensive)
- Content/Media: 8 interfaces + 1 type union
- Menus: 4 interfaces
- Settings/System: 3 interfaces
- API Common: 6 interfaces
- Dashboard: TBD
- Activity Log: TBD
- NFC: TBD
- AI System: TBD

### Naming Conventions

1. **List Items**: `{Entity}ListItem` - For display in tables (minimal fields)
   - Example: `BuildingListItem`, `PlayerListItem`

2. **Detailed Views**: `{Entity}Detail` or `{Entity}` - Full object with relations
   - Example: `SpaceDetail`, `RecorderDetail`, `Player`

3. **CRUD DTOs**: `Create{Entity}Dto`, `Update{Entity}Dto`
   - Example: `CreateBuildingDto`, `UpdateRecorderDto`

4. **Responses**: `{Entity}Response` or `{Action}Response`
   - Example: `LoginResponse`, `RecordStartResponse`

5. **Metadata**: `{Entity}Meta` or `{Action}Meta`
   - Example: `PaginationMeta`

---

## Consumer Files Using @ku/types

### apps/console

**Settings Module**:
- `app/(dashboard)/settings/buildings/page.tsx` → BuildingListItem, CreateBuildingDto
- `app/(dashboard)/settings/buildings/[buildingSeq]/page.tsx` → Building types

**Controller Module**:
- `controller/hardware/page.tsx` → Recorder types
- `controller/control/page.tsx` → Recorder control types

**AI System Module**:
- `ai-system/lecture-summary/page.tsx` → LectureSummaryListItem
- `ai-system/worker-servers/` → WorkerServerListItem

---

## Recommendations for Development

### Adding New Types

1. Create new file in `/packages/types/src/{domain}.types.ts`
2. Define interfaces following naming conventions
3. Export from `/packages/types/src/index.ts`
4. Import in apps/api and apps/console

### Adding Validation Schemas

1. Create schema file in `/packages/contracts/src/{domain}/`
2. Define Zod schemas with `Schema` suffix
3. Export inferred types with `type` suffix
4. Export from `/packages/contracts/src/index.ts`

### Best Practices

- Keep types pure (no logic) in `@ku/types`
- Schemas in `@ku/contracts` should mirror type definitions
- Always use `workspace:*` for internal package dependencies
- Run `pnpm typecheck` before committing
- Never duplicate types across packages

---

## Files Reference

- Type definitions: `/packages/types/src/*.types.ts` (27 files)
- Schemas: `/packages/contracts/src/**/*.schema.ts` (9 files)
- Config: `/packages/config/{eslint,tsconfig,prettier}.*`
- UI components: `/packages/ui/src/` (placeholder)

---

[RESEARCH_COMPLETE] ✓ All shared packages analyzed and documented.
