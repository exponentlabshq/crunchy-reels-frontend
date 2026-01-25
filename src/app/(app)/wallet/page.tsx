"use client";

import { Copy, Wallet as WalletIcon, LogOut, Power, ChevronRight, ArrowUpRight, ExternalLink, Github, FileCode2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
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
      <div className="flex-1 bg-[#0A0A0B] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#111113] rounded-xl p-8 text-center border border-[#1F1F23]">
          <div className="w-16 h-16 bg-primary-500/10 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <WalletIcon className="w-8 h-8 text-primary-500" />
          </div>
          <h2 className="text-white text-2xl font-semibold mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-[#6B6B70] mb-6">
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
    <div className="flex-1 bg-[#0A0A0B] overflow-y-auto pb-24 lg:pb-8 max-w-7xl mx-auto">
      <div className="py-8 px-10">
        {/* Page Header */}
        <div className="flex flex-col gap-2 mb-7">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-[38px] font-normal text-white font-display tracking-[-1px]">
                Wallet
              </h1>
              <p className="text-sm text-[#6B6B70]">
                Manage your Stacks wallet and holdings
              </p>
            </div>
          </div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B6B70]">Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#4A4A4E]" />
            <span className="text-xs text-white">Wallet</span>
          </div>
        </div>

        {/* Wallet Card */}
        <div className="bg-[#111113] border border-[#1F1F23] rounded-xl p-6 mb-7">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[10px] bg-primary-500/10 flex items-center justify-center">
                <WalletIcon className="w-[22px] h-[22px] text-primary-500" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-base font-semibold text-white">Stacks Wallet</span>
                <span className="text-xs text-[#6B6B70]">Connected via Leather</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-500/10">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <span className="text-[11px] font-medium text-success-500">Connected</span>
            </div>
          </div>

          {/* Address Section */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-[#6B6B70]">Wallet Address</span>
            <div className="flex items-center justify-between bg-[#1A1A1D] border border-[#2A2A2E] rounded-lg px-4 py-3.5">
              <span className="text-[13px] font-mono text-[#ADADB0]">{walletAddress}</span>
              <button
                onClick={copyWalletAddress}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#2A2A2E] rounded-md hover:bg-[#3A3A3E] transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-[#8B8B90]" />
                <span className="text-[11px] font-medium text-[#ADADB0]">Copy</span>
              </button>
            </div>
          </div>
        </div>

        {/* Balances Section */}
        <div className="flex flex-col gap-4 mb-7">
          <span className="text-sm font-semibold text-white">Balances</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* STX Balance Card */}
            <div className="bg-[#111113] border border-[#1F1F23] rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#5546FF] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">S</span>
                  </div>
                  <span className="text-sm font-medium text-white">STX</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[32px] font-medium font-mono text-white tracking-[-1px]">
                  {isLoading ? "..." : balances.stx}
                </span>
                <span className="text-xs text-[#6B6B70]">
                  ≈ ${isLoading ? "..." : balances.stx} USD
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#2A2A2E] rounded-lg hover:bg-[#1A1A1D] transition-colors">
                  <ArrowUpRight className="w-4 h-4 text-white rotate-180" />
                  <span className="text-sm text-white">Send</span>
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#2A2A2E] rounded-lg hover:bg-[#1A1A1D] transition-colors">
                  <ArrowUpRight className="w-4 h-4 text-white rotate-[225deg]" />
                  <span className="text-sm text-white">Receive</span>
                </button>
              </div>
            </div>

            {/* USDCx Balance Card */}
            <div className="bg-[#111113] border border-[#1F1F23] rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#2775CA] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">$</span>
                  </div>
                  <span className="text-sm font-medium text-white">USDCx</span>
                </div>
                <div className="px-2 py-1 rounded bg-primary-500/10">
                  <span className="text-[10px] font-medium text-primary-500">Stacks Native</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[32px] font-medium font-mono text-white tracking-[-1px]">
                  {isLoading ? "..." : balances.usdcx}
                </span>
                <span className="text-xs text-[#6B6B70]">
                  ≈ ${isLoading ? "..." : balances.usdcx} USD
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/films"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <span className="text-sm font-medium text-white">Invest</span>
                </Link>
                <Link
                  href="/bridge"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#2A2A2E] rounded-lg hover:bg-[#1A1A1D] transition-colors"
                >
                  <span className="text-sm text-white">Bridge</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Network & Disconnect */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-7">
          {/* Network Card */}
          <div className="bg-[#111113] border border-[#1F1F23] rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Network</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                <span className="text-[10px] font-medium text-primary-500">Testnet</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6B6B70]">Network Name</span>
                <span className="text-xs font-medium text-white">Stacks Testnet</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6B6B70]">Node URL</span>
                <span className="text-xs font-mono text-[#ADADB0]">nakamoto.stacks.co</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6B6B70]">Chain ID</span>
                <span className="text-xs font-mono text-[#ADADB0]">0x80000000</span>
              </div>
            </div>
          </div>

          {/* Disconnect Card */}
          <div className="bg-[#111113] border border-[#1F1F23] rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-error-500/10 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-error-500" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-white">Disconnect Wallet</span>
                <span className="text-xs text-[#6B6B70]">Sign out from your connected wallet</span>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="flex items-center justify-center gap-2 w-full py-3 bg-error-500/10 border border-error-500/20 rounded-lg hover:bg-error-500/20 transition-colors"
            >
              <Power className="w-4 h-4 text-error-500" />
              <span className="text-[13px] font-medium text-error-500">Disconnect Wallet</span>
            </button>
          </div>
        </div>

        {/* Developer Resources Section */}
        <div className="bg-[#111113] border border-[#1F1F23] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-[10px] bg-[#5546FF]/10 flex items-center justify-center">
              <FileCode2 className="w-5 h-5 text-[#5546FF]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-white">Developer Resources</span>
              <span className="text-xs text-[#6B6B70]">Smart contract & source code</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            {/* Contract Explorer Link */}
            <a
              href="https://explorer.hiro.so/txid/STGY69C09ZANPYW5V9M3DMRVETGZ9EY9VZRSCJGN.shortstarter?chain=testnet"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between bg-[#1A1A1D] border border-[#2A2A2E] rounded-lg px-4 py-3.5 hover:border-[#6558f9]/50 hover:bg-[#6558f9]/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#5546FF]/10 flex items-center justify-center">
                  <span className="text-[#6558f9] text-xs font-bold">S</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-medium text-white">ShortStarter Contract Blockchain Explorer</span>
                  <span className="text-[11px] text-[#6B6B70]">View on Hiro Explorer · Testnet</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-[#6B6B70] group-hover:text-[#6558f9] transition-colors" />
            </a>

            {/* Contract GitHub Link */}
            <a
              href="https://github.com/aydendevnova/shortstarter-usdcx-contracts"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between bg-[#1A1A1D] border border-[#2A2A2E] rounded-lg px-4 py-3.5 hover:border-[#6B6B70]/50 hover:bg-[#1F1F23] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2A2A2E] flex items-center justify-center">
                  <Github className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-medium text-white">Smart Contracts Source Code</span>
                  <span className="text-[11px] text-[#6B6B70]">shortstarter-usdcx-contracts</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-[#6B6B70] group-hover:text-white transition-colors" />
            </a>

            {/* Frontend GitHub Link */}
            <a
              href="https://github.com/aydendevnova/shortstarter-usdcx-frontend"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between bg-[#1A1A1D] border border-[#2A2A2E] rounded-lg px-4 py-3.5 hover:border-[#6B6B70]/50 hover:bg-[#1F1F23] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2A2A2E] flex items-center justify-center">
                  <Github className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-medium text-white">Frontend Application Source Code</span>
                  <span className="text-[11px] text-[#6B6B70]">shortstarter-usdcx-frontend</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-[#6B6B70] group-hover:text-white transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
