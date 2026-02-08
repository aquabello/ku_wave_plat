'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import {
  Cpu,
  Radio,
  Monitor,
  Zap,
  TvMinimalPlay,
  Users,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from './user-menu';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/stores/navigation';

/**
 * GNB menuCode → Icon 매핑
 */
const GNB_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  controller: Zap,
  rfid: Radio,
  'screen-share': Monitor,
  'ai-system': Cpu,
  display: TvMinimalPlay,
  member: Users,
  settings: Settings,
};

/**
 * Header Component
 *
 * @description
 * Top header with logo and permission-based GNB navigation.
 * 로그인 응답의 menus 배열 기반으로 권한이 있는 GNB만 렌더링.
 */
export function Header() {
  const { activeGNB, setActiveGNB, menus } = useNavigationStore();

  const handleLogoClick = () => {
    setActiveGNB(null);
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Logo Area */}
      <div className="flex h-16 w-64 items-center border-r border-border px-6">
        <Link
          href="/dashboard"
          onClick={handleLogoClick}
          className="flex items-center gap-3 transition-all duration-200 hover:scale-105"
        >
          <img
            src="https://kuis.konkuk.ac.kr/ui/theme/images/login/ico_logo.png"
            alt="건국대학교 로고"
            className="h-9 w-auto"
          />
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-lg font-bold tracking-tight">
            KU Wave Plat
          </span>
        </Link>
      </div>

      {/* GNB Navigation - 권한 기반 메뉴만 렌더링 */}
      <nav className="flex flex-1 items-center gap-2 px-6">
        {menus.map((menu) => {
          const isActive = activeGNB === menu.menuCode;
          const Icon = GNB_ICONS[menu.menuCode];

          return (
            <button
              key={menu.menuSeq}
              onClick={() => setActiveGNB(menu.menuCode)}
              className={cn(
                'group relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
                'hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? 'bg-gradient-to-br from-konkuk-green to-konkuk-green-light text-white shadow-lg shadow-konkuk-green/25 hover:shadow-xl hover:shadow-konkuk-green/30'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {Icon && (
                <Icon className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
              )}
              <span className="relative">
                {menu.menuName}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-white/30" />
                )}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Actions - Right Side */}
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
