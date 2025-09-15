import React from 'react'
import { popularLocations } from '../../hooks/useLocation'

interface LocationSelectorProps {
  location: string
  isLoadingLocation: boolean
  showLocationDropdown: boolean
  customLocation: string
  setShowLocationDropdown: (show: boolean) => void
  setCustomLocation: (location: string) => void
  getUserLocation: () => void
  handleLocationSelect: (selectedLocation: string) => Promise<void>
  handleCustomLocationSubmit: (e: React.FormEvent) => Promise<void>
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  location,
  isLoadingLocation,
  showLocationDropdown,
  customLocation,
  setShowLocationDropdown,
  setCustomLocation,
  getUserLocation,
  handleLocationSelect,
  handleCustomLocationSubmit,
}) => {
  return (
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
              {/* Current location button */}
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

              {/* Popular locations */}
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

              {/* Custom location input */}
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
  )
}

export default LocationSelector
