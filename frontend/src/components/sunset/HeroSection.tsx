import React, { Suspense, useEffect, useRef, useState } from 'react'
import { useMapContext } from '../../contexts/MapContext'
import { useLocation } from '../../hooks/useLocation'
import { useWeather } from '../../hooks/useWeather'
import { PreviousResult } from '../../interfaces/sunset'
import { createSunsetAIService } from '../../utils/sunsetAIService'
import LocationSelector from './LocationSelector'
import OnboardingModal from '../../components/onboarding/OnboardingModal'
import PhotoUpload from '../sunset/PhotoUpload'
const MapFullScreen = React.lazy(() => import('./MapFullScreen'))

interface HeroSectionProps {}

const HeroSection: React.FC<HeroSectionProps> = () => {
  // Location logic extracted to custom hook
  const {
    location,
    coords,
    isLoadingLocation,
    showLocationDropdown,
    customLocation,
    hasLocationBeenSet,
    setLocation,
    setShowLocationDropdown,
    setCustomLocation,
    getUserLocation,
    handleLocationSelect,
    handleCustomLocationSubmit,
    geocodeLocation,
  } = useLocation()

  // Weather logic extracted to custom hook
  const { weatherSummary, fetchHourlyWeather } = useWeather()

  // Map context
  const { isMapOpen, openMap, closeMap } = useMapContext()

  // Other state variables remain the same
  const [sunsetProbability, setSunsetProbability] = useState<number | null>(null)
  const [sunsetDescription, setSunsetDescription] = useState<string>('')
  const [sunsetLoading, setSunsetLoading] = useState(false)
  const [sunsetError, setSunsetError] = useState<string | null>(null)

  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const openUpload = () => setIsUploadOpen(true)
  const closeUpload = () => setIsUploadOpen(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousResultRef = useRef<PreviousResult | null>(null)
  const sunsetAIService = createSunsetAIService()

  // Sunset data fetch
  const fetchSunsetData = async (loc: string, force = false) => {
    if (!sunsetAIService || !loc) return

    setSunsetLoading(true)
    setSunsetError(null)
    if (force) {
      setSunsetProbability(null)
      setSunsetDescription('')
    }

    // Ensure we have coords; if missing attempt geocode
    let activeCoords = coords
    if (!activeCoords) {
      const geo = await geocodeLocation(loc)
      if (geo) {
        activeCoords = geo
        // Note: coords are managed by useLocation hook, no need to set them here
      }
    }

    // Weather summary (only if coords)
    let wxSummary = ''
    if (activeCoords) {
      wxSummary = await fetchHourlyWeather(activeCoords.lat, activeCoords.lon)
    } else {
      wxSummary = 'No coordinates available; cannot fetch weather.'
    }

    try {
      const seed1 = Math.random().toString(36).slice(2, 10)
      let result = await sunsetAIService.analyzeSunset({
        location: loc,
        weatherSummary: wxSummary,
        seed: seed1,
      })

      let prob = sunsetAIService.normalizeProbability(result.probability)

      const prev = previousResultRef.current
      const needsRetry = sunsetAIService.shouldRetry(prob, prev, loc)

      if (needsRetry) {
        try {
          const seed2 = Math.random().toString(36).slice(2, 10)
          const retryResult = await sunsetAIService.analyzeSunset({
            location: loc,
            weatherSummary: wxSummary,
            seed: seed2,
          })
          const retryProb = sunsetAIService.normalizeProbability(retryResult.probability)
          // Use retry if it yields a different or non-75 value
          if (retryProb !== null && (retryProb !== prob || retryProb !== 75)) {
            result = retryResult
            prob = retryProb
          }
        } catch {
          // Continue with original result if retry fails
        }
      }

      if (prob === null || prob === 75) {
        prob = sunsetAIService.generateFallbackProbability(loc, wxSummary)
        if (!result.description || typeof result.description !== 'string') {
          result.description = 'Estimated locally from weather context.'
        }
        // eslint-disable-next-line no-console
        console.debug('[SunsetAI fallback probability]', prob)
      }

      setSunsetProbability(prob)
      setSunsetDescription(typeof result.description === 'string' ? result.description.slice(0, 160) : 'No description')
      previousResultRef.current = { location: loc, probability: prob }
    } catch (e: any) {
      setSunsetError(e.message || 'Fetch failed')
      if (!sunsetDescription) setSunsetDescription('No description')
    } finally {
      setSunsetLoading(false)
    }
  }

  const handleOpenMap = async () => {
    // Always force a fresh fetch when opening map if location changed or no data yet
    await fetchSunsetData(location, true)
    openMap()
  }

  // Prefetch map chunk on intent (hover/focus)
  const prefetchMapChunk = () => {
    // Dynamic import to warm the cache without rendering
    import('./MapFullScreen')
  }

  // Reset & debounce fetch when location changes (after user selection)
  useEffect(() => {
    if (!hasLocationBeenSet || !location) return
    setSunsetProbability(null)
    setSunsetDescription('')
    setSunsetError(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchSunsetData(location, true)
    }, 400)
  }, [location, hasLocationBeenSet]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup debounce on unmount to avoid state updates after unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Onboarding Modal */}
      <OnboardingModal openByDefault onOpenUpload={openUpload} />
      {/* Gradient / background layers */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 animate-gradient-shift rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/40 via-pink-500/30 to-yellow-400/40 animate-gradient-drift rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/20 to-purple-900/30 rounded-full" />
      </div>

      {/* Sunset orb effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-orange-400 to-red-500 blur-3xl opacity-60 animate-pulse-slow" />
        <div className="absolute inset-8 rounded-full bg-gradient-to-br from-yellow-200 via-orange-300 to-pink-400 blur-2xl opacity-70" />
      </div>

      {/* Content */}
      <div className="flex h-screen max-w-md w-full mx-auto relative z-10 items-center justify-center px-6">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in-up">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-700 via-red-500 to-purple-900">
              Calculate Sunset Beauty
            </span>
          </h1>

          {/* Location selector */}
          <LocationSelector
            location={location}
            isLoadingLocation={isLoadingLocation}
            showLocationDropdown={showLocationDropdown}
            customLocation={customLocation}
            setShowLocationDropdown={setShowLocationDropdown}
            setCustomLocation={setCustomLocation}
            getUserLocation={getUserLocation}
            handleLocationSelect={handleLocationSelect}
            handleCustomLocationSubmit={handleCustomLocationSubmit}
          />

          {/* Open Map Button - Only show when location is set */}
          {hasLocationBeenSet && location && (
            <div className="mb-6">
              <button
                onClick={handleOpenMap}
                onMouseEnter={prefetchMapChunk}
                onFocus={prefetchMapChunk}
                disabled={sunsetLoading || !sunsetAIService}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-md rounded-full text-white border border-white/30 hover:from-purple-600/90 hover:to-pink-600/90 hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {sunsetLoading ? <span className="loading loading-spinner loading-sm" /> : 'What are my chances?'}
              </button>
              {sunsetError && <p className="text-xs text-red-200 mt-2">{sunsetError}</p>}
              {!sunsetAIService && <p className="text-xs text-red-200 mt-2">VITE_OPENAI_API_KEY missing</p>}
            </div>
          )}

          {/* Map Modal */}
          {isMapOpen && (
            <Suspense
              fallback={
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                  <div className="text-white text-sm">Loading map…</div>
                </div>
              }
            >
              <MapFullScreen
                open={true}
                onClose={closeMap}
                location={location}
                center={coords ? [coords.lon, coords.lat] : undefined}
                probability={sunsetProbability}
                description={sunsetDescription}
                loading={sunsetLoading}
                error={sunsetError || undefined}
                onRefresh={() => fetchSunsetData(location, true)}
              />
            </Suspense>
          )}
           <PhotoUpload
            open={isUploadOpen}
            onClose={closeUpload}
            onUploaded={() => { closeUpload()
        }}
      />
          {/* Optional tiny debug for weather (comment out if not needed) */}
          {/* <div className="mt-4 text-[10px] text-white/60 whitespace-pre-wrap">{weatherSummary}</div> */}
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-24" viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path d="M0,50 C360,100 720,0 1440,50 L1440,100 L0,100 Z" fill="rgba(255,255,255,0.1)" />
        </svg>
      </div>
    </div>
  )
}

export default HeroSection
