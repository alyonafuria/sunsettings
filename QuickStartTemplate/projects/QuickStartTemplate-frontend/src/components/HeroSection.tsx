import React, { useEffect, useState } from 'react'
import MapFullScreen from './MapFullScreen'

interface HeroSectionProps {}

const HeroSection: React.FC<HeroSectionProps> = () => {
  const [location, setLocation] = useState<string>('')
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState<boolean>(false)
  const [customLocation, setCustomLocation] = useState<string>('')
  const [hasLocationBeenSet, setHasLocationBeenSet] = useState<boolean>(false)
  const [openMap, setOpenMap] = useState<boolean>(false)

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
          } catch (error) {
            console.error('Error fetching location name:', error)
            setLocation('Location detected')
            setHasLocationBeenSet(true)
          } finally {
            setIsLoadingLocation(false)
            setShowLocationDropdown(false)
          }
        },
        (error) => {
          console.error('Error getting location:', error)
          setIsLoadingLocation(false)
        },
      )
    } else {
      console.log('Geolocation is not supported by this browser.')
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

  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation)
    setHasLocationBeenSet(true)
    setShowLocationDropdown(false)
    setCustomLocation('')
  }

  const handleCustomLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (customLocation.trim()) {
      setLocation(customLocation)
      setHasLocationBeenSet(true)
      setShowLocationDropdown(false)
      setCustomLocation('')
    }
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <div className="absolute inset-0 rounded-full">
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
                onClick={() => setOpenMap(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-md rounded-full text-white border border-white/30 hover:from-purple-600/90 hover:to-pink-600/90 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                <span className="font-medium">Open Map</span>
              </button>
            </div>
          )}

          {/* Map Modal */}
          <MapFullScreen open={openMap} onClose={() => setOpenMap(false)} location={location} />
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
