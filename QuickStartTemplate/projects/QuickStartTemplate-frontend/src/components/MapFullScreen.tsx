import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import React, { useEffect, useRef } from 'react'
import FlipCard from './FlipCard'

interface MapFullScreenProps {
  open: boolean
  onClose: () => void
  location: string
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''
if (!MAPBOX_TOKEN) {
  // eslint-disable-next-line no-console
  console.warn('Mapbox token missing. Set VITE_MAPBOX_TOKEN in .env.')
}

mapboxgl.accessToken = MAPBOX_TOKEN

const MapFullScreen: React.FC<MapFullScreenProps> = ({ open, onClose, location }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!open) return
    if (!mapContainerRef.current) return
    if (mapRef.current) return // already initialized

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.006, 40.7128],
      zoom: 10,
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white backdrop-blur-sm" role="dialog" aria-modal="true">
      {/* Header bar with gradient matching the app theme */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-500/90 via-red-500/90 to-purple-600/90 backdrop-blur-md shadow-lg">
        <h2 className="text-xl font-bold text-white">Sunset Map</h2>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105 transform"
          onClick={onClose}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="font-medium">Close</span>
        </button>
      </div>

      {/* Floating close button (alternative/additional) */}
      <button
        className="absolute right-2 top-40 right-4 z-10 w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-white shadow-lg hover:shadow-xl hover:scale-110 transform transition-all duration-300 flex items-center justify-center"
        onClick={onClose}
        aria-label="Close map"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div ref={mapContainerRef} className="flex-1" />
      <FlipCard isVisible={true} location={location} />
    </div>
  )
}

export default MapFullScreen
