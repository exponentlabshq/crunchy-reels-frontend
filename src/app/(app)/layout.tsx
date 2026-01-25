"use client";

import { TabNavigation } from "@/components/TabNavigation";
import { StacksWalletGuard } from "@/components/StacksWalletGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <StacksWalletGuard>
      <div className="h-screen overflow-hidden bg-background-0 flex">
        {/* Sidebar - fixed height, independent scroll */}
        <TabNavigation variant="sidebar" />

        {/* Main content - independent scroll container */}
        <main className="flex-1 h-full overflow-y-auto">{children}</main>

        {/* Mobile bottom nav */}
        <TabNavigation variant="bottom" />
      </div>
    </StacksWalletGuard>
  );
}
