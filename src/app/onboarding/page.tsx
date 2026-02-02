"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

import onboarding1 from "@/../assets/images/onboarding/1.png";
import onboarding2 from "@/../assets/images/onboarding/2.png";
import onboarding3 from "@/../assets/images/onboarding/3.png";

const slides = [
  {
    image: onboarding1,
    title: "Invest in Anime",
    subtitle:
      "Own tokenized shares of anime short-form content. From indie creators to top animators, be part of the stories that inspire the community.",
  },
  {
    image: onboarding2,
    title: "Bitcoin Secured",
    subtitle:
      "Built on Stacks, Bitcoin's smart contract layer. Your investments are secured by the world's most trusted blockchain.",
  },
  {
    image: onboarding3,
    title: "Earn & Trade",
    subtitle:
      "Receive returns from content revenue. Trade your tokens anytime. The future of anime creator support is here.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  function handleNext() {
    if (currentIndex === slides.length - 1) {
      router.push("/connect-wallet");
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function handlePrevious() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  function handleDotClick(index: number) {
    setCurrentIndex(index);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? 0;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchEndX.current = e.touches[0]?.clientX ?? 0;
  }

  function handleTouchEnd() {
    if (touchStartX.current - touchEndX.current > 75) {
      handleNext();
    }
    if (touchStartX.current - touchEndX.current < -75) {
      handlePrevious();
    }
  }

  return (
    <div
      className="fixed inset-0 bg-background-0 overflow-hidden touch-none max-w-lg mx-auto"
      style={{ height: "100dvh" }}
    >
      {/* Logo */}
      <div className="absolute top-8 left-0 right-0 z-30 text-center">
 
 <div className="flex items-center w-fit mx-auto gap-2.5 pb-4 mt-12">
              <span className="text-white text-2xl  font-semibold font-mono tracking-[4px]">
                CRUNCHYREELS
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
       </div>
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
          {slides.map((slide, index) => (
            <div
              key={index}
              className="w-full shrink-0 flex flex-col gap-6 px-6 justify-center items-center"
            >
              {/* Image */}
              <div className="w-64 h-64 relative flex items-center justify-center">
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-contain"
                  priority={index === 0}
                />
              </div>

              {/* Text */}
              <div className="flex flex-col gap-3 text-center max-w-sm">
                <h2 className="text-typography-950 text-3xl font-bold font-sans">
                  {slide.title}
                </h2>
                <p className="text-typography-500 text-lg leading-relaxed">
                  {slide.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background-300/60 backdrop-blur-sm border border-background-400 hover:bg-background-400/80 transition-all flex items-center justify-center z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-typography-950" />
          </button>
        )}

        <button
          onClick={handleNext}
          className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full transition-all flex items-center justify-center z-10 ${
            currentIndex === slides.length - 1
              ? "bg-primary-500 hover:bg-primary-600"
              : "bg-background-300/60 backdrop-blur-sm border border-background-400 hover:bg-background-400/80"
          }`}
          aria-label={currentIndex === slides.length - 1 ? "Complete onboarding" : "Next slide"}
        >
          {currentIndex === slides.length - 1 ? (
            <ArrowRight className="w-6 h-6 text-white" />
          ) : (
            <ChevronRight className="w-6 h-6 text-typography-950" />
          )}
        </button>
      </div>

      {/* Bottom Section - Dots only */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center max-w-lg mx-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-background-0 z-20">
        <div className="flex items-center gap-2">
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
      </div>
    </div>
  );
}
