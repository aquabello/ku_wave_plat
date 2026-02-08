import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GNBMenuItem as GNBMenuGroup } from '@ku/types';

/**
 * Navigation State Interface
 *
 * - activeGNB: 현재 선택된 GNB menuCode
 * - menus: 로그인 시 BE에서 받은 권한 기반 메뉴 트리
 */
interface NavigationState {
  activeGNB: string | null;
  setActiveGNB: (menuCode: string | null) => void;

  menus: GNBMenuGroup[];
  setMenus: (menus: GNBMenuGroup[]) => void;
  clearMenus: () => void;
}

/**
 * Navigation Store - Manages GNB/LNB state with permission-based filtering
 *
 * 로그인 응답의 menus 배열을 저장하여 권한에 맞는 GNB/LNB만 렌더링.
 * activeGNB와 menus를 localStorage에 persist하여 새로고침 시 유지.
 */
export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      activeGNB: null,
      setActiveGNB: (menuCode: string | null) => set({ activeGNB: menuCode }),

      menus: [],
      setMenus: (menus: GNBMenuGroup[]) =>
        set((state) => {
          // 현재 activeGNB가 새 메뉴 목록에 없으면 초기화
          const gnbCodes = menus.map((m) => m.menuCode);
          const isActiveAllowed = state.activeGNB && gnbCodes.includes(state.activeGNB);
          return {
            menus,
            activeGNB: isActiveAllowed ? state.activeGNB : null,
          };
        }),
      clearMenus: () => set({ menus: [], activeGNB: null }),
    }),
    {
      name: 'ku-navigation-storage',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          return { ...(persistedState as Record<string, unknown>), menus: [] };
        }
        return persistedState;
      },
    }
  )
);
