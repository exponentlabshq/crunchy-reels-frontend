"use client";

import { Copy, Wallet as WalletIcon, LogOut, Bitcoin, RefreshCw, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useStacksWallet } from "@/context/StacksWalletContext";
import { getAccountBalances } from "@/utils/stacksApi";
import { USDCX_ADDRESS, USDCX_NAME, USDCX_ASSET } from "@/utils/contractConfig";

interface Balances {
  stx: string;
  usdcx: string;
}

export default function WalletPage() {
  const router = useRouter();
  const { isConnected, address, disconnectWallet } = useStacksWallet();
  const [balances, setBalances] = useState<Balances>({ stx: "0.00", usdcx: "0.00" });
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      const data = await getAccountBalances(address);
      
      // STX balance is in microSTX (6 decimals)
      const stxBalance = data.stx?.balance ? (Number(data.stx.balance) / 1_000_000).toFixed(2) : "0.00";
      
      // USDCx balance - find the token in fungible_tokens (6 decimals)
      const usdcxKey = `${USDCX_ADDRESS}.${USDCX_NAME}::${USDCX_ASSET}`;
      const usdcxToken = data.fungible_tokens?.[usdcxKey];
      const usdcxBalance = usdcxToken?.balance ? (Number(usdcxToken.balance) / 1_000_000).toFixed(2) : "0.00";
      
      setBalances({ stx: stxBalance, usdcx: usdcxBalance });
    } catch (error) {
      console.error("Failed to fetch balances:", error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      void fetchBalances();
    }
  }, [isConnected, address, fetchBalances]);

  const walletAddress = address ?? "";

  function copyWalletAddress() {
    void navigator.clipboard.writeText(walletAddress);
    toast.success("Address copied to clipboard!");
  }

  function handleDisconnect() {
    disconnectWallet();
    router.push("/onboarding");
  }

  if (!isConnected) {
    return (
      <div className="flex-1 bg-background-0 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-background-100 rounded-2xl p-8 text-center border border-background-300">
          <WalletIcon className="w-16 h-16 text-primary-500 mx-auto mb-4" />
          <h2 className="text-typography-950 text-2xl font-semibold mb-2 font-sans">
            Connect Your Wallet
          </h2>
          <p className="text-typography-600 mb-6">
            Connect your Stacks wallet to view your portfolio
          </p>
          <button
            onClick={() => router.push("/connect-wallet")}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background-0 overflow-y-auto pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-typography-950 font-sans mb-2">Wallet</h1>
          <p className="text-typography-600">Manage your Stacks wallet and holdings</p>
        </div>

        {/* Wallet Card */}
        <div className="bg-background-100 border border-background-300 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-primary-500/20 rounded-full flex items-center justify-center">
              <WalletIcon className="w-7 h-7 text-primary-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-typography-950 font-sans">
                Stacks Wallet
              </h2>
            </div>
          </div>

          {/* Address */}
          <div className="bg-background-0 rounded-xl p-4 mb-6">
            <p className="text-sm text-typography-500 mb-2">Wallet Address</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 text-typography-950 font-mono text-sm truncate">
                {walletAddress}
              </code>
              <button
                onClick={copyWalletAddress}
                className="p-2 hover:bg-background-100 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4 text-typography-500" />
              </button>
            </div>
          </div>

          {/* Balance Display */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-typography-950 font-sans">Balances</h3>
            <button
              onClick={() => void fetchBalances()}
              disabled={isLoading}
              className="p-2 hover:bg-background-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-typography-500 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-orange-500/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bitcoin className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-typography-500">STX Balance</span>
              </div>
              <p className="text-2xl font-bold text-typography-950 font-mono">
                {isLoading ? "..." : balances.stx}
              </p>
            </div>
            <div className="bg-green-500/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-sm text-typography-500">USDCx Balance</span>
              </div>
              <p className="text-2xl font-bold text-typography-950 font-mono">
                {isLoading ? "..." : balances.usdcx}
              </p>
            </div>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center justify-center gap-2 py-3 bg-background-200 hover:bg-background-300 text-typography-950 font-medium rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Disconnect Wallet
          </button>
        </div>

        {/* Network Info */}
        <div className="bg-background-100 border border-background-300 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-typography-950 mb-4 font-sans">Network</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-typography-600">Stacks Testnet</span>
            </div>
            <span className="text-sm text-typography-500 font-mono">nakamoto.stacks.co</span>
          </div>
        </div>
      </div>
    </div>
  );
}
