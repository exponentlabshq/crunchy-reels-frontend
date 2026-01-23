"use client";

import { useRouter } from "next/navigation";
import { Wallet as WalletIcon, Film, Bitcoin } from "lucide-react";
import { useEffect } from "react";
import { useStacksWallet } from "@/context/StacksWalletContext";

export default function ConnectWalletPage() {
  const router = useRouter();
  const { isConnected, isConnecting, connect } = useStacksWallet();

  useEffect(() => {
    if (isConnected) {
      router.push("/films");
    }
  }, [isConnected, router]);

  return (
    <div className="flex-1 bg-background-0 flex flex-col min-h-screen">
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-2 ring-primary-500/30">
            <WalletIcon className="w-10 h-10 text-primary-500" />
          </div>
          <h1 className="text-typography-950 text-3xl font-semibold mb-3 font-sans">
            Connect Your Wallet
          </h1>
          <p className="text-typography-600 text-lg max-w-md mx-auto">
            Connect your Stacks wallet to invest in tokenized film projects on Bitcoin L2
          </p>
        </div>

        {/* Features Grid */}
        <div className="w-full max-w-md mb-8 grid grid-cols-1 gap-4">
          <div className="bg-background-100 border border-background-300 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Film className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h3 className="text-typography-950 font-semibold mb-1">Invest in Films</h3>
              <p className="text-typography-600 text-sm">
                Own tokenized shares of film projects. Be part of cinema history.
              </p>
            </div>
          </div>

          <div className="bg-background-100 border border-background-300 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Bitcoin className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-typography-950 font-semibold mb-1">Bitcoin Secured</h3>
              <p className="text-typography-600 text-sm">
                Built on Stacks, Bitcoin&apos;s smart contract layer. Maximum security.
              </p>
            </div>
          </div>
        </div>

        {/* Connect Button */}
        <div className="w-full max-w-md">
          <button
            onClick={connect}
            disabled={isConnecting}
            className="w-full flex items-center justify-center gap-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl h-14 font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            {isConnecting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <WalletIcon className="w-5 h-5" />
                <span>Connect Stacks Wallet</span>
              </>
            )}
          </button>

          <p className="text-center text-typography-500 text-xs mt-4">
            A Stacks wallet is required to use CineBlock
          </p>
        </div>
      </div>
    </div>
  );
}
