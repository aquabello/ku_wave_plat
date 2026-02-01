'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  List,
  PlusCircle,
  Settings as SettingsIcon,
  Tag,
  Cpu,
  FileText,
  MonitorPlay,
  SlidersHorizontal,
  Users,
  Shield,
  Activity,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigationStore, type GNBMenuItem, type LNBMenuItem } from '@/stores/navigation';

/**
 * LNB Menu Configuration by GNB Category
 */
const LNB_MENU_CONFIG: Record<GNBMenuItem, LNBMenuItem[]> = {
  controller: [
    {
      id: 'controller-list',
      name: '목록',
      href: '/controller',
      icon: List,
    },
    {
      id: 'controller-register',
      name: '등록',
      href: '/controller/register',
      icon: PlusCircle,
    },
    {
      id: 'controller-settings',
      name: '설정',
      href: '/controller/settings',
      icon: SettingsIcon,
    },
  ],
  rfid: [
    {
      id: 'rfid-tag',
      name: '태그 관리',
      href: '/rfid/tags',
      icon: Tag,
    },
    {
      id: 'rfid-reader',
      name: '리더기 관리',
      href: '/rfid/readers',
      icon: Cpu,
    },
    {
      id: 'rfid-log',
      name: '로그',
      href: '/rfid/logs',
      icon: FileText,
    },
  ],
  'screen-share': [
    {
      id: 'screen-session',
      name: '세션 목록',
      href: '/screen-share/sessions',
      icon: MonitorPlay,
    },
    {
      id: 'screen-settings',
      name: '공유 설정',
      href: '/screen-share/settings',
      icon: SlidersHorizontal,
    },
  ],
  member: [
    {
      id: 'member-list',
      name: '사용자 목록',
      href: '/members',
      icon: Users,
    },
    {
      id: 'member-permissions',
      name: '권한 관리',
      href: '/members/permissions',
      icon: Shield,
    },
    {
      id: 'member-activity',
      name: '활동 로그',
      href: '/members/activity',
      icon: Activity,
    },
  ],
  settings: [{
    id: 'settings-system',
    name: '시스템 설정',
    href: '/settings',
    icon: Wrench,
  }],
};

/**
 * LNB (Local Navigation Bar) Component - Left Sidebar
 *
 * @description
 * Left sidebar navigation that displays sub-menus based on active GNB selection.
 * Automatically updates when GNB selection changes.
 *
 * @features
 * - Dynamic sub-menu rendering based on GNB state
 * - Active route highlighting
 * - Icon-based navigation items
 * - Responsive layout with fixed width
 * - Keyboard accessible navigation
 */
export function Sidebar() {
  const pathname = usePathname();
  const { activeGNB } = useNavigationStore();

  // Get sub-menus for current GNB selection
  const currentMenus = LNB_MENU_CONFIG[activeGNB] || [];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
      {/* LNB Navigation Menu */}
      <nav className="flex-1 space-y-2 px-4 py-6" aria-label="Local navigation">
        {currentMenus.length === 0 ? (
          <div className="rounded-xl bg-muted/50 px-4 py-8 text-center">
            <p className="text-sm font-medium text-muted-foreground">메뉴를 선택해주세요</p>
            <p className="mt-1 text-xs text-muted-foreground/60">상단 메뉴를 클릭하세요</p>
          </div>
        ) : (
          currentMenus.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  'hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive
                    ? 'bg-gradient-to-r from-konkuk-green to-konkuk-green-light text-white shadow-lg shadow-konkuk-green/20'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground hover:shadow-md'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-white/40" />
                )}
                {Icon && (
                  <Icon className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive ? "scale-110" : "group-hover:scale-110"
                  )} />
                )}
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <span className="h-2 w-2 rounded-full bg-white/60 shadow-sm" />
                )}
              </Link>
            );
          })
        )}
      </nav>

      {/* Footer Info with Modern Styling */}
      <div className="border-t border-border bg-muted/30 p-5">
        <div className="rounded-lg bg-background/50 p-3 backdrop-blur">
          <div className="flex items-center gap-2 text-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-konkuk-green/10 text-konkuk-green">
              <span className="font-bold">{currentMenus.length}</span>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground">{getLNBTitle(activeGNB)}</div>
              <div className="text-muted-foreground/70">메뉴 항목</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/**
 * Get localized title for LNB based on active GNB
 */
function getLNBTitle(gnb: GNBMenuItem): string {
  const titles: Record<GNBMenuItem, string> = {
    controller: '컨트롤러',
    rfid: 'RFID',
    'screen-share': '화면공유',
    member: '회원관리',
    settings: '환경설정',
  };

  return titles[gnb] || '';
}
