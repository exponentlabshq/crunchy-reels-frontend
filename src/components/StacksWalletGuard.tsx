"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStacksWallet } from "@/context/StacksWalletContext";

interface StacksWalletGuardProps {
  children: React.ReactNode;
}

export function StacksWalletGuard({ children }: StacksWalletGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected } = useStacksWallet();

  useEffect(() => {
    // Skip redirect during initial hydration - wait a tick for wallet state to load
    const timer = setTimeout(() => {
      if (!isConnected) {
        router.replace("/connect-wallet");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isConnected, router, pathname]);

  // Show nothing while checking connection to prevent flash
  if (!isConnected) {
    return (
      <div className="h-screen bg-background-0 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
