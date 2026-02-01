# Navigation System - GNB & LNB Architecture

## Overview

The admin dashboard uses a two-tier navigation system:
- **GNB (Global Navigation Bar)**: Top horizontal navigation with 5 main categories
- **LNB (Local Navigation Bar)**: Left sidebar with context-sensitive sub-menus

## Architecture

### State Management

**Store**: `/stores/navigation.ts`
- Uses Zustand for lightweight state management
- Persists active GNB selection to localStorage
- Type-safe with TypeScript strict mode

```typescript
import { useNavigationStore } from '@/stores/navigation';

const { activeGNB, setActiveGNB } = useNavigationStore();
```

### Components

#### GNB Component (`/components/layout/gnb.tsx`)
- **Location**: Top of dashboard layout
- **Menu Items**: 5 hardcoded categories
  - 컨트롤러 (Controller)
  - RFID
  - 화면공유 (Screen Share)
  - 회원관리 (Member Management)
  - 환경설정 (Settings)
- **Behavior**: Clicking a menu item updates Zustand state, triggering LNB update

#### LNB Component (`/components/layout/sidebar.tsx`)
- **Location**: Left sidebar
- **Behavior**: Automatically displays sub-menus based on active GNB selection
- **Dynamic Content**: Different sub-menus for each GNB category

### Sub-Menu Structure

| GNB Category | Sub-Menus | Routes |
|--------------|-----------|--------|
| 컨트롤러 | 목록, 등록, 설정 | `/dashboard/controller/*` |
| RFID | 태그 관리, 리더기 관리, 로그 | `/dashboard/rfid/*` |
| 화면공유 | 세션 목록, 공유 설정 | `/dashboard/screen-share/*` |
| 회원관리 | 사용자 목록, 권한 관리, 활동 로그 | `/dashboard/members/*` |
| 환경설정 | 시스템 설정, 알림 설정 | `/dashboard/settings/*` |

## Layout Structure

```
┌──────────────────────────────────────────────────┐
│              GNB (Global Navigation)             │
├──────────┬───────────────────────────────────────┤
│          │              Header                   │
│   LNB    ├───────────────────────────────────────┤
│ (Sidebar)│                                       │
│          │          Main Content Area            │
│          │                                       │
└──────────┴───────────────────────────────────────┘
```

## Adding New Menu Items

### 1. Add GNB Menu Item

Edit `/components/layout/gnb.tsx`:

```typescript
// Add new type to GNBMenuItem union
export type GNBMenuItem = 'controller' | 'rfid' | 'new-menu';

// Add to GNB_MENUS array
const GNB_MENUS: GNBMenuConfig[] = [
  // ... existing menus
  {
    id: 'new-menu',
    name: '새 메뉴',
    icon: YourIcon,
  },
];
```

### 2. Add LNB Sub-Menus

Edit `/components/layout/sidebar.tsx`:

```typescript
const LNB_MENU_CONFIG: Record<GNBMenuItem, LNBMenuItem[]> = {
  // ... existing configs
  'new-menu': [
    {
      id: 'new-menu-item',
      name: '서브 메뉴',
      href: '/dashboard/new-menu',
      icon: SubIcon,
    },
  ],
};
```

### 3. Update Store Type

Edit `/stores/navigation.ts`:

```typescript
export type GNBMenuItem = 'controller' | 'rfid' | 'new-menu';
```

## Best Practices

1. **Type Safety**: Always use TypeScript types for menu items
2. **Icon Consistency**: Use lucide-react icons for visual consistency
3. **Route Structure**: Follow `/dashboard/{gnb-category}/{sub-menu}` pattern
4. **Accessibility**: Maintain ARIA labels and keyboard navigation support
5. **Persistence**: Active GNB selection persists across page reloads via localStorage

## Technical Details

- **Framework**: Next.js 14+ with App Router
- **State Management**: Zustand 5.0.9 with persistence middleware
- **UI Components**: shadcn/ui with Radix UI primitives
- **TypeScript**: Strict mode enabled
- **Styling**: Tailwind CSS with custom design tokens

## Files Modified

- `/stores/navigation.ts` - Navigation state store
- `/components/layout/gnb.tsx` - Global Navigation Bar
- `/components/layout/sidebar.tsx` - Local Navigation Bar (Sidebar)
- `/app/(dashboard)/layout.tsx` - Dashboard layout integration
