import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

/**
 * Dashboard Layout Component
 *
 * @description
 * Main dashboard layout with GNB (Global Navigation Bar) and LNB (Local Navigation Bar) structure.
 *
 * Layout Structure:
 * - Header: GNB navigation + notifications + user menu (integrated)
 * - LNB: Left sidebar with context-sensitive sub-menus
 * - Main: Content area with overflow scroll
 *
 * @architecture
 * - GNB triggers LNB menu changes via Zustand state
 * - LNB automatically updates when GNB selection changes
 * - Responsive layout with fixed sidebar and header
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header - GNB Navigation + Notifications + User Menu */}
      <Header />

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* LNB - Local Navigation Bar (Left Sidebar) */}
        <Sidebar />

        {/* Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Main Content with Scroll and Modern Spacing */}
          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-muted/30 via-background/50 to-muted/40 p-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
