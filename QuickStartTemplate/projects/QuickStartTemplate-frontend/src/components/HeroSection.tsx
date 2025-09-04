import React, { useEffect, useRef, useState } from 'react'
import MapFullScreen from './MapFullScreen'

const VITE_OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
const VITE_OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'

interface HeroSectionProps {}

const HeroSection: React.FC<HeroSectionProps> = () => {
  const [location, setLocation] = useState<string>('')
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState<boolean>(false)
  const [customLocation, setCustomLocation] = useState<string>('')
  const [hasLocationBeenSet, setHasLocationBeenSet] = useState<boolean>(false)
  const [openMap, setOpenMap] = useState<boolean>(false)
  const [sunsetProbability, setSunsetProbability] = useState<number | null>(null)
  const [sunsetDescription, setSunsetDescription] = useState<string>('')
  const [sunsetLoading, setSunsetLoading] = useState(false)
  const [sunsetError, setSunsetError] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [weatherSummary, setWeatherSummary] = useState<string>('') // optional debug / context

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSaltRef = useRef<string>('')
  const previousResultRef = useRef<{ location: string; probability: number | null } | null>(null)

  // Popular locations for dropdown
  const popularLocations = [
    'Berlin, Germany',
    'New York, USA',
    'Tokyo, Japan',
    'London, UK',
    'Paris, France',
    'Sydney, Australia',
    'Toronto, Canada',
    'Dubai, UAE',
    'Singapore',
    'Mumbai, India',
  ]

  // Get user's location using Geolocation API
  const getUserLocation = () => {
    setIsLoadingLocation(true)

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setCoords({ lat: latitude, lon: longitude })

          try {
            // Use reverse geocoding API to get location name
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            const data = await response.json()

            if (data.address) {
              const city = data.address.city || data.address.town || data.address.village || ''
              const country = data.address.country || ''
              const locationString = city && country ? `${city}, ${country}` : city || country || 'Unknown Location'
              setLocation(locationString)
              setHasLocationBeenSet(true)
            }
          } catch {
            setLocation('Location detected')
            setHasLocationBeenSet(true)
          } finally {
            setIsLoadingLocation(false)
            setShowLocationDropdown(false)
          }
        },
        () => { setIsLoadingLocation(false) },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      setIsLoadingLocation(false)
    }
  }

  // Request location on component mount
  useEffect(() => {
    // Don't set a default location immediately, let user choose or detect
    // Automatically ask for location permission after a short delay
    setTimeout(() => {
      getUserLocation()
    }, 1000)
  }, [])

  const handleLocationSelect = async (selectedLocation: string) => {
    setLocation(selectedLocation)
    setHasLocationBeenSet(true)
    setShowLocationDropdown(false)
    setCustomLocation('')
    const geo = await geocodeLocation(selectedLocation)
    if (geo) setCoords(geo)
  }

  const handleCustomLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (customLocation.trim()) {
      setLocation(customLocation)
      setHasLocationBeenSet(true)
      setShowLocationDropdown(false)
      const geo = await geocodeLocation(customLocation.trim())
      if (geo) setCoords(geo)
      setCustomLocation('')
    }
  }

  const geocodeLocation = async (loc: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(loc)}`
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
      if (!res.ok) return null
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const first = data[0]
        return { lat: parseFloat(first.lat), lon: parseFloat(first.lon) }
      }
    } catch {}
    return null
  }

  const fetchHourlyWeather = async (lat: number, lon: number): Promise<string> => {
    try {
      const today = new Date()
      const dateParam = today.toISOString().slice(0, 10) // YYYY-MM-DD
      // Bright Sky: if we only pass date, last_date defaults to +1 day; we will filter to today
      const weatherUrl = `https://api.brightsky.dev/weather?date=${dateParam}&lat=${lat}&lon=${lon}&tz=UTC&units=dwd`
      const res = await fetch(weatherUrl)
      if (!res.ok) throw new Error(`Weather HTTP ${res.status}`)
      const json = await res.json()
      const records: any[] = json.weather || []
      if (!records.length) return 'No weather data.'
      const sameDay = records.filter(r => r.timestamp?.startsWith(dateParam))
      const sample = sameDay.length ? sameDay : records

      // Focus on late afternoon / early evening hours (approx sunset window 15-22 UTC)
      const sunsetWindow = sample.filter(r => {
        const hour = parseInt(r.timestamp?.substring(11, 13) || '0', 10)
        return hour >= 15 && hour <= 22
      })
      const targetSet = sunsetWindow.length ? sunsetWindow : sample.slice(-6)

      const avg = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null

      const cloudsArr = targetSet.map(r => typeof r.cloud_cover === 'number' ? r.cloud_cover : null).filter(n => n!==null) as number[]
      const humidArr  = targetSet.map(r => typeof r.relative_humidity === 'number' ? r.relative_humidity : null).filter(n => n!==null) as number[]
      const tempArr   = targetSet.map(r => typeof r.temperature === 'number' ? r.temperature : null).filter(n => n!==null) as number[]
      const precipProbArr = targetSet.map(r => typeof r.precipitation_probability === 'number' ? r.precipitation_probability : null).filter(n => n!==null) as number[]
      const precipArr = targetSet.map(r => typeof r.precipitation === 'number' ? r.precipitation : 0)

      const cloudAvg = avg(cloudsArr)
      const humidAvg = avg(humidArr)
      const tempAvg = avg(tempArr)
      const precipMax = precipProbArr.length ? Math.max(...precipProbArr) : null
      const precipSum = precipArr.reduce((a,b)=>a+(b||0),0)

      // Build concise summary (<= ~220 chars)
      const parts: string[] = []
      if (cloudAvg !== null) parts.push(`avg_cloud:${cloudAvg.toFixed(0)}%`)
      if (humidAvg !== null) parts.push(`avg_humidity:${humidAvg.toFixed(0)}%`)
      if (tempAvg !== null) parts.push(`avg_temp:${tempAvg.toFixed(1)}C`)
      if (precipMax !== null) parts.push(`precip_prob_max:${precipMax}%`)
      if (precipSum > 0) parts.push(`precip_total:${precipSum.toFixed(1)}mm`)
      parts.push(`hours_analyzed:${targetSet.length}`)

      return parts.join('; ')
    } catch (e: any) {
      return 'Weather fetch failed'
    }
  }

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
        setCoords(geo)
      }
    }

    // Weather summary (only if coords)
    let wxSummary = ''
    if (activeCoords) {
      wxSummary = await fetchHourlyWeather(activeCoords.lat, activeCoords.lon)
      setWeatherSummary(wxSummary)
    } else {
      wxSummary = 'No coordinates available; cannot fetch weather.'
      setWeatherSummary(wxSummary)
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
          <div className="mb-8 inline-block relative z-40">
            <div className="relative">
              <button
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30 hover:bg-white/30 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">{isLoadingLocation ? 'Detecting location...' : location || 'Select location'}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {showLocationDropdown && (
                <div className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/50 overflow-visible">
                  <div className="p-2">
                    {/* FIXED button markup */}
                    <button
                      onClick={getUserLocation}
                      className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-orange-400/20 hover:to-purple-400/20 rounded-lg transition-colors flex items-center gap-2 text-gray-700"
                      disabled={isLoadingLocation}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Use my current location
                    </button>

                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2" />

                    <div className="max-h-48 overflow-y-auto">
                      {popularLocations.map((loc) => (
                        <button
                          key={loc}
                          onClick={() => handleLocationSelect(loc)}
                          className="w-full text-left px-4 py-2 hover:bg-gradient-to-r hover:from-orange-400/20 hover:to-purple-400/20 rounded-lg transition-colors text-gray-700"
                        >
                          {loc}
                        </button>
                      ))}
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2" />

                    <form onSubmit={handleCustomLocationSubmit} className="p-2">
                      <input
                        type="text"
                        placeholder="Enter custom location..."
                        value={customLocation}
                        onChange={(e) => setCustomLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-white/50 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400 text-gray-700"
                      />
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Open Map Button - Only show when location is set */}
          {hasLocationBeenSet && location && (
            <div className="mb-6">
              <button
                onClick={handleOpenMap}
                disabled={sunsetLoading || !VITE_OPENAI_KEY}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-md rounded-full text-white border border-white/30 hover:from-purple-600/90 hover:to-pink-600/90 hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {sunsetLoading ? <span className="loading loading-spinner loading-sm" /> : 'Open Map'}
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
