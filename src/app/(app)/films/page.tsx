"use client";

import { useEffect, useState } from "react";
import { Film as FilmIcon, TrendingUp, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getLastFilmId, getFilm, getTotalUsdcxCollected } from "@/utils/contractCalls";
import { formatUSDCx } from "@/utils/contractConfig";

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

// Placeholder images for films (rotate through)
const FILM_IMAGES = [
  "https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=800",
  "https://images.unsplash.com/photo-1518173946687-a4c036bc3c9c?w=800",
  "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800",
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800",
];

const GENRE_TAGS = ["Sci-Fi", "Drama", "Documentary", "Thriller", "Action"];

export default function FilmsPage() {
  const [films, setFilms] = useState<Film[]>([]);
  const [totalInvestors, setTotalInvestors] = useState(0);
  const [totalRaised, setTotalRaised] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchFilms() {
    setIsLoading(true);
    setError(null);

    try {
      // Get last film ID
      const lastFilmId = await getLastFilmId();
      const filmCount = typeof lastFilmId === "bigint" ? Number(lastFilmId) : Number(lastFilmId);

      if (filmCount === 0) {
        setFilms([]);
        setIsLoading(false);
        return;
      }

      // Fetch all films
      const filmPromises: Promise<Film | null>[] = [];
      for (let i = 1; i <= filmCount; i++) {

        filmPromises.push(
          getFilm(i).then((result) => {
            if (!result) {
              console.log(`Film ${i} not found`);
              return null;
            }
            
            // Handle Clarity tuple structure: { type, value: { field: { type, value } } }
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
          }).catch((err) => {
            console.error(`Error fetching film ${i}:`, err);
            return null;
          })
        );
      }

      const fetchedFilms = (await Promise.all(filmPromises)).filter(
        (f): f is Film => f !== null
      );

      setFilms(fetchedFilms);

      // Get total USDCx collected
      const totalCollected = await getTotalUsdcxCollected();
      setTotalRaised(Number(totalCollected));

      // Estimate total investors (sum of unique holders would require indexing)
      setTotalInvestors(fetchedFilms.reduce((acc, f) => acc + (f.tokensSold > 0 ? 1 : 0), 0) * 10);
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

  return (
    <div className="flex-1 overflow-auto pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-typography-950 font-sans mb-2">
              Discover Films
            </h1>
            <p className="text-typography-600">
              Invest in the next generation of cinema. Own a piece of film history.
            </p>
          </div>
          <button
            onClick={fetchFilms}
            disabled={isLoading}
            className="p-2 rounded-lg bg-background-100 border border-background-300 hover:border-primary-500/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 text-typography-400 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-background-100 border border-background-300 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-500 font-mono">
              {isLoading ? "..." : activeFilms.length}
            </div>
            <div className="text-sm text-typography-500">Active Projects</div>
          </div>
          <div className="bg-background-100 border border-background-300 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-500 font-mono">
              {isLoading ? "..." : `$${formatUSDCx(totalFunded)}`}
            </div>
            <div className="text-sm text-typography-500">Total Funded</div>
          </div>
          <div className="bg-background-100 border border-background-300 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-500 font-mono">
              {isLoading ? "..." : totalInvestors}
            </div>
            <div className="text-sm text-typography-500">Investors</div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
            <p className="text-typography-500">Loading films from contract...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-10 h-10 text-error-500 mb-4" />
            <p className="text-typography-500 mb-4">{error}</p>
            <button
              onClick={fetchFilms}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && films.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <FilmIcon className="w-16 h-16 text-typography-400 mb-4" />
            <h3 className="text-xl font-semibold text-typography-950 mb-2">No Films Yet</h3>
            <p className="text-typography-500 text-center max-w-md">
              No films have been created on the contract yet. Check back soon or create one if you&apos;re an admin.
            </p>
          </div>
        )}

        {/* Films Grid */}
        {!isLoading && !error && films.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {films.map((film, index) => {
              const fundingPercent = film.maxSupply > 0 
                ? (film.tokensSold / film.maxSupply) * 100 
                : 0;
              const imageUri = FILM_IMAGES[index % FILM_IMAGES.length] ?? FILM_IMAGES[0]!;
              const genre = GENRE_TAGS[index % GENRE_TAGS.length] ?? "Film";

              return (
                <div
                  key={film.id}
                  className={`group bg-background-100 border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    film.isActive 
                      ? "border-background-300 hover:border-primary-500/50 hover:shadow-primary-500/10" 
                      : "border-background-200 opacity-60"
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={imageUri}
                      alt={film.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background-0/90 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      <span className="px-2 py-1 bg-primary-500/90 text-white text-xs font-medium rounded-full">
                        {genre}
                      </span>
                      {!film.isActive && (
                        <span className="px-2 py-1 bg-error-500/90 text-white text-xs font-medium rounded-full">
                          Closed
                        </span>
                      )}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-background-0/80 backdrop-blur-sm text-typography-300 text-xs font-mono rounded">
                        ${film.symbol}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-xl font-semibold text-typography-950 mb-1 font-sans">
                      {film.title}
                    </h3>
                    <p className="text-sm text-typography-500 mb-3 font-mono truncate">
                      Producer: {film.producer.slice(0, 8)}...{film.producer.slice(-4)}
                    </p>
                    <p className="text-sm text-typography-600 mb-4 line-clamp-2">
                      {film.description}
                    </p>

                    {/* Funding Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-typography-500">Funding Progress</span>
                        <span className="text-primary-500 font-medium">
                          {fundingPercent.toFixed(3)}%
                        </span>
                      </div>
                      <div className="h-2 bg-background-300 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(fundingPercent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-typography-500 mt-2">
                        <span>${formatUSDCx(film.tokensSold)} raised</span>
                        <span>Goal: ${formatUSDCx(film.maxSupply)}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link href={`/films/${film.id}`}>
                      <button 
                        className={`w-full py-3 font-medium rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 ${
                          film.isActive
                            ? "bg-primary-500 hover:bg-primary-600 text-white"
                            : "bg-background-200 text-typography-500 cursor-default"
                        }`}
                        disabled={!film.isActive}
                      >
                        <FilmIcon className="w-4 h-4" />
                        {film.isActive ? "Invest Now" : "View Details"}
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Coming Soon Section */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-background-100 border border-background-300 rounded-full text-typography-500 text-sm">
            <TrendingUp className="w-4 h-4" />
            More films coming soon
          </div>
        </div>
      </div>
    </div>
  );
}
