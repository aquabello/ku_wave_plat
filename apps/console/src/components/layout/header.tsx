'use client';

import Link from 'next/link';
import { Bell, LayoutDashboard } from 'lucide-react';
import {
  Cpu,
  Radio,
  Monitor,
  Users,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from './user-menu';
import { cn } from '@/lib/utils';
import { useNavigationStore, type GNBMenuItem } from '@/stores/navigation';

/**
 * GNB Menu Configuration
 */
interface GNBMenuConfig {
  id: GNBMenuItem;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const GNB_MENUS: GNBMenuConfig[] = [
  {
    id: 'controller',
    name: '컨트롤러',
    icon: Cpu,
  },
  {
    id: 'rfid',
    name: 'RFID',
    icon: Radio,
  },
  {
    id: 'screen-share',
    name: '화면공유',
    icon: Monitor,
  },
  {
    id: 'member',
    name: '회원관리',
    icon: Users,
  },
  {
    id: 'settings',
    name: '환경설정',
    icon: Settings,
  },
];

/**
 * Header Component
 *
 * @description
 * Top header with logo, integrated GNB navigation, notifications, and user menu.
 *
 * Layout Structure:
 * - Logo Area (w-64): KU Console brand - aligned with sidebar
 * - GNB Navigation: Menu items (컨트롤러, RFID, 화면공유, 회원관리, 환경설정)
 * - Right Actions: Notification bell + User menu
 */
export function Header() {
  const { activeGNB, setActiveGNB } = useNavigationStore();

  const handleLogoClick = () => {
    setActiveGNB(null);
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Logo Area - Aligned with Sidebar with Konkuk Green Gradient */}
      <div className="flex h-16 w-64 items-center border-r border-border px-6">
        <Link
          href="/dashboard"
          onClick={handleLogoClick}
          className="flex items-center gap-3 transition-all duration-200 hover:scale-105"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-konkuk-green to-konkuk-green-light text-white shadow-lg shadow-konkuk-green/20 transition-all duration-200 hover:shadow-xl hover:shadow-konkuk-green/30">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-lg font-bold tracking-tight">
            KU Wave Plat
          </span>
        </Link>
      </div>

      {/* GNB Navigation - Center with Modern Styling */}
      <nav className="flex flex-1 items-center gap-2 px-6">
        {GNB_MENUS.map((menu) => {
          const isActive = activeGNB === menu.id;
          const Icon = menu.icon;

          return (
            <button
              key={menu.id}
              onClick={() => setActiveGNB(menu.id)}
              className={cn(
                'group relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                'hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? 'bg-gradient-to-br from-konkuk-green to-konkuk-green-light text-white shadow-lg shadow-konkuk-green/25 hover:shadow-xl hover:shadow-konkuk-green/30'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn(
                "h-4 w-4 transition-transform duration-200",
                isActive ? "scale-110" : "group-hover:scale-110"
              )} />
              <span className="relative">
                {menu.name}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-white/30" />
                )}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Actions - Right Side with Enhanced Styling */}
      <div className="flex items-center gap-3 px-6">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-xl transition-all duration-200 hover:scale-105 hover:bg-accent/50"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-konkuk-orange opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-konkuk-orange shadow-lg shadow-konkuk-orange/50" />
          </span>
        </Button>
        <UserMenu />
      </div>
    </header>
  );
}
