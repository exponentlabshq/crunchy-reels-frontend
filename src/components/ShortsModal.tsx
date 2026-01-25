"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Play, X, Pause, Volume2, VolumeX, ChevronUp, ChevronDown, DollarSign, Film } from "lucide-react"
import { getFilmShorts, FILM_MEDIA, type Short } from "@/data/filmMedia"
import Link from "next/link"

interface ShortsModalProps {
  filmId: number
  filmTitle?: string
}

interface ShortsButtonProps {
  filmId: number
  filmTitle?: string
  variant?: "card" | "card-primary" | "detail"
}

interface AllShort extends Short {
  filmId: number
  filmTitle: string
  globalIndex: number
}

function ShortsModalContent({
  initialFilmId,
  onClose,
}: {
  initialFilmId: number
  filmTitle: string
  onClose: () => void
}) {
  // Build flat list of all shorts
  const allShorts = useMemo<AllShort[]>(() => {
    const shorts: AllShort[] = []
    let globalIndex = 0
    FILM_MEDIA.forEach((film) => {
      film.shorts.forEach((short) => {
        shorts.push({
          ...short,
          filmId: film.filmId,
          filmTitle: `Film #${film.filmId}`,
          globalIndex: globalIndex++,
        })
      })
    })
    return shorts
  }, [])

  const filmIds = useMemo(() => [...new Set(FILM_MEDIA.map((f) => f.filmId))], [])

  const startingIndex = useMemo(() => {
    const idx = allShorts.findIndex((s) => s.filmId === initialFilmId)
    return idx >= 0 ? idx : 0
  }, [allShorts, initialFilmId])

  const [currentIndex, setCurrentIndex] = useState(startingIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)
  
  // Gesture state
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const nextVideoRef = useRef<HTMLVideoElement>(null)
  const prevVideoRef = useRef<HTMLVideoElement>(null)
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null)
  
  // Gesture tracking
  const dragStartY = useRef(0)
  const lastY = useRef(0)
  const lastTime = useRef(0)
  const velocity = useRef(0)
  const containerHeight = useRef(0)
  const hasDragged = useRef(false)

  const currentShort = allShorts[currentIndex]
  const nextShort = allShorts[(currentIndex + 1) % allShorts.length]
  const prevShort = allShorts[(currentIndex - 1 + allShorts.length) % allShorts.length]
  const shortsForCurrentFilm = allShorts.filter((s) => s.filmId === currentShort?.filmId)

  // Threshold settings
  const COMMIT_THRESHOLD = 0.25 // 25% of screen height
  const VELOCITY_THRESHOLD = 0.5 // pixels per ms

  // Auto-hide controls after 3 seconds
  const resetHideTimer = useCallback(() => {
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current)
    }
    setShowControls(true)
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }, [isPlaying])

  useEffect(() => {
    resetHideTimer()
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current)
      }
    }
  }, [resetHideTimer])

  // Show controls when paused
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true)
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current)
      }
    } else {
      resetHideTimer()
    }
  }, [isPlaying, resetHideTimer])

  // Jump directly to a specific index with animation
  const jumpToIndex = useCallback((targetIndex: number, direction: "up" | "down") => {
    if (targetIndex === currentIndex || isAnimating) return
    
    const targetOffset = direction === "up" ? -containerHeight.current : containerHeight.current
    
    setIsAnimating(true)
    setDragOffset(targetOffset)
    
    setTimeout(() => {
      setCurrentIndex(targetIndex)
      setDragOffset(0)
      setIsAnimating(false)
      setProgress(0)
    }, 300)
  }, [currentIndex, isAnimating])

  const commitTransition = useCallback((direction: "up" | "down") => {
    const targetIndex = direction === "up" 
      ? (currentIndex + 1) % allShorts.length
      : (currentIndex - 1 + allShorts.length) % allShorts.length
    
    jumpToIndex(targetIndex, direction)
  }, [currentIndex, allShorts.length, jumpToIndex])

  const revertTransition = useCallback(() => {
    setIsAnimating(true)
    setDragOffset(0)
    
    setTimeout(() => {
      setIsAnimating(false)
    }, 300)
  }, [])

  const handleDragStart = useCallback((clientY: number) => {
    if (isAnimating) return
    
    containerHeight.current = containerRef.current?.offsetHeight ?? window.innerHeight
    dragStartY.current = clientY
    lastY.current = clientY
    lastTime.current = Date.now()
    velocity.current = 0
    hasDragged.current = false
    setIsDragging(true)
  }, [isAnimating])

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging || isAnimating) return
    
    const now = Date.now()
    const deltaTime = now - lastTime.current
    const deltaY = clientY - lastY.current
    
    if (deltaTime > 0) {
      velocity.current = deltaY / deltaTime
    }
    
    lastY.current = clientY
    lastTime.current = now
    
    const offset = clientY - dragStartY.current
    
    // Mark as dragged if moved more than 10px
    if (Math.abs(offset) > 10) {
      hasDragged.current = true
    }
    
    setDragOffset(offset)
  }, [isDragging, isAnimating])

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    
    const offsetRatio = Math.abs(dragOffset) / containerHeight.current
    const vel = velocity.current
    
    // Determine direction
    const direction = dragOffset < 0 ? "up" : "down"
    
    // Commit if threshold met or velocity is sufficient
    const shouldCommit = offsetRatio > COMMIT_THRESHOLD || 
      (direction === "up" && vel < -VELOCITY_THRESHOLD) ||
      (direction === "down" && vel > VELOCITY_THRESHOLD)
    
    if (shouldCommit && Math.abs(dragOffset) > 10) {
      commitTransition(direction)
    } else {
      revertTransition()
    }
  }, [isDragging, dragOffset, commitTransition, revertTransition])

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (touch) handleDragStart(touch.clientY)
  }, [handleDragStart])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (touch) handleDragMove(touch.clientY)
  }, [handleDragMove])

  const handleTouchEnd = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) return
    handleDragStart(e.clientY)
  }, [handleDragStart])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleDragMove(e.clientY)
    resetHideTimer()
  }, [handleDragMove, resetHideTimer])

  const handleMouseUp = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  const handleMouseLeave = useCallback(() => {
    if (isDragging) handleDragEnd()
  }, [isDragging, handleDragEnd])

  // Wheel handler - discrete jumps
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    if (isAnimating || isDragging) return
    
    if (e.deltaY > 30) {
      commitTransition("up")
    } else if (e.deltaY < -30) {
      commitTransition("down")
    }
  }, [isAnimating, isDragging, commitTransition])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener("wheel", handleWheel, { passive: false })
    return () => container.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  // Film navigation (side buttons) - jumps directly to first short of target film
  const goNextFilm = useCallback(() => {
    if (!currentShort || isAnimating || isDragging) return
    const currentFilmIdx = filmIds.indexOf(currentShort.filmId)
    const nextFilmId = filmIds[(currentFilmIdx + 1) % filmIds.length]
    const firstShort = allShorts.find((s) => s.filmId === nextFilmId)
    if (firstShort) {
      jumpToIndex(firstShort.globalIndex, "up")
    }
  }, [currentShort, filmIds, allShorts, isAnimating, isDragging, jumpToIndex])

  const goPrevFilm = useCallback(() => {
    if (!currentShort || isAnimating || isDragging) return
    const currentFilmIdx = filmIds.indexOf(currentShort.filmId)
    const prevFilmId = filmIds[(currentFilmIdx - 1 + filmIds.length) % filmIds.length]
    const firstShort = allShorts.find((s) => s.filmId === prevFilmId)
    if (firstShort) {
      jumpToIndex(firstShort.globalIndex, "down")
    }
  }, [currentShort, filmIds, allShorts, isAnimating, isDragging, jumpToIndex])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
    resetHideTimer()
  }, [isPlaying, resetHideTimer])

  // Only toggle play if user didn't drag (tap vs swipe)
  const handleVideoTap = useCallback(() => {
    if (hasDragged.current) return
    // On tap, show controls if hidden, or toggle play if visible
    if (!showControls) {
      resetHideTimer()
    } else {
      togglePlay()
    }
  }, [togglePlay, showControls, resetHideTimer])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
    resetHideTimer()
  }, [isMuted, resetHideTimer])

  // Video events
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const percent = (video.currentTime / video.duration) * 100
      setProgress(isNaN(percent) ? 0 : percent)
    }

    const handleEnded = () => {
      commitTransition("up")
    }

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("ended", handleEnded)
    }
  }, [commitTransition, currentIndex])

  // Reset video when index changes and auto-play
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    setProgress(0)
    setIsPlaying(false)
    
    // Auto-play after video is ready
    const handleCanPlay = () => {
      video.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        // Autoplay blocked by browser
        setIsPlaying(false)
      })
    }
    
    video.addEventListener("canplay", handleCanPlay, { once: true })
    video.load()
    
    return () => {
      video.removeEventListener("canplay", handleCanPlay)
    }
  }, [currentIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimating) return
      switch (e.key) {
        case "Escape":
          onClose()
          break
        case "ArrowUp":
          e.preventDefault()
          commitTransition("down")
          break
        case "ArrowDown":
          e.preventDefault()
          commitTransition("up")
          break
        case " ":
          e.preventDefault()
          togglePlay()
          break
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, commitTransition, togglePlay, isAnimating])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  // Navigate to specific short via dots
  const goToShort = useCallback((index: number) => {
    if (index === currentIndex || isAnimating) return
    const direction = index > currentIndex ? "up" : "down"
    jumpToIndex(index, direction)
  }, [currentIndex, isAnimating, jumpToIndex])

  if (!currentShort) return null

  // Calculate positions
  const currentY = dragOffset
  const nextY = containerHeight.current + dragOffset // Below current
  const prevY = -containerHeight.current + dragOffset // Above current

  const transitionStyle = isAnimating 
    ? "transform 300ms cubic-bezier(0.25, 0.1, 0.25, 1)" 
    : "none"

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black touch-none select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {/* Full Screen Video Container - Mobile fills entire screen */}
      <div className="w-full h-[100dvh] flex items-center justify-center">
        {/* Desktop: Aspect ratio container with side controls */}
        {/* Mobile: Full screen video */}
        <div className="flex items-center gap-0 md:gap-4 h-full w-full md:w-auto md:max-h-[100dvh] md:py-4">
          {/* Left dots - Desktop only */}
          <div className="hidden md:flex flex-col gap-2 px-2 z-20">
            {shortsForCurrentFilm.map((short) => (
              <button
                key={short.globalIndex}
                onClick={() => goToShort(short.globalIndex)}
                className={`w-2 h-2 rounded-full transition-all ${
                  short.globalIndex === currentIndex
                    ? "bg-primary-500 scale-125"
                    : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>

          {/* Video Stack - Full screen on mobile, 9:16 on desktop */}
          <div className="relative w-full h-full md:h-full md:aspect-[9/16] md:max-w-full overflow-hidden md:rounded-2xl bg-black">
            {/* Previous Video (above) */}
            {dragOffset > 0 && (
              <div
                className="absolute inset-x-0 h-full"
                style={{
                  transform: `translateY(${prevY}px)`,
                  transition: transitionStyle,
                }}
              >
                <video
                  ref={prevVideoRef}
                  src={prevShort?.videoUrl}
                  className="w-full h-full object-contain"
                  muted
                  playsInline
                />
                <VideoOverlay short={prevShort} showControls={showControls} />
              </div>
            )}

            {/* Current Video */}
            <div
              className="absolute inset-x-0 h-full z-10"
              style={{
                transform: `translateY(${currentY}px)`,
                transition: transitionStyle,
              }}
            >
              <video
                ref={videoRef}
                src={currentShort.videoUrl}
                className="w-full h-full object-contain"
                muted={isMuted}
                playsInline
                onClick={handleVideoTap}
              />

              {/* Center Play Button - Only when paused and controls visible */}
              {!isPlaying && showControls && !isDragging && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <button
                    onClick={togglePlay}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto cursor-pointer hover:bg-black/50 transition-colors"
                  >
                    <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" />
                  </button>
                </div>
              )}

              {/* Header - Auto-hiding */}
              <div 
                className={`absolute top-0 left-0 right-0 pt-12 md:pt-4 px-4 pb-8 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none transition-opacity duration-300 ${
                  showControls ? "opacity-100" : "opacity-0"
                }`}
              >
                <p className="text-white/60 text-xs uppercase tracking-wider mb-1">
                  Film #{currentShort.filmId}
                </p>
                <h2 className="text-white font-semibold text-base md:text-lg">{currentShort.title}</h2>
                <p className="text-white/60 text-sm">{currentShort.duration}</p>
              </div>

              {/* Close button - Always visible on mobile, auto-hide on desktop */}
              <button
                onClick={onClose}
                className={`absolute top-3 right-3 z-30 p-2 md:p-2.5 rounded-full bg-black/40 hover:bg-black/60 transition-all backdrop-blur-sm ${
                  showControls ? "opacity-100" : "md:opacity-0"
                }`}
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Progress bar - Always at very bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
                <div
                  className="h-full bg-primary-500 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Bottom Controls - Auto-hiding, positioned above safe area */}
              <div 
                className={`absolute bottom-[env(safe-area-inset-bottom,0px)] left-0 right-0 pb-4 pt-16 px-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
                  showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
              >
                <div className="flex items-center justify-between">
                  {/* Left: Play/Mute controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlay}
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-sm"
                    >
                      {isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <Play className="w-4 h-4 md:w-5 md:h-5 text-white ml-0.5" />}
                    </button>
                    <button
                      onClick={toggleMute}
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-sm"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5 text-white" />}
                    </button>
                  </div>

                  {/* Right: Invest button - Mobile only */}
                  <Link
                    href={`/films/${currentShort.filmId}`}
                    onClick={onClose}
                    className="md:hidden px-4 py-2 bg-primary-500 hover:bg-primary-600 rounded-full text-white text-sm font-medium transition-colors flex items-center gap-1.5"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Invest</span>
                  </Link>
                </div>
              </div>

              {/* Mobile dots - Vertical on right side, auto-hiding */}
              <div 
                className={`absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 md:hidden transition-opacity duration-300 ${
                  showControls ? "opacity-100" : "opacity-0"
                }`}
              >
                {shortsForCurrentFilm.map((short) => (
                  <button
                    key={short.globalIndex}
                    onClick={() => goToShort(short.globalIndex)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      short.globalIndex === currentIndex
                        ? "bg-primary-500 scale-125"
                        : "bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>

              {/* Swipe indicator - Mobile only, briefly visible */}
              <div 
                className={`absolute left-1/2 -translate-x-1/2 bottom-20 flex flex-col items-center gap-1 md:hidden transition-opacity duration-300 ${
                  showControls && currentIndex === startingIndex ? "opacity-60" : "opacity-0"
                }`}
              >
                <ChevronUp className="w-5 h-5 text-white animate-bounce" />
                <span className="text-white/60 text-xs">Swipe for more</span>
              </div>
            </div>

            {/* Next Video (below) */}
            {dragOffset < 0 && (
              <div
                className="absolute inset-x-0 h-full"
                style={{
                  transform: `translateY(${nextY}px)`,
                  transition: transitionStyle,
                }}
              >
                <video
                  ref={nextVideoRef}
                  src={nextShort?.videoUrl}
                  className="w-full h-full object-contain"
                  muted
                  playsInline
                />
                <VideoOverlay short={nextShort} showControls={showControls} />
              </div>
            )}
          </div>

          {/* Right Side Controls - Desktop only */}
          <div className="hidden md:flex flex-col items-center gap-4 px-2 z-20">
            <button
              onClick={goPrevFilm}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10"
              title="Previous Film"
            >
              <ChevronUp className="w-6 h-6 text-white" />
            </button>

            <div className="flex flex-col items-center gap-1">
              <Film className="w-5 h-5 text-white/60" />
              <span className="text-white/60 text-xs">Film</span>
            </div>

            <button
              onClick={goNextFilm}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10"
              title="Next Film"
            >
              <ChevronDown className="w-6 h-6 text-white" />
            </button>

            <Link
              href={`/films/${currentShort.filmId}`}
              onClick={onClose}
              className="mt-4 flex flex-col items-center gap-1 group"
            >
              <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/30">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xs font-medium opacity-80 group-hover:opacity-100">Invest</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple overlay for adjacent videos during drag
function VideoOverlay({ short, showControls }: { short: AllShort | undefined; showControls: boolean }) {
  if (!short) return null
  return (
    <div 
      className={`absolute top-0 left-0 right-0 pt-12 md:pt-4 px-4 pb-8 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none transition-opacity duration-300 ${
        showControls ? "opacity-100" : "opacity-0"
      }`}
    >
      <p className="text-white/60 text-xs uppercase tracking-wider mb-1">
        Film #{short.filmId}
      </p>
      <h2 className="text-white font-semibold text-base md:text-lg">{short.title}</h2>
      <p className="text-white/60 text-sm">{short.duration}</p>
    </div>
  )
}

export function ShortsButton({ filmId, filmTitle = "Film", variant = "card" }: ShortsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const shorts = getFilmShorts(filmId)

  if (shorts.length === 0) return null

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(true)
  }

  const renderButton = () => {
    switch (variant) {
      case "card":
        return (
          <button
            onClick={handleClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 border border-primary-500/30 rounded-full text-primary-400 text-xs font-medium transition-colors"
          >
            <Play className="w-3 h-3" />
            <span>{shorts.length} Shorts</span>
          </button>
        )
      case "card-primary":
        return (
          <button
            onClick={handleClick}
            className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            <span>Play Shorts</span>
          </button>
        )
      case "detail":
      default:
        return (
          <button
            onClick={handleClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-xl text-white font-medium transition-all hover:shadow-lg hover:shadow-primary-500/25 active:scale-[0.98]"
          >
            <Play className="w-4 h-4" />
            <span>Watch {shorts.length} Shorts</span>
          </button>
        )
    }
  }

  return (
    <>
      {renderButton()}

      {isOpen && (
        <ShortsModalContent
          initialFilmId={filmId}
          filmTitle={filmTitle}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

export default function ShortsModal({ filmId, filmTitle }: ShortsModalProps) {
  return <ShortsButton filmId={filmId} filmTitle={filmTitle} variant="detail" />
}
