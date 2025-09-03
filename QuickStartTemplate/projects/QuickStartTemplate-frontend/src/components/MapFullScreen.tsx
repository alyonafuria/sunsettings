import React, { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapFullScreenProps {
  open: boolean
  onClose: () => void
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

if (!MAPBOX_TOKEN) {
  // eslint-disable-next-line no-console
  console.warn('Mapbox token missing. Set VITE_MAPBOX_TOKEN in .env.')
}

mapboxgl.accessToken = MAPBOX_TOKEN

const MapFullScreen: React.FC<MapFullScreenProps> = ({ open, onClose }) => {
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
      zoom: 10
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex justify-between items-center p-2 bg-base-100 shadow-md">
        <span className="font-semibold">Map</span>
        <button className="btn btn-sm" onClick={onClose}>
          Close
        </button>
      </div>
      <div ref={mapContainerRef} className="flex-1" />
    </div>
  )
}

export default MapFullScreen
