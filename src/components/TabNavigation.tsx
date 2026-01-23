"use client";

import { Film, User, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TabItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const tabItems: TabItem[] = [
  {
    label: "Films",
    path: "/films",
    icon: Film,
  },
  {
    label: "Wallet",
    path: "/wallet",
    icon: Wallet,
  },
  {
    label: "Profile",
    path: "/profile",
    icon: User,
  },
];

interface TabNavigationProps {
  variant: "sidebar" | "bottom";
}

export function TabNavigation({ variant }: TabNavigationProps) {
  const pathname = usePathname();

  // Sidebar variant - Desktop only
  if (variant === "sidebar") {
    return (
      <div className="hidden lg:flex flex-col w-64 bg-background-100/50 backdrop-blur-xl border-r border-background-300/50 z-50">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-background-300/50">
          <h1 className="text-primary-500 text-xl font-bold font-sans tracking-tight">
            CineBlock
          </h1>
          <p className="text-typography-500 text-xs mt-1">Film Investment on Bitcoin</p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 flex flex-col gap-1">
          {tabItems.map((route, index) => {
            const Icon = route.icon;
            const isActive = pathname === route.path;
            return (
              <Link
                key={index}
                href={route.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                  isActive
                    ? "bg-primary-500/20 text-primary-500"
                    : "text-typography-500 hover:bg-background-200 hover:text-typography-900"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full" />
                )}
                <Icon
                  className={`w-5 h-5 transition-all duration-300 ${
                    isActive
                      ? "text-primary-500"
                      : "text-typography-500 group-hover:text-typography-900"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "text-primary-500 font-semibold"
                      : "text-typography-600 group-hover:text-typography-900"
                  }`}
                >
                  {route.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-background-300/50">
          <p className="text-typography-500 text-xs text-center">Powered by Stacks & Bitcoin</p>
        </div>
      </div>
    );
  }

  // Bottom bar variant - Mobile only
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background-0/60 backdrop-blur-xl border-t border-background-300/50 z-50 shadow-[0_-2px_20px_rgba(0,0,0,0.1)]">
      <div className="flex pb-4">
        {tabItems.map((route, index) => {
          const Icon = route.icon;
          const isActive = pathname === route.path;
          return (
            <Link
              key={index}
              href={route.path}
              className="flex-1 flex flex-col items-center justify-center py-4 gap-1.5 transition-all duration-300 relative group"
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-500 rounded-full" />
              )}
              <Icon
                className={`w-6 h-6 transition-all duration-300 ${
                  isActive
                    ? "text-primary-500 scale-110"
                    : "text-typography-500 opacity-55 group-hover:opacity-90"
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-xs leading-4 tracking-wider transition-all duration-300 ${
                  isActive
                    ? "text-primary-500 font-semibold"
                    : "text-typography-600 opacity-55 group-hover:opacity-90"
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
