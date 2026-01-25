"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Film as FilmIcon,
  Users,
  TrendingUp,
  Coins,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Wallet,
  Target,
  Clock,
  Hash,
  Globe,
  DollarSign,
  ArrowDownToLine,
  Sparkles,
} from "lucide-react";
import { useStacksWallet } from "@/context/StacksWalletContext";
import {
  getFilm,
  getBalance,
  getHolderCount,
  getTokensAvailable,
  buyFilmTokens,
  getUsdcxBalance,
  getFilmRevenue,
  getClaimableRevenue,
  getUserTotalClaimed,
  claimRevenue,
  withdrawAndClaim,
} from "@/utils/contractCalls";
import { formatUSDCx, parseUSDCx } from "@/utils/contractConfig";
import { NETWORK } from "@/constants";
import { getFilmThumbnail, hasFilmMedia } from "@/data/filmMedia";
import ShortsModal from "@/components/ShortsModal";

interface FilmData {
  id: number;
  title: string;
  symbol: string;
  description: string;
  producer: string;
  maxSupply: number;
  tokensSold: number;
  usdcxRaised: number;
  isActive: boolean;
  createdAt: number;
}

const FILM_IMAGES = [
  "https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=1200&q=80",
  "https://images.unsplash.com/photo-1518173946687-a4c036bc3c9c?w=1200&q=80",
  "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1200&q=80",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&q=80",
];

