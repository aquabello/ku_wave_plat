'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
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
  Building2,
  BookOpen,
  Play,
  ListOrdered,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/stores/navigation';

/**
 * LNB menuCode → Icon 매핑
 */
const LNB_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'controller-hardware': SettingsIcon,
  'controller-control': SlidersHorizontal,
  'rfid-tag': Tag,
  'rfid-reader': Cpu,
  'rfid-log': FileText,
  'screen-session': MonitorPlay,
  'screen-settings': SlidersHorizontal,
  'ai-lecture-summary': BookOpen,
  'display-player': Play,
  'display-list': ListOrdered,
  'display-content': FolderOpen,
  'member-list': Users,
  'member-permissions': Shield,
  'member-activity': Activity,
  'settings-buildings': Building2,
  'settings-system': Wrench,
};

/**
 * LNB (Local Navigation Bar) Component - Left Sidebar
 *
 * @description
 * 로그인 응답의 menus 배열에서 선택된 GNB의 children을 렌더링.
 * menuPath를 href로 사용하여 라우팅 연결.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { activeGNB, menus } = useNavigationStore();

  // 현재 활성 GNB의 children (LNB 메뉴)
  const activeGroup = menus.find((m) => m.menuCode === activeGNB);
  const currentMenus = activeGroup?.children ?? [];

  // 가장 구체적인(가장 긴) menuPath 매칭 아이템만 활성화
  const activeItemCode = currentMenus.reduce<string | null>((bestCode, item) => {
    if (!item.menuPath) return bestCode;
    const matches = pathname === item.menuPath || pathname.startsWith(item.menuPath + '/');
    if (!matches) return bestCode;
    const bestItem = currentMenus.find((m) => m.menuCode === bestCode);
    if (!bestItem?.menuPath) return item.menuCode;
    return item.menuPath.length > bestItem.menuPath.length ? item.menuCode : bestCode;
  }, null);

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
            const isActive = item.menuCode === activeItemCode;
            const Icon = LNB_ICONS[item.menuCode];

            return (
              <Link
                key={item.menuSeq}
                href={item.menuPath ?? '#'}
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
                <span className="flex-1">{item.menuName}</span>
                {isActive && (
                  <span className="h-2 w-2 rounded-full bg-white/60 shadow-sm" />
                )}
              </Link>
            );
          })
        )}
      </nav>

      {/* Footer Info */}
      <div className="border-t border-border bg-muted/30 p-5">
        <div className="rounded-lg bg-background/50 p-3 backdrop-blur">
          <div className="flex items-center gap-2 text-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-konkuk-green/10 text-konkuk-green">
              <span className="font-bold">{currentMenus.length}</span>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground">
                {activeGroup?.menuName ?? '대시보드'}
              </div>
              <div className="text-muted-foreground/70">메뉴 항목</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
