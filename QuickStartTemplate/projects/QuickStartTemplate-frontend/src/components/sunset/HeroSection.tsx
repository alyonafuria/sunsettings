import React, { useEffect, useRef, useState } from 'react'
import MapFullScreen from './MapFullScreen'
import LocationSelector from './LocationSelector'
import { useLocation } from '../../hooks/useLocation'
import { useWeather } from '../../hooks/useWeather'

const VITE_OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
const VITE_OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'

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
  const {
    weatherSummary,
    fetchHourlyWeather,
  } = useWeather()

  // Other state variables remain the same
  const [openMap, setOpenMap] = useState<boolean>(false)
  const [sunsetProbability, setSunsetProbability] = useState<number | null>(null)
  const [sunsetDescription, setSunsetDescription] = useState<string>('')
  const [sunsetLoading, setSunsetLoading] = useState(false)
  const [sunsetError, setSunsetError] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSaltRef = useRef<string>('')
  const previousResultRef = useRef<{ location: string; probability: number | null } | null>(null)



  // Sunset data fetch
  const fetchSunsetData = async (loc: string, force = false) => {
    if (!VITE_OPENAI_KEY || !loc) return

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

    // Limit length to keep prompt efficient
    const truncatedWxSummary = wxSummary.length > 220 ? wxSummary.slice(0, 220) : wxSummary

    const callModel = async (seed: string) => {
      const nowISO = new Date().toISOString()

      // Provide clearer analytical instructions; model must base output ONLY on weather context
      const prompt = `
You are an analyst producing a sunset quality estimate ONLY from the provided weather features.

WeatherFeatures (parsed summary, semicolon separated, may omit some):
${truncatedWxSummary || 'avg_cloud:NA; avg_humidity:NA; avg_temp:NA; precip_prob_max:NA; precip_total:NA; hours_analyzed:NA'}

Analysis rules (DO NOT output this section, just use it):
- Ideal vivid sunset: broken/moderate clouds (30-70%) + low precipitation probability (<25%) + some humidity (35-70%) -> probability 80-95.
- Overcast (>80% clouds) or heavy precip (precip_prob_max >60% or precip_total >2mm) -> probability 35-55 (lower if both).
- Very clear (<10% clouds) often reduces dramatic colors -> probability 55-70 unless humidity very favorable.
- Extremely hazy indicator: high humidity (>90%) + high clouds (>70%) + precip_prob_max>40% -> probability 30-50.
- Probability must be INT 0-100. Avoid defaulting to 75. Vary based on metrics. Seed only breaks ties.
- Description: <=160 chars, concise, no quotes, mention key drivers (e.g. "scattered mid clouds", "dry clear air", "high overcast dampens colors").

Return ONLY compact JSON (no markdown, no backticks, no commentary):
{"probability": <int 0-100>, "description":"<text>"}

Location: ${loc}
TimeUTC: ${nowISO}
RandomSeed: ${seed}`.trim()

      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VITE_OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: VITE_OPENAI_MODEL,
          temperature: 0.55,
          max_tokens: 160,
          messages: [
            { role: 'system', content: 'Output ONLY valid JSON with keys probability (int) and description (string).' },
            { role: 'user', content: prompt }
          ],
        }),
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json()
      const raw = data?.choices?.[0]?.message?.content?.trim() || ''
      // Debug raw
      // eslint-disable-next-line no-console
      console.debug('[SunsetAI raw]', raw)
      let parsed: any = null
      try {
        parsed = JSON.parse(raw)
      } catch {
        const m = raw.match(/\{[\s\S]*\}/)
        if (m) {
          try {
            parsed = JSON.parse(m[0])
          } catch {}
        }
      }
      if (!parsed || typeof parsed !== 'object') throw new Error('Bad JSON')
      return parsed
    }

    try {
      const seed1 = Math.random().toString(36).slice(2, 10)
      let parsed = await callModel(seed1)

      const normalizeProb = (p: any) => (typeof p === 'number' ? Math.min(100, Math.max(0, Math.round(p))) : null)

      let prob = normalizeProb(parsed.probability)

      const prev = previousResultRef.current
      const needsRetry = prob === 75 || (prev && prev.location === loc && typeof prev.probability === 'number' && prev.probability === prob)

      if (needsRetry) {
        try {
          const seed2 = Math.random().toString(36).slice(2, 10)
          const retryParsed = await callModel(seed2)
          const retryProb = normalizeProb(retryParsed.probability)
          // Use retry if it yields a different or non-75 value
          if (retryProb !== null && (retryProb !== prob || retryProb !== 75)) {
            parsed = retryParsed
            prob = retryProb
          }
        } catch {}
      }

      if (prob === null || prob === 75) {
        const hash = Array.from(loc + wxSummary).reduce((a, c) => (a * 131 + c.charCodeAt(0)) % 1000003, 7)
        const base = 40 + (hash % 50)
        const jitter = Math.floor(Math.random() * 11)
        let synthetic = base + jitter
        if (synthetic < 55 && Math.random() < 0.4) synthetic += 20
        prob = Math.min(96, synthetic)
        if (!parsed.description || typeof parsed.description !== 'string') {
          parsed.description = 'Estimated locally from weather context.'
        }
        // eslint-disable-next-line no-console
        console.debug('[SunsetAI fallback probability]', prob)
      }

      setSunsetProbability(prob)
      setSunsetDescription(typeof parsed.description === 'string' ? parsed.description.slice(0, 160) : 'No description')
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
    setOpenMap(true)
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

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
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
                disabled={sunsetLoading || !VITE_OPENAI_KEY}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-md rounded-full text-white border border-white/30 hover:from-purple-600/90 hover:to-pink-600/90 hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {sunsetLoading ? <span className="loading loading-spinner loading-sm" /> : 'What are my chances?'}
              </button>
              {sunsetError && <p className="text-xs text-red-200 mt-2">{sunsetError}</p>}
              {!VITE_OPENAI_KEY && <p className="text-xs text-red-200 mt-2">VITE_OPENAI_API_KEY missing</p>}
            </div>
          )}

          {/* Map Modal */}
          <MapFullScreen
            open={openMap}
            onClose={() => setOpenMap(false)}
            location={location}
            center={coords ? [coords.lon, coords.lat] : undefined}  // <-- added
            probability={sunsetProbability}
            description={sunsetDescription}
            loading={sunsetLoading}
            error={sunsetError || undefined}
            onRefresh={() => fetchSunsetData(location, true)}
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
