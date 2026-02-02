"use client";

import { ArrowLeftRight, ChevronDown, Code, Film, User, Wallet, Zap, Eye, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStacksWallet } from "@/context/StacksWalletContext";
import { truncateAddress } from "@/utils/truncateAddress";

interface TabItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const tabItems: TabItem[] = [
  {
    label: "Anime",
    path: "/films",
    icon: Film,
  },
  {
    label: "Wallet",
    path: "/wallet",
    icon: Wallet,
  },
  {
    label: "Bridge",
    path: "/bridge",
    icon: ArrowLeftRight,
  },
  {
    label: "Contract Tester",
    path: "/contract-tester",
    icon: Code,
  },
];

interface TabNavigationProps {
  variant: "sidebar" | "bottom";
}

export function TabNavigation({ variant }: TabNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected, isDemoMode, address, exitDemoMode } = useStacksWallet();

  function handleExitDemoMode() {
    exitDemoMode();
    router.push("/connect-wallet");
  }

  if (variant === "sidebar") {
    return (
      <div className="hidden lg:flex flex-col w-[260px] bg-[#111113] border-l-[3px] border-l-primary-500 h-screen shrink-0 z-50">
        <div className="flex flex-col justify-between h-full py-6 px-5 overflow-y-auto">
          {/* Sidebar Top */}
          <div className="flex flex-col gap-8">
            {/* Logo */}
            <div className="flex items-center gap-2.5 pb-4">
              <span className="text-white text-lg font-semibold font-mono tracking-[4px]">
                CRUNCHYREELS
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            </div>

            {/* Navigation Items */}
            <nav className="flex flex-col gap-1">
              {tabItems.map((route) => {
                const Icon = route.icon;
                const isActive = pathname === route.path || pathname.startsWith(route.path + "/");
                return (
                  <Link
                    key={route.path}
                    href={route.path}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-[#1A1A1D] text-white"
                        : "text-[#8B8B90] hover:bg-[#1A1A1D]/50 hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] ${
                        isActive ? "text-primary-500" : "text-[#6B6B70]"
                      }`}
                      strokeWidth={1.5}
                    />
                    <span className={`text-sm ${isActive ? "font-medium" : "font-normal"}`}>
                      {route.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Bottom */}
          <div className="flex flex-col gap-4">
            {/* Demo Mode Indicator & Exit Button */}
            {isDemoMode && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Eye className="w-4 h-4 text-amber-500" />
                  <span className="text-[11px] font-medium text-amber-500">Demo Mode Active</span>
                </div>
                <button
                  onClick={handleExitDemoMode}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4 text-white" />
                  <span className="text-[12px] font-medium text-white">Connect Wallet</span>
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-[#2A2A2E]" />

            {/* Account Section */}
            {isConnected && address ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#2A2A2E] flex items-center justify-center">
                    <span className="text-xs font-semibold text-[#8B8B90]">
                      {address.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-medium text-white">
                      {truncateAddress(address).split("...")[0]}
                    </span>
                    <span className="text-[11px] font-mono text-[#6B6B70]">
                      {truncateAddress(address)}
                    </span>
                  </div>
                </div>
            
              </div>
            ) : !isDemoMode ? (
              <Link
                href="/connect-wallet"
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-9 h-9 rounded-full bg-[#2A2A2E] flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-[#6B6B70]" />
                </div>
                <span className="text-[13px] text-[#8B8B90]">Connect Wallet</span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Bottom bar variant - Mobile only
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background-50/95 backdrop-blur-xl border-t border-background-300 z-50">
      <div className="flex pb-4">
        {tabItems.slice(0, 4).map((route) => {
          const Icon = route.icon;
          const isActive = pathname === route.path || pathname.startsWith(route.path + "/");
          return (
            <Link
              key={route.path}
              href={route.path}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all duration-200 relative"
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary-500 rounded-full" />
              )}
              <Icon
                className={`w-5 h-5 transition-all ${
                  isActive
                    ? "text-primary-500"
                    : "text-typography-500"
                }`}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span
                className={`text-[11px] transition-all ${
                  isActive
                    ? "text-primary-500 font-medium"
                    : "text-typography-500"
                }`}
              >
                {route.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
