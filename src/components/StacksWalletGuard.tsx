"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStacksWallet } from "@/context/StacksWalletContext";

interface StacksWalletGuardProps {
  children: React.ReactNode;
}

export function StacksWalletGuard({ children }: StacksWalletGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected, isDemoMode } = useStacksWallet();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Skip redirect during initial hydration - wait a tick for wallet state to load
    const timer = setTimeout(() => {
      if (!isConnected && !isDemoMode) {
        router.replace("/connect-wallet");
      }
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [isConnected, isDemoMode, router, pathname]);

  // Show loading while checking connection/demo mode to prevent flash
  if (isChecking || (!isConnected && !isDemoMode)) {
    return (
      <div className="h-screen bg-background-0 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
