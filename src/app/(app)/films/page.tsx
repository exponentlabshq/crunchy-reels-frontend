"use client";

import { useEffect, useState } from "react";
import {
  Film as FilmIcon,
  TrendingUp,
  Loader2,
  AlertCircle,
  Search,
  SlidersHorizontal,
  Plus,
  Timer,
  ChevronRight,
  Clapperboard,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { getLastFilmId, getFilm, getTotalUsdcxCollected } from "@/utils/contractCalls";
import { formatUSDCx } from "@/utils/contractConfig";
import { getFilmThumbnail, hasFilmMedia } from "@/data/filmMedia";
import { ShortsButton } from "@/components/ShortsModal";

interface Film {
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

// Film card gradients
const FILM_GRADIENTS = [
  "from-[#1A1A1D] to-[#FF5C0033]",
  "from-[#22C55E18] to-[#1F1F23]",
  "from-[#1A1A1D] to-[#2A2A2E]",
];

type TabFilter = "all" | "trending" | "featured" | "new";

// Contract stores amounts in micro-units (6 decimals), convert to display value first
function formatCompactAmount(microAmount: number): string {
  const amount = microAmount / 1_000_000;
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K`;
  }
  return amount.toLocaleString();
}

export default function FilmsPage() {
  const [films, setFilms] = useState<Film[]>([]);
  const [totalRaised, setTotalRaised] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("new");

  async function fetchFilms() {
    setIsLoading(true);
    setError(null);

    try {
      const lastFilmId = await getLastFilmId();
      const filmCount = typeof lastFilmId === "bigint" ? Number(lastFilmId) : Number(lastFilmId);

      if (filmCount === 0) {
        setFilms([]);
        setIsLoading(false);
        return;
      }

      const filmPromises: Promise<Film | null>[] = [];
      for (let i = 1; i <= filmCount; i++) {
        filmPromises.push(
          getFilm(i)
            .then((result) => {
              if (!result) return null;

              const data = result.value ?? result;

              const getValue = (field: unknown): string | number | boolean => {
                if (field && typeof field === "object" && "value" in field) {
                  return (field as { value: string | number | boolean }).value;
                }
                return field as string | number | boolean;
              };

              return {
                id: i,
                title: String(getValue(data.title) || `Film #${i}`),
                symbol: String(getValue(data.symbol) || `FILM${i}`),
                description: String(getValue(data.description) || "No description available"),
                producer: String(getValue(data.producer) || ""),
                maxSupply: Number(getValue(data["max-supply"]) || 0),
                tokensSold: Number(getValue(data["tokens-sold"]) || 0),
                usdcxRaised: Number(getValue(data["usdcx-raised"]) || 0),
                isActive: Boolean(getValue(data["is-active"]) ?? false),
                createdAt: Number(getValue(data["created-at"]) || 0),
              };
            })
            .catch((err) => {
              console.error(`Error fetching film ${i}:`, err);
              return null;
            })
        );
      }

      const fetchedFilms = (await Promise.all(filmPromises)).filter((f): f is Film => f !== null);
      setFilms(fetchedFilms);

      const totalCollected = await getTotalUsdcxCollected();
      setTotalRaised(Number(totalCollected));
    } catch (err) {
      console.error("Error fetching films:", err);
      setError("Failed to load films from contract");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchFilms();
  }, []);

  const activeFilms = films.filter((f) => f.isActive);
  const totalFunded = films.reduce((sum, f) => sum + f.usdcxRaised, 0);
  const filmsInProduction = films.filter((f) => !f.isActive).length;

  // Filter films by search query
  const filteredFilms = films.filter(
    (film) =>
      film.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      film.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      film.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div className="flex-1 overflow-auto pb-24 lg:pb-8 max-w-7xl mx-auto">
      <div className="py-8 px-10">
        {/* Page Header */}
        <div className="flex flex-col gap-2 mb-7">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="text-[38px] font-normal text-white font-display tracking-[-1px]">
                Film Investments
              </h1>
              <p className="text-sm text-[#6B6B70]">
                Browse and invest in upcoming film projects
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 border border-[#2A2A2E] rounded-lg hover:bg-[#1A1A1D] transition-colors cursor-not-allowed" disabled>
                <SlidersHorizontal className="w-4 h-4 text-[#8B8B90]" />
                <span className="text-[13px] font-medium text-white">Filter</span>
              </button>
       
            </div>
          </div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B6B70]">Dashboard</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#4A4A4E]" />
            <span className="text-xs text-white">Films</span>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {/* Total Invested */}
          <div className="bg-[#111113] border border-[#1F1F23] rounded-xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6B6B70] uppercase tracking-[0.5px]">
                Total Invested
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-success-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span className="text-[10px] font-medium text-success-500">Live</span>
              </div>
            </div>
            <span className="text-[32px] font-medium font-mono text-white tracking-[-1px]">
              ${isLoading ? "..." : formatUSDCx(totalFunded)}
            </span>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-success-500" />
              <span className="text-xs font-medium text-success-500">+12.5% this month</span>
            </div>
          </div>

          {/* Active Investments */}
          <div className="bg-[#111113] border border-[#1F1F23] rounded-xl p-5 flex flex-col gap-4">
            <span className="text-xs font-medium text-[#6B6B70] uppercase tracking-[0.5px]">
              Active Investments
            </span>
            <span className="text-[32px] font-medium font-mono text-white tracking-[-1px]">
              {isLoading ? "..." : activeFilms.length}
            </span>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-success-500" />
              <span className="text-xs font-medium text-success-500">+2 new this week</span>
            </div>
          </div>

          {/* Pending Returns */}
          <div className="bg-[#111113] border border-[#1F1F23] rounded-xl p-5 flex flex-col gap-4">
            <span className="text-xs font-medium text-[#6B6B70] uppercase tracking-[0.5px]">
              Pending Returns
            </span>
            <span className="text-[32px] font-medium font-mono text-white tracking-[-1px]">
              ${isLoading ? "..." : formatUSDCx(Math.floor(totalFunded * 0.188))}
            </span>
            <div className="flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs font-medium text-[#ADADB0]">{filmsInProduction} films in production</span>
            </div>
          </div>

          {/* Total Returns */}
          <div className="bg-[#111113] border border-[#1F1F23] rounded-xl p-5 flex flex-col gap-4">
            <span className="text-xs font-medium text-[#6B6B70] uppercase tracking-[0.5px]">
              Total Returns
            </span>
            <span className="text-[32px] font-medium font-mono text-success-500 tracking-[-1px]">
              ${isLoading ? "..." : formatUSDCx(Math.floor(totalFunded * 0.387))}
            </span>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-success-500" />
              <span className="text-xs font-medium text-success-500">+38.7% ROI</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B70]" />
          <Input
            type="text"
            placeholder="Search films, directors, genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full bg-[#111113] border-[#2A2A2E] pl-10 text-[13px] text-white placeholder:text-[#4A4A4E] focus-visible:ring-primary-500/20 focus-visible:border-[#3A3A3E]"
          />
        </div>

      

        {/* Films Section */}
        <div className="flex flex-col gap-5">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Featured Film Projects</span>
            <Link href="/films" className="text-xs text-primary-500 hover:text-primary-400 transition-colors">
              View All →
            </Link>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
              <p className="text-[#6B6B70]">Loading films from contract...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-10 h-10 text-error-500 mb-4" />
              <p className="text-[#6B6B70] mb-4">{error}</p>
              <button
                onClick={fetchFilms}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && films.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <FilmIcon className="w-16 h-16 text-[#6B6B70] mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Films Yet</h3>
              <p className="text-[#6B6B70] text-center max-w-md">
                No films have been created on the contract yet. Check back soon or create one if
                you&apos;re an admin.
              </p>
            </div>
          )}

          {/* Films Grid */}
          {!isLoading && !error && filteredFilms.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFilms.map((film, index) => {
                const fundingPercent =
                  film.maxSupply > 0 ? (film.tokensSold / film.maxSupply) * 100 : 0;
                const gradient = FILM_GRADIENTS[index % FILM_GRADIENTS.length] ?? FILM_GRADIENTS[0];
                const isFullyFunded = fundingPercent >= 100;
                const goalAmount = film.maxSupply;
                const minInvestment = Math.max(25, Math.floor(goalAmount * 0.001));
                const iconColor = index % 3 === 0 ? "text-primary-500" : index % 3 === 1 ? "text-success-500" : "text-[#4A4A4E]";
                const thumbnail = getFilmThumbnail(film.id);
                const hasMedia = hasFilmMedia(film.id);

                return (
                  <div
                    key={film.id}
                    className="bg-[#111113] border border-[#1F1F23] rounded-xl overflow-hidden hover:border-[#2A2A2E] transition-all"
                  >
                    {/* Thumbnail or Gradient Header */}
                    <div className="relative h-[240px]">
                      {thumbnail ? (
                        <>
                          <Image
                            src={thumbnail}
                            alt={film.title}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        </>
                      ) : (
                        <div className={`h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                          <Clapperboard className={`w-8 h-8 ${iconColor}`} />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white mb-1">{film.title}</h3>
                        <p className="text-xs text-[#6B6B70] line-clamp-1 leading-relaxed">
                          {film.description}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-[#6B6B70] mb-0.5">Funded</p>
                          <p className={`text-sm font-semibold ${isFullyFunded ? "text-success-500" : "text-primary-500"}`}>
                            {Math.min(fundingPercent, 100).toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#6B6B70] mb-0.5">Goal</p>
                          <p className="text-sm font-semibold text-white font-mono">
                            ${formatCompactAmount(goalAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#6B6B70] mb-0.5">Min</p>
                          <p className="text-sm font-semibold text-white font-mono">
                            ${formatCompactAmount(minInvestment * 1_000_000)}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1 w-full bg-[#2A2A2E] rounded-sm overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isFullyFunded ? "bg-success-500" : "bg-primary-500"
                          }`}
                          style={{ width: `${Math.min(fundingPercent, 100)}%` }}
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {hasMedia && (
                          <div className="flex-1">
                            <ShortsButton filmId={film.id} filmTitle={film.title} variant="card-primary" />
                          </div>
                        )}
                        <Link href={`/films/${film.id}`} className={hasMedia ? "flex-1" : "w-full block"}>
                          {isFullyFunded ? (
                            <button className="w-full py-2.5 bg-success-500/10 text-success-500 text-sm font-medium rounded-lg">
                              Fully Funded
                            </button>
                          ) : (
                            <button className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors ${
                              hasMedia 
                                ? "border border-[#2A2A2E] text-[#ADADB0] hover:bg-[#1A1A1D]" 
                                : "bg-primary-500 hover:bg-primary-600 text-white"
                            }`}>
                              View More
                            </button>
                          )}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No search results */}
          {!isLoading && !error && films.length > 0 && filteredFilms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <Search className="w-12 h-12 text-[#6B6B70] mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No results found</h3>
              <p className="text-[#6B6B70] text-center">
                Try adjusting your search to find what you&apos;re looking for.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
