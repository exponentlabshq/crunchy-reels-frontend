import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, ChevronLeft, ChevronRight, Film, Bitcoin, Sparkles } from "lucide-react"

const slides = [
  {
    icon: Film,
    title: "Invest in Cinema",
    subtitle:
      "Own tokenized shares of film projects. From indie films to blockbusters, be part of the stories that move the world.",
    gradient: "from-primary-500 to-orange-500",
  },
  {
    icon: Bitcoin,
    title: "Bitcoin Secured",
    subtitle:
      "Built on Stacks, Bitcoin's smart contract layer. Your investments are secured by the world's most trusted blockchain.",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: Sparkles,
    title: "Earn & Trade",
    subtitle:
      "Receive returns from film profits. Trade your tokens anytime. The future of film investment is here.",
    gradient: "from-amber-500 to-primary-500",
  },
]

function Onboarding() {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)

  function handleNext() {
    if (currentIndex === slides.length - 1) {
      navigate("/connect-wallet")
    } else {
      setCurrentIndex(currentIndex + 1)
    }
  }

  function handlePrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  function handleDotClick(index: number) {
    setCurrentIndex(index)
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchEndX.current = e.touches[0].clientX
  }

  function handleTouchEnd() {
    if (touchStartX.current - touchEndX.current > 75) {
      handleNext()
    }
    if (touchStartX.current - touchEndX.current < -75) {
      handlePrevious()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-background-0 overflow-hidden touch-none max-w-lg mx-auto"
      style={{ height: "100dvh" }}
    >
      {/* Logo */}
      <div className="absolute top-8 left-0 right-0 z-30 text-center">
        <h1 className="text-2xl font-bold text-primary-500 font-outfit tracking-tight">
          CineBlock
        </h1>
      </div>

      {/* Slides Container */}
      <div
        className="absolute inset-0 pb-24 pt-20"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, index) => {
            const Icon = slide.icon
            return (
              <div
                key={index}
                className="w-full flex-shrink-0 flex flex-col gap-8 px-6 justify-center items-center"
              >
                {/* Icon */}
                <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-2xl shadow-primary-500/20`}>
                  <Icon className="w-16 h-16 text-white" strokeWidth={1.5} />
                </div>

                {/* Text */}
                <div className="flex flex-col gap-3 text-center max-w-sm">
                  <h2 className="text-typography-950 text-3xl font-bold font-outfit">
                    {slide.title}
                  </h2>
                  <p className="text-typography-500 text-lg leading-relaxed">
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background-100/80 backdrop-blur-sm border border-background-300 hover:bg-background-200 transition-all flex items-center justify-center z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-typography-900" />
          </button>
        )}

        {currentIndex < slides.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background-100/80 backdrop-blur-sm border border-background-300 hover:bg-background-200 transition-all flex items-center justify-center z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-typography-900" />
          </button>
        )}
      </div>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center max-w-lg mx-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-background-0 z-20">
        <div className="flex-1 flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === index ? "w-10 bg-primary-500" : "w-4 bg-background-300"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className={`rounded-full w-14 h-14 bg-primary-500 hover:bg-primary-600 flex items-center justify-center transition-all duration-300 ${
            currentIndex === slides.length - 1 ? "opacity-100" : "opacity-50"
          }`}
        >
          <ArrowRight className="h-6 w-6 text-white" />
        </button>
      </div>
    </div>
  )
}

export default Onboarding
