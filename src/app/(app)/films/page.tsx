"use client";

import { Film as FilmIcon, TrendingUp } from "lucide-react";
import Image from "next/image";

interface Film {
  id: number;
  title: string;
  genre: string;
  description: string;
  imageUri: string;
  director: string;
  year: number;
  fundingGoal: number;
  currentFunding: number;
  tokenSymbol: string;
}

const FILMS: Film[] = [
  {
    id: 1,
    title: "Neon Dreams",
    genre: "Sci-Fi",
    description:
      "A cyberpunk thriller set in 2087 Tokyo where reality and virtual worlds collide. Follow detective Maya Chen as she uncovers a conspiracy that threatens both dimensions.",
    imageUri: "https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=800",
    director: "Sarah Chen",
    year: 2026,
    fundingGoal: 500000,
    currentFunding: 125000,
    tokenSymbol: "NEON",
  },
  {
    id: 2,
    title: "The Last Frontier",
    genre: "Documentary",
    description:
      "An intimate look at the communities living on the edge of climate change, documenting their resilience and adaptation in the face of environmental challenges.",
    imageUri: "https://images.unsplash.com/photo-1518173946687-a4c036bc3c9c?w=800",
    director: "Michael Torres",
    year: 2026,
    fundingGoal: 250000,
    currentFunding: 175000,
    tokenSymbol: "FRNT",
  },
  {
    id: 3,
    title: "Midnight in Marrakech",
    genre: "Drama",
    description:
      "A sweeping romantic drama following two strangers who meet in the vibrant markets of Morocco and discover love, loss, and redemption across continents.",
    imageUri: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800",
    director: "Amira Benali",
    year: 2026,
    fundingGoal: 350000,
    currentFunding: 280000,
    tokenSymbol: "MRKCH",
  },
];

export default function FilmsPage() {
  return (
    <div className="flex-1 overflow-auto pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-typography-950 font-sans mb-2">
            Discover Films
          </h1>
          <p className="text-typography-600">
            Invest in the next generation of cinema. Own a piece of film history.
          </p>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-background-100 border border-background-300 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-500 font-mono">{FILMS.length}</div>
            <div className="text-sm text-typography-500">Active Projects</div>
          </div>
          <div className="bg-background-100 border border-background-300 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-500 font-mono">
              ${(FILMS.reduce((sum, f) => sum + f.currentFunding, 0) / 1000).toFixed(0)}K
            </div>
            <div className="text-sm text-typography-500">Total Funded</div>
          </div>
          <div className="bg-background-100 border border-background-300 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-500 font-mono">247</div>
            <div className="text-sm text-typography-500">Investors</div>
          </div>
        </div>

        {/* Films Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FILMS.map((film) => {
            const fundingPercent = (film.currentFunding / film.fundingGoal) * 100;

            return (
              <div
                key={film.id}
                className="group bg-background-100 border border-background-300 rounded-2xl overflow-hidden hover:border-primary-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={film.imageUri}
                    alt={film.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background-0/90 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-1 bg-primary-500/90 text-white text-xs font-medium rounded-full">
                      {film.genre}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 bg-background-0/80 backdrop-blur-sm text-typography-300 text-xs font-mono rounded">
                      ${film.tokenSymbol}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-typography-950 mb-1 font-sans">
                    {film.title}
                  </h3>
                  <p className="text-sm text-typography-500 mb-3">Directed by {film.director}</p>
                  <p className="text-sm text-typography-600 mb-4 line-clamp-2">
                    {film.description}
                  </p>

                  {/* Funding Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-typography-500">Funding Progress</span>
                      <span className="text-primary-500 font-medium">
                        {fundingPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-background-300 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(fundingPercent, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-typography-500 mt-2">
                      <span>${(film.currentFunding / 1000).toFixed(0)}K raised</span>
                      <span>Goal: ${(film.fundingGoal / 1000).toFixed(0)}K</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors duration-200 flex items-center justify-center gap-2">
                    <FilmIcon className="w-4 h-4" />
                    Invest Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>

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
