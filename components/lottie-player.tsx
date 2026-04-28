"use client"

import { useEffect, useRef, useState } from "react"
import Lottie from "lottie-react"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"

/**
 * Detects if a file path is a .lottie binary format
 */
function isDotLottie(path: string): boolean {
  return path.toLowerCase().endsWith(".lottie")
}

interface LottiePlayerProps {
  /** Path to lottie file (.json or .lottie - auto-detected) */
  src?: string
  /** @deprecated Use `src` instead - format is auto-detected */
  dotLottieSrc?: string
  /** Whether to loop the animation */
  loop?: boolean
  /** Whether to autoplay */
  autoplay?: boolean
  /** Custom className for the container */
  className?: string
  /** Custom style for the container */
  style?: React.CSSProperties
  /** Callback when animation completes (only for non-looping) */
  onComplete?: () => void
  /** Renderer settings for lottie-react */
  rendererSettings?: {
    preserveAspectRatio?: string
  }
}

/**
 * Unified Lottie player component that handles both .json and .lottie formats.
 * Format is auto-detected based on file extension - just use `src` for any lottie file.
 */
export function LottiePlayer({
  src,
  dotLottieSrc,
  loop = true,
  autoplay = true,
  className,
  style,
  onComplete,
  rendererSettings,
}: LottiePlayerProps) {
  const lottieRef = useRef<any>(null)
  const [animationData, setAnimationData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Determine the actual source and format
  const actualSrc = src || dotLottieSrc
  const isBinaryFormat = actualSrc ? isDotLottie(actualSrc) : false

  // Fetch JSON lottie data (only for .json format)
  useEffect(() => {
    if (!actualSrc || isBinaryFormat) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    fetch(actualSrc)
      .then((res) => res.json())
      .then((data) => {
        setAnimationData(data)
        setIsLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load Lottie animation:", err)
        setIsLoading(false)
      })
  }, [actualSrc, isBinaryFormat])

  // Handle .lottie binary format
  if (actualSrc && isBinaryFormat) {
    return (
      <DotLottieReact
        src={actualSrc}
        loop={loop}
        autoplay={autoplay}
        className={className}
        style={style}
      />
    )
  }

  // Handle .json format
  if (actualSrc && animationData) {
    return (
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        onComplete={onComplete}
        className={className}
        style={style}
        rendererSettings={rendererSettings}
      />
    )
  }

  // Loading or no source provided - return empty container
  return <div className={className} style={style} />
}

interface LottieWithIntroProps {
  /** Path to the intro lottie animation (.json or .lottie - auto-detected) */
  introSrc?: string
  /** Path to the loop lottie animation (.json or .lottie - auto-detected) */
  loopSrc?: string
  /** Custom className */
  className?: string
  /** Custom style */
  style?: React.CSSProperties
  /** Renderer settings */
  rendererSettings?: {
    preserveAspectRatio?: string
  }
  /** Threshold for intersection observer (0-1) */
  threshold?: number
}

/**
 * Lottie player with intro + loop sequence.
 * Plays intro animation once when visible, then transitions to looping animation.
 * Supports both .json and .lottie formats (auto-detected).
 */
export function LottieWithIntro({
  introSrc,
  loopSrc,
  className,
  style,
  rendererSettings,
  threshold = 0.3,
}: LottieWithIntroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lottieRef = useRef<any>(null)
  const dotLottieIntroRef = useRef<any>(null)
  const [introData, setIntroData] = useState<any>(null)
  const [loopData, setLoopData] = useState<any>(null)
  const [introBinary, setIntroBinary] = useState<string | null>(null)
  const [loopBinary, setLoopBinary] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false)
  const [showLoop, setShowLoop] = useState(false)

  // Stable ref so the handleComplete closure always reads current state,
  // regardless of when DotLottieReact registered the onComplete prop.
  const showLoopRef = useRef(showLoop)
  const loopBinaryRef = useRef(loopBinary)
  const loopDataRef = useRef(loopData)
  showLoopRef.current = showLoop
  loopBinaryRef.current = loopBinary
  loopDataRef.current = loopData

  // Determine format and fetch animation data
  useEffect(() => {
    if (introSrc) {
      if (isDotLottie(introSrc)) {
        setIntroBinary(introSrc)
      } else {
        fetch(introSrc)
          .then((res) => res.json())
          .then(setIntroData)
          .catch((err) => console.error("Failed to load intro animation:", err))
      }
    }
    if (loopSrc) {
      if (isDotLottie(loopSrc)) {
        setLoopBinary(loopSrc)
      } else {
        fetch(loopSrc)
          .then((res) => res.json())
          .then(setLoopData)
          .catch((err) => console.error("Failed to load loop animation:", err))
      }
    }
  }, [introSrc, loopSrc])

  // Intersection observer for visibility
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasPlayedIntro) {
            setIsVisible(true)
          }
        })
      },
      { threshold }
    )

    observer.observe(containerRef.current)

    // Check if already visible on mount
    const rect = containerRef.current.getBoundingClientRect()
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0
    if (isInViewport && !hasPlayedIntro) {
      setIsVisible(true)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [hasPlayedIntro, threshold])

  // Play intro when visible
  useEffect(() => {
    if (isVisible && lottieRef.current && !hasPlayedIntro) {
      lottieRef.current.play?.()
      setHasPlayedIntro(true)
    }
  }, [isVisible, hasPlayedIntro])

  const handleComplete = () => {
    if (!showLoopRef.current && (loopDataRef.current || loopBinaryRef.current)) {
      setShowLoop(true)
    }
  }

  const hasIntroJson = !!introSrc && !isDotLottie(introSrc) && !!introData
  const hasIntroBinary = !!introBinary
  const hasLoopJson = !!loopSrc && !isDotLottie(loopSrc) && !!loopData
  const hasLoopBinary = !!loopBinary

  // If only loop provided, just play that
  if (!hasIntroJson && !hasIntroBinary && (hasLoopJson || hasLoopBinary)) {
    return (
      <div ref={containerRef} className={className} style={style}>
        {hasLoopBinary ? (
          <DotLottieReact
            src={loopBinary}
            loop
            autoplay
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <Lottie
            animationData={loopData}
            loop
            autoplay
            style={{ width: "100%", height: "100%" }}
            rendererSettings={rendererSettings}
          />
        )}
      </div>
    )
  }

  // Intro + Loop sequence (both JSON)
  if (hasIntroJson && (hasLoopJson || hasLoopBinary)) {
    return (
      <div ref={containerRef} className={className} style={style}>
        {!showLoop ? (
          <Lottie
            lottieRef={lottieRef}
            animationData={introData}
            loop={false}
            autoplay={false}
            onComplete={handleComplete}
            style={{ width: "100%", height: "100%" }}
            rendererSettings={rendererSettings}
          />
        ) : hasLoopBinary ? (
          <DotLottieReact
            src={loopBinary}
            loop
            autoplay
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <Lottie
            animationData={loopData}
            loop
            autoplay
            style={{ width: "100%", height: "100%" }}
            rendererSettings={rendererSettings}
          />
        )}
      </div>
    )
  }

  // Intro + Loop sequence (intro binary)
  // DotLottieReact v0.13.x does not support onComplete as a prop — register the
  // 'complete' event directly on the player via dotLottieRefCallback instead.
  if (hasIntroBinary && (hasLoopJson || hasLoopBinary)) {
    return (
      <div ref={containerRef} className={className} style={style}>
        {!showLoop ? (
          <DotLottieReact
            src={introBinary!}
            loop={false}
            autoplay={true}
            style={{ width: "100%", height: "100%" }}
            dotLottieRefCallback={(player) => {
              if (!player || dotLottieIntroRef.current === player) return
              dotLottieIntroRef.current = player
              player.addEventListener("complete", handleComplete)
            }}
          />
        ) : hasLoopBinary ? (
          <DotLottieReact
            src={loopBinary}
            loop
            autoplay
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <Lottie
            animationData={loopData}
            loop
            autoplay
            style={{ width: "100%", height: "100%" }}
            rendererSettings={rendererSettings}
          />
        )}
      </div>
    )
  }

  // Loading or no source provided - return empty container
  return <div ref={containerRef} className={className} style={style} />
}