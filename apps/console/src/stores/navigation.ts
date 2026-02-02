import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * GNB (Global Navigation Bar) Menu Item Type
 */
export type GNBMenuItem = 'controller' | 'rfid' | 'screen-share' | 'ai-system' | 'display' | 'member' | 'settings';

/**
 * LNB (Local Navigation Bar) Sub-Menu Item
 */
export interface LNBMenuItem {
  id: string;
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Navigation State Interface
 */
interface NavigationState {
  activeGNB: GNBMenuItem | null;
  setActiveGNB: (menu: GNBMenuItem | null) => void;
}

/**
 * Navigation Store - Manages GNB and LNB state
 *
 * @description
 * Zustand store for managing global and local navigation state.
 * Persists active GNB selection to localStorage for session continuity.
 */
export const useNavigationStore = create<NavigationState>()(
  persist(
    (set) => ({
      activeGNB: null,
      setActiveGNB: (menu: GNBMenuItem | null) => set({ activeGNB: menu }),
    }),
    {
      name: 'ku-navigation-storage',
      version: 1,
    }
  )
);
