import { Film as FilmIcon, TrendingUp, Users } from "lucide-react"
import { useDemo } from "@/context/DemoStore"

function Films() {
  const { films } = useDemo()

  return (
    <div className="flex-1 overflow-auto pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-typography-950 font-outfit mb-2">
            Discover Films
          </h1>
          <p className="text-typography-600">
            Invest in the next generation of cinema. Own a piece of film history.
          </p>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-background-100 border border-background-300 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-500 font-mono">{films.length}</div>
            <div className="text-sm text-typography-500">Active Projects</div>
          </div>
          <div className="bg-background-100 border border-background-300 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-primary-500 font-mono">
              ${(films.reduce((sum, f) => sum + f.currentFunding, 0) / 1000).toFixed(0)}K
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
          {films.map((film) => {
            const fundingPercent = (film.currentFunding / film.fundingGoal) * 100
            
            return (
              <div
                key={film.id}
                className="group bg-background-100 border border-background-300 rounded-2xl overflow-hidden hover:border-primary-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={film.imageUri}
                    alt={film.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                  <h3 className="text-xl font-semibold text-typography-950 mb-1 font-outfit">
                    {film.title}
                  </h3>
                  <p className="text-sm text-typography-500 mb-3">
                    Directed by {film.director}
                  </p>
                  <p className="text-sm text-typography-600 mb-4 line-clamp-2">
                    {film.description}
                  </p>

                  {/* Funding Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-typography-500">Funding Progress</span>
                      <span className="text-primary-500 font-medium">{fundingPercent.toFixed(0)}%</span>
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
            )
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
  )
}

export default Films
