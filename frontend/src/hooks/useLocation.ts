import { useState, useEffect } from 'react'

interface LocationCoords {
  lat: number
  lon: number
}

interface UseLocationReturn {
  location: string
  coords: LocationCoords | null
  isLoadingLocation: boolean
  showLocationDropdown: boolean
  customLocation: string
  hasLocationBeenSet: boolean
  setLocation: (location: string) => void
  setShowLocationDropdown: (show: boolean) => void
  setCustomLocation: (location: string) => void
  getUserLocation: () => void
  handleLocationSelect: (selectedLocation: string) => Promise<void>
  handleCustomLocationSubmit: (e: React.FormEvent) => Promise<void>
  geocodeLocation: (loc: string) => Promise<LocationCoords | null>
}

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

export const useLocation = (): UseLocationReturn => {
  const [location, setLocation] = useState<string>('')
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false)
  const [showLocationDropdown, setShowLocationDropdown] = useState<boolean>(false)
  const [customLocation, setCustomLocation] = useState<string>('')
  const [hasLocationBeenSet, setHasLocationBeenSet] = useState<boolean>(false)
  const [coords, setCoords] = useState<LocationCoords | null>(null)

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

  const geocodeLocation = async (loc: string): Promise<LocationCoords | null> => {
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

  return {
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
  }
}

export { popularLocations }
