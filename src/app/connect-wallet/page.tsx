"use client";

import { useRouter } from "next/navigation";
import { Wallet as WalletIcon, Film, Bitcoin, Eye } from "lucide-react";
import { useEffect } from "react";
import { useStacksWallet } from "@/context/StacksWalletContext";

export default function ConnectWalletPage() {
  const router = useRouter();
  const { isConnected, isConnecting, isDemoMode, connect, enterDemoMode } = useStacksWallet();

  useEffect(() => {
    if (isConnected || isDemoMode) {
      router.push("/films");
    }
  }, [isConnected, isDemoMode, router]);

  function handleDemoMode() {
    enterDemoMode();
    router.push("/films");
  }

  return (
    <div className="flex-1 bg-background-0 flex flex-col min-h-screen">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-5 ring-2 ring-primary-500/30">
            <WalletIcon className="w-8 h-8 text-primary-500" />
          </div>
          <h1 className="text-typography-950 text-2xl font-semibold mb-2 font-sans">
            Connect Your Wallet
          </h1>
          <p className="text-typography-300 text-base max-w-sm mx-auto">
            Connect your Stacks wallet to invest in tokenized film projects on Bitcoin L2
          </p>
        </div>

        {/* Features Grid */}
        <div className="w-full max-w-sm mb-6 grid grid-cols-1 gap-3">
          <div className="bg-background-100 border border-background-300 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Film className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h3 className="text-typography-950 font-medium text-sm">Invest in Films</h3>
              <p className="text-typography-400 text-xs">
                Own tokenized shares of film projects. Be part of cinema history.
              </p>
            </div>
          </div>

          <div className="bg-background-100 border border-background-300 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Bitcoin className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-typography-950 font-medium text-sm">Bitcoin Secured</h3>
              <p className="text-typography-400 text-xs">
                Built on Stacks, Bitcoin&apos;s smart contract layer. Maximum security.
              </p>
            </div>
          </div>
        </div>

        {/* Connect Button */}
        <div className="w-full max-w-sm">
          <button
            onClick={connect}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl h-12 font-semibold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <WalletIcon className="w-4 h-4" />
                <span>Connect Stacks Wallet</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-3">
            <div className="flex-1 h-px bg-background-300" />
            <span className="text-typography-500 text-xs">or</span>
            <div className="flex-1 h-px bg-background-300" />
          </div>

          {/* Demo Mode Button */}
          <button
            onClick={handleDemoMode}
            className="w-full flex items-center justify-center gap-2.5 bg-background-100 hover:bg-background-200 border border-background-300 text-typography-800 rounded-xl h-12 font-medium text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Eye className="w-4 h-4 text-typography-600" />
            <span className="text-typography-400">Try Demo Mode</span>
          </button>

          <p className="text-center text-typography-500 text-xs mt-3">
            Demo mode lets you explore films without a wallet.
            <br />
            <span className="text-typography-400">Some features will be limited.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