export default function FilmDetailPage() {
  const params = useParams();
  const filmId = Number(params.id);
  const { isConnected, address, connect } = useStacksWallet();

  const [film, setFilm] = useState<FilmData | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [userUsdcxBalance, setUserUsdcxBalance] = useState<number>(0);
  const [holderCount, setHolderCount] = useState<number>(0);
  const [tokensAvailable, setTokensAvailable] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [investAmount, setInvestAmount] = useState<string>("");
  const [isInvesting, setIsInvesting] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [investError, setInvestError] = useState<string | null>(null);

  // Revenue & Withdrawal state
  const [claimableRevenue, setClaimableRevenue] = useState<number>(0);
  const [totalClaimed, setTotalClaimed] = useState<number>(0);
  const [filmTotalRevenue, setFilmTotalRevenue] = useState<number>(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [claimTxId, setClaimTxId] = useState<string | null>(null);
  const [withdrawTxId, setWithdrawTxId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchFilmData = useCallback(async () => {
    if (!filmId || isNaN(filmId)) {
      setError("Invalid film ID");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getFilm(filmId);
      if (!result) {
        setError("Film not found");
        return;
      }

      const data = result.value ?? result;

      const getValue = (field: unknown): string | number | boolean => {
        if (field && typeof field === "object" && "value" in field) {
          return (field as { value: string | number | boolean }).value;
        }
        return field as string | number | boolean;
      };

      const filmData: FilmData = {
        id: filmId,
        title: String(getValue(data.title) || `Film #${filmId}`),
        symbol: String(getValue(data.symbol) || `FILM${filmId}`),
        description: String(getValue(data.description) || "No description available"),
        producer: String(getValue(data.producer) || ""),
        maxSupply: Number(getValue(data["max-supply"]) || 0),
        tokensSold: Number(getValue(data["tokens-sold"]) || 0),
        usdcxRaised: Number(getValue(data["usdcx-raised"]) || 0),
        isActive: Boolean(getValue(data["is-active"]) ?? false),
        createdAt: Number(getValue(data["created-at"]) || 0),
      };

      setFilm(filmData);

      const [holdersResult, availableResult] = await Promise.all([
        getHolderCount(filmId).catch(() => 0),
        getTokensAvailable(filmId).catch(() => ({ value: 0 })),
      ]);

      setHolderCount(Number(holdersResult));

      const availableValue =
        typeof availableResult === "object" && availableResult !== null
          ? Number((availableResult as { value?: number | bigint }).value || 0)
          : Number(availableResult);
      setTokensAvailable(availableValue);

      // Fetch film revenue stats
      const revenueResult = await getFilmRevenue(filmId).catch(() => ({ "total-deposited": 0 }));
      const revenueData = revenueResult?.value ?? revenueResult;
      setFilmTotalRevenue(Number(revenueData?.["total-deposited"] ?? 0));

      if (isConnected && address) {
        const [balanceResult, usdcxResult, claimableResult, claimedResult] = await Promise.all([
          getBalance(filmId, address).catch(() => 0),
          getUsdcxBalance(address).catch(() => ({ value: 0 })),
          getClaimableRevenue(filmId, address).catch(() => 0),
          getUserTotalClaimed(filmId, address).catch(() => 0),
        ]);

        setUserBalance(Number(balanceResult));
        setClaimableRevenue(Number(claimableResult));
        setTotalClaimed(Number(claimedResult));

        const usdcxValue =
          typeof usdcxResult === "object" && usdcxResult !== null
            ? Number((usdcxResult as { value?: number | bigint }).value || 0)
            : Number(usdcxResult);
        setUserUsdcxBalance(usdcxValue);
      }
    } catch (err) {
      console.error("Error fetching film:", err);
      setError("Failed to load film data");
    } finally {
      setIsLoading(false);
    }
  }, [filmId, isConnected, address]);

  useEffect(() => {
    fetchFilmData();
  }, [fetchFilmData]);

  async function handleInvest() {
    if (!address || !film) return;

    const amountMicroUnits = parseUSDCx(investAmount);
    if (amountMicroUnits <= 0) {
      setInvestError("Please enter a valid amount");
      return;
    }

    if (amountMicroUnits > tokensAvailable) {
      setInvestError("Amount exceeds available tokens");
      return;
    }

    if (amountMicroUnits > userUsdcxBalance) {
      setInvestError("Insufficient USDCx balance");
      return;
    }

    setIsInvesting(true);
    setInvestError(null);
    setTxId(null);

    try {
      const txid = await buyFilmTokens(filmId, amountMicroUnits, address);
      setTxId(txid);
      setInvestAmount("");

      setTimeout(() => {
        fetchFilmData();
      }, 10000);
    } catch (err) {
      console.error("Investment error:", err);
      setInvestError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsInvesting(false);
    }
  }

  async function handleClaimRevenue() {
    if (!address || !film || claimableRevenue <= 0) return;

    setIsClaiming(true);
    setActionError(null);
    setClaimTxId(null);

    try {
      const txid = await claimRevenue(filmId, address);
      setClaimTxId(txid);

      setTimeout(() => {
        fetchFilmData();
      }, 10000);
    } catch (err) {
      console.error("Claim error:", err);
      setActionError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setIsClaiming(false);
    }
  }

  async function handleWithdraw() {
    if (!address || !film || userBalance <= 0) return;

    setIsWithdrawing(true);
    setActionError(null);
    setWithdrawTxId(null);

    try {
      const txid = await withdrawAndClaim(filmId, address);
      setWithdrawTxId(txid);

      setTimeout(() => {
        fetchFilmData();
      }, 10000);
    } catch (err) {
      console.error("Withdraw error:", err);
      setActionError(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  }

  const hardcodedThumbnail = getFilmThumbnail(filmId);
  const imageUri = hardcodedThumbnail ?? FILM_IMAGES[(filmId - 1) % FILM_IMAGES.length] ?? FILM_IMAGES[0]!;
  const hasMedia = hasFilmMedia(filmId);
  const fundingPercent = film && film.maxSupply > 0 ? (film.tokensSold / film.maxSupply) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-background-300 border-t-primary-500 animate-spin" />
          </div>
          <p className="text-typography-400 text-sm">Loading film details...</p>
        </div>
      </div>
    );
  }

  if (error || !film) {
    return (
      <div className="flex-1 overflow-auto pb-24 lg:pb-8">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Link
            href="/films"
            className="inline-flex items-center gap-2 text-typography-400 hover:text-primary-500 mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Films
          </Link>
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-full bg-error-500/10 flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-error-500" />
            </div>
            <h2 className="text-2xl font-bold text-typography-950 mb-3">Film Not Found</h2>
            <p className="text-typography-400 text-center max-w-md">
              {error || "This film does not exist or may have been removed."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto pb-24 lg:pb-8">
      {/* Hero Section - Full width */}
      <div className="relative h-[45vh] min-h-[400px] max-h-[500px] w-full">
        <Image src={imageUri} alt={film.title} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-background-0 via-background-0/70 to-background-0/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background-0/80 via-transparent to-transparent" />

        {/* Back Button - Positioned in hero */}
        <div className="absolute top-6 left-6 z-10">
          <Link
            href="/films"
            className="inline-flex items-center gap-2 px-4 py-2 bg-background-0/60 backdrop-blur-md border border-white/10 rounded-full text-white/90 hover:text-white hover:bg-background-0/80 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </Link>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 top-10 left-14 right-0 px-6 py-6 md:py-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-4 py-1.5 bg-primary-500 text-white text-sm font-semibold rounded-full shadow-lg shadow-primary-500/30">
                ${film.symbol}
              </span>
              {film.isActive ? (
                <span className="px-4 py-1.5 bg-success-500/20 border border-success-500/40 text-success-400 text-sm font-medium rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-success-400 rounded-full animate-pulse" />
                  Active Funding
                </span>
              ) : (
                <span className="px-4 py-1.5 bg-error-500/20 border border-error-500/40 text-error-400 text-sm font-medium rounded-full">
                  Funding Closed
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              {film.title}
            </h1>
            <div className="flex items-center gap-2 text-white/60">
              <span className="text-sm">Producer</span>
              <span className="text-white/40">•</span>
              <code className="text-sm font-mono text-white/80 bg-white/10 px-3 py-1 rounded-lg">
                {film.producer.slice(0, 8)}...{film.producer.slice(-6)}
              </code>
            </div>
            {hasMedia && (
              <div className="mt-4">
                <ShortsModal filmId={filmId} filmTitle={film.title} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-10 -mt-40">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Film Details (3 cols) */}
          <div className="lg:col-span-3 space-y-8">
            {/* About Section */}
            <section>
              <h2 className="text-xl font-semibold text-typography-950 mb-4 flex items-center gap-2">
                <FilmIcon className="w-5 h-5 text-primary-500" />
                About This Film
              </h2>
              <div className="bg-background-100/50 backdrop-blur-sm border border-background-300/50 rounded-2xl p-6">
                <p className="text-typography-300 leading-relaxed text-base">{film.description}</p>
              </div>
            </section>

            {/* Funding Progress */}
            <section>
              <h2 className="text-xl font-semibold text-typography-950 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                Funding Progress
              </h2>
              <div className="bg-background-100/50 backdrop-blur-sm border border-background-300/50 rounded-2xl p-6">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <p className="text-typography-400 text-sm mb-1">Amount Raised</p>
                    <p className="text-3xl font-bold text-primary-500 font-mono">
                      ${formatUSDCx(film.usdcxRaised)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-typography-400 text-sm mb-1">Goal</p>
                    <p className="text-2xl font-semibold text-typography-950 font-mono">
                      ${formatUSDCx(film.maxSupply)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-3 bg-background-300/50 rounded-full overflow-hidden mb-4">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(fundingPercent, 100)}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-400/50 to-transparent rounded-full blur-sm"
                    style={{ width: `${Math.min(fundingPercent, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-typography-400">
                    <span className="text-primary-500 font-semibold">{fundingPercent.toFixed(3)}%</span> funded
                  </span>
                  <span className="text-sm text-typography-400">
                    <span className="text-success-500 font-mono">{formatUSDCx(tokensAvailable)}</span> tokens remaining
                  </span>
                </div>
              </div>
            </section>

            {/* Stats Grid */}
            <section>
              <h2 className="text-xl font-semibold text-typography-950 mb-4">Key Metrics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background-100/50 backdrop-blur-sm border border-background-300/50 rounded-2xl p-5 group hover:border-primary-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
                      <TrendingUp className="w-5 h-5 text-primary-500" />
                    </div>
                    <span className="text-typography-400 text-sm">Total Raised</span>
                  </div>
                  <p className="text-2xl font-bold text-primary-500 font-mono">${formatUSDCx(film.usdcxRaised)}</p>
                </div>

                <div className="bg-background-100/50 backdrop-blur-sm border border-background-300/50 rounded-2xl p-5 group hover:border-primary-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <Target className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-typography-400 text-sm">Funding Goal</span>
                  </div>
                  <p className="text-2xl font-bold text-typography-950 font-mono">${formatUSDCx(film.maxSupply)}</p>
                </div>

                <div className="bg-background-100/50 backdrop-blur-sm border border-background-300/50 rounded-2xl p-5 group hover:border-primary-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-typography-400 text-sm">Investors</span>
                  </div>
                  <p className="text-2xl font-bold text-typography-950 font-mono">{holderCount}</p>
                </div>

                <div className="bg-background-100/50 backdrop-blur-sm border border-background-300/50 rounded-2xl p-5 group hover:border-primary-500/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-success-500/10 flex items-center justify-center group-hover:bg-success-500/20 transition-colors">
                      <Coins className="w-5 h-5 text-success-500" />
                    </div>
                    <span className="text-typography-400 text-sm">Available</span>
                  </div>
                  <p className="text-2xl font-bold text-success-500 font-mono">${formatUSDCx(tokensAvailable)}</p>
                </div>
              </div>
            </section>

            {/* User Position */}
            {isConnected && userBalance > 0 && (
              <section>
                {/* Holdings Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-500/10 via-primary-600/5 to-background-100 border border-primary-500/20 rounded-2xl p-6">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative">
                    <h3 className="text-lg font-semibold text-typography-950 mb-4 flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary-500" />
                      Your Position
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-typography-400 text-sm mb-1">Token Balance</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-primary-500 font-mono">
                            {formatUSDCx(userBalance)}
                          </span>
                          <span className="text-typography-400">${film.symbol}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-typography-400 text-sm mb-1">Principal Value</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-typography-950 font-mono">
                            ${formatUSDCx(userBalance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Contract Details */}
            <section>
              <h2 className="text-xl font-semibold text-typography-950 mb-4">Contract Details</h2>
              <div className="bg-background-100/50 backdrop-blur-sm border border-background-300/50 rounded-2xl divide-y divide-background-300/50">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Hash className="w-4 h-4 text-typography-400" />
                    <span className="text-typography-400 text-sm">Film ID</span>
                  </div>
                  <span className="font-mono text-typography-950">#{film.id}</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-typography-400" />
                    <span className="text-typography-400 text-sm">Network</span>
                  </div>
                  <span className="font-mono text-typography-950 capitalize">{NETWORK}</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-typography-400" />
                    <span className="text-typography-400 text-sm">Created Block</span>
                  </div>
                  <span className="font-mono text-typography-950">{film.createdAt.toLocaleString()}</span>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column - Investment Panel (2 cols) */}
          <div className="lg:col-span-2 mt-10">
            <div className="sticky top-6 space-y-6">
              {/* Investment Card */}
              <div className="bg-background-100/80 backdrop-blur-xl border border-background-300/50 rounded-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-primary-500/10 to-primary-600/5 border-b border-background-300/50 p-5">
                  <h2 className="text-lg font-semibold text-typography-950">Invest in ${film.symbol}</h2>
                  <p className="text-sm text-typography-400 mt-1">Become a stakeholder in this film</p>
                </div>

                <div className="p-5">
                  {!isConnected ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-background-200 flex items-center justify-center mx-auto mb-4">
                        <Wallet className="w-8 h-8 text-typography-400" />
                      </div>
                      <p className="text-typography-400 mb-6">Connect your wallet to invest</p>
                      <button
                        onClick={connect}
                        className="w-full py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-primary-500/20 active:scale-[0.98]"
                      >
                        Connect Wallet
                      </button>
                    </div>
                  ) : !film.isActive ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-warning-500/10 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-warning-500" />
                      </div>
                      <p className="text-typography-400">This film&apos;s funding period has ended</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* USDCx Balance */}
                      <div className="bg-background-200/50 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-typography-400 text-sm">
                            <Coins className="w-4 h-4" />
                            Your USDCx Balance
                          </div>
                          <span className="text-lg font-bold text-typography-950 font-mono">
                            ${formatUSDCx(userUsdcxBalance)}
                          </span>
                        </div>
                      </div>

                      {/* Amount Input */}
                      <div>
                        <label className="block text-sm text-typography-400 mb-2 font-medium">
                          Investment Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-typography-400 font-medium text-lg">
                            $
                          </span>
                          <input
                            type="number"
                            value={investAmount}
                            onChange={(e) => {
                              setInvestAmount(e.target.value);
                              setInvestError(null);
                            }}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full pl-8 pr-4 py-4 bg-background-200/50 border-2 border-background-300/50 rounded-xl text-typography-950 placeholder:text-typography-500 focus:outline-none focus:border-primary-500 font-mono text-lg transition-colors"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-typography-500 mt-2 px-1">
                          <span>Min: $1</span>
                          <span>Max: ${formatUSDCx(tokensAvailable)}</span>
                        </div>
                      </div>

                      {/* Quick Amount Buttons */}
                      <div className="grid grid-cols-4 gap-2">
                        {["10", "50", "100", "500"].map((amount) => (
                          <button
                            key={amount}
                            onClick={() => {
                              setInvestAmount(amount);
                              setInvestError(null);
                            }}
                            className="py-2.5 text-sm font-medium bg-background-200/50 hover:bg-background-300/50 border border-background-300/50 hover:border-primary-500/30 text-typography-300 rounded-lg transition-all"
                          >
                            ${amount}
                          </button>
                        ))}
                      </div>

                      {/* Error Message */}
                      {investError && (
                        <div className="p-4 bg-error-500/10 border border-error-500/30 rounded-xl flex items-start gap-3 animate-shake">
                          <AlertCircle className="w-5 h-5 text-error-500 shrink-0 mt-0.5" />
                          <p className="text-error-400 text-sm">{investError}</p>
                        </div>
                      )}

                      {/* Success Message */}
                      {txId && (
                        <div className="p-4 bg-success-500/10 border border-success-500/30 rounded-xl">
                          <div className="flex items-center gap-2 text-success-400 mb-2">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-semibold">Transaction Submitted!</span>
                          </div>
                          <p className="text-sm text-typography-400 mb-3">
                            Your investment is being processed on the blockchain.
                          </p>
                          <a
                            href={`https://explorer.hiro.so/txid/${txId}?chain=${NETWORK}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors"
                          >
                            View on Explorer
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}

                      {/* Invest Button */}
                      <button
                        onClick={handleInvest}
                        disabled={isInvesting || !investAmount || parseFloat(investAmount) <= 0}
                        className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 disabled:from-background-300 disabled:to-background-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-primary-500/25 active:scale-[0.98] disabled:shadow-none flex items-center justify-center gap-2"
                      >
                        {isInvesting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FilmIcon className="w-5 h-5" />
                            Invest with USDCx
                          </>
                        )}
                      </button>

                      {/* Investment Note */}
                      <p className="text-xs text-typography-500 text-center">
                        1 USDCx = 1 ${film.symbol} token
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Earnings & Withdrawal - Only show when user has position */}
              {isConnected && userBalance > 0 && (
                <>
                  {/* Earnings Card */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-success-500/10 via-success-600/5 to-background-100 border border-success-500/20 rounded-2xl p-5">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-success-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative">
                      <h3 className="text-base font-semibold text-typography-950 mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-success-500" />
                        Your Earnings
                      </h3>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-typography-400 text-sm">Claimable Now</span>
                          <span className="text-lg font-bold text-success-500 font-mono">
                            ${formatUSDCx(claimableRevenue)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-typography-400 text-sm">Already Claimed</span>
                          <span className="text-lg font-bold text-typography-950 font-mono">
                            ${formatUSDCx(totalClaimed)}
                          </span>
                        </div>
                        <div className="border-t border-background-300/50 pt-3 flex justify-between items-center">
                          <span className="text-typography-400 text-sm">Total Earnings</span>
                          <span className="text-lg font-bold text-typography-950 font-mono">
                            ${formatUSDCx(claimableRevenue + totalClaimed)}
                          </span>
                        </div>
                      </div>

                      {/* Claim Button */}
                      {claimableRevenue > 0 && (
                        <button
                          onClick={handleClaimRevenue}
                          disabled={isClaiming}
                          className="w-full py-3 bg-success-500 hover:bg-success-600 disabled:bg-background-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-success-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          {isClaiming ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Claiming...
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-5 h-5" />
                              Claim ${formatUSDCx(claimableRevenue)} USDCx
                            </>
                          )}
                        </button>
                      )}

                      {claimableRevenue === 0 && filmTotalRevenue === 0 && (
                        <p className="text-xs text-typography-400 text-center">
                          No revenue distributed yet.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Withdrawal Card */}
                  <div className="bg-background-100/80 backdrop-blur-xl border border-background-300/50 rounded-2xl p-5">
                    <h3 className="text-base font-semibold text-typography-950 mb-4 flex items-center gap-2">
                      <ArrowDownToLine className="w-4 h-4 text-typography-400" />
                      Withdraw Position
                    </h3>
                    
                    <div className="bg-background-200/50 rounded-xl p-3 mb-4">
                      <p className="text-xs text-typography-400 mb-2">On withdrawal you will receive:</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-typography-400">Principal Return</span>
                          <span className="font-mono text-typography-950">${formatUSDCx(userBalance)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-typography-400">Pending Earnings</span>
                          <span className="font-mono text-success-500">${formatUSDCx(claimableRevenue)}</span>
                        </div>
                        <div className="border-t border-background-300/50 pt-1.5 flex justify-between text-sm">
                          <span className="text-typography-950 font-medium">Total Payout</span>
                          <span className="font-mono font-bold text-primary-500">
                            ${formatUSDCx(userBalance + claimableRevenue)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleWithdraw}
                      disabled={isWithdrawing || userBalance <= 0}
                      className="w-full py-3 bg-background-300 hover:bg-background-400 disabled:bg-background-200 disabled:cursor-not-allowed text-typography-950 font-semibold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isWithdrawing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ArrowDownToLine className="w-5 h-5" />
                          Close Position & Withdraw All
                        </>
                      )}
                    </button>
                    
                    <p className="text-xs text-typography-500 text-center mt-2">
                      This will burn your tokens. You will no longer earn from future revenue.
                    </p>
                  </div>

                  {/* Action Error */}
                  {actionError && (
                    <div className="p-3 bg-error-500/10 border border-error-500/30 rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-error-500 shrink-0 mt-0.5" />
                      <p className="text-error-400 text-sm">{actionError}</p>
                    </div>
                  )}

                  {/* Claim Success */}
                  {claimTxId && (
                    <div className="p-3 bg-success-500/10 border border-success-500/30 rounded-xl">
                      <div className="flex items-center gap-2 text-success-400 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-semibold text-sm">Revenue Claimed!</span>
                      </div>
                      <a
                        href={`https://explorer.hiro.so/txid/${claimTxId}?chain=${NETWORK}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors"
                      >
                        View on Explorer
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Withdraw Success */}
                  {withdrawTxId && (
                    <div className="p-3 bg-success-500/10 border border-success-500/30 rounded-xl">
                      <div className="flex items-center gap-2 text-success-400 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-semibold text-sm">Position Closed!</span>
                      </div>
                      <p className="text-xs text-typography-400 mb-2">
                        Your tokens have been burned and USDCx returned to your wallet.
                      </p>
                      <a
                        href={`https://explorer.hiro.so/txid/${withdrawTxId}?chain=${NETWORK}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors"
                      >
                        View on Explorer
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
