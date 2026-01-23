import { TabNavigation } from "@/components/TabNavigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background-0 flex flex-col">
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <TabNavigation variant="sidebar" />

        <main className="flex-1 overflow-hidden">{children}</main>

        <TabNavigation variant="bottom" />
      </div>
    </div>
  );
}
