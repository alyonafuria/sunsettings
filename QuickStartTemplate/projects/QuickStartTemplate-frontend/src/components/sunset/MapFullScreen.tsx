import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import React, { useEffect, useRef, useState } from 'react'
import { applyHighContrastBW } from '../../utils/mapStyles'
import FlipCard from '../ui/FlipCard'
import { PhotoMarkerData, usePhotoMarkers } from './PhotoMarker'
import PhotoModal from './PhotoPopup'
import PhotoUpload from './PhotoUpload'

// Using PhotoMarkerData from the PhotoMarker component

interface MapFullScreenProps {
  open: boolean
  onClose: () => void
  center?: [number, number] // lng, lat
  location: string
  probability?: number | null
  description?: string
  loading?: boolean
  error?: string
  onRefresh?: () => void
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''
if (!MAPBOX_TOKEN) {
  // eslint-disable-next-line no-console
  console.warn('Mapbox token missing. Set VITE_MAPBOX_TOKEN in .env.')
}

mapboxgl.accessToken = MAPBOX_TOKEN

const MapFullScreen: React.FC<MapFullScreenProps> = ({
  open,
  onClose,
  center,
  location,
  probability,
  description,
  loading,
  error,
  onRefresh,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const BASE_BW_STYLE = 'mapbox://styles/mapbox/light-v11'
  const [showCard, setShowCard] = useState(true)
  const locationLabel = center ? `${center[1].toFixed(4)}, ${center[0].toFixed(4)}` : 'Berlin'
  const [openUploadModal, setOpenUploadModal] = useState<boolean>(false)
  const [photoMarkers, setPhotoMarkers] = useState<PhotoMarkerData[]>([
    {
      id: 'test-marker',
      coordinates: [13.377, 52.497],
      ipfsHash: 'bafkreihp52znq3lewre7mmerah5g7tnrmbwrjx4zp3ywmol2e7cjo3gsdi',
      name: 'Test Photo',
      timestamp: new Date().toISOString(),
    },
  ])
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMarkerData | null>(null)
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false)

  const handlePhotoUploaded = (ipfsHash: string, fileName: string) => {
    // TODO remove the hardcoded photo geolocation coordinates later
    const lng = 13.3777194
    const lat = 52.497989

    const newMarker: PhotoMarkerData = {
      id: Date.now().toString(),
      coordinates: [lng, lat],
      ipfsHash,
      name: fileName,
      timestamp: new Date().toISOString(),
    }

    setPhotoMarkers((prev) => [...prev, newMarker])
  }

  const handlePhotoClick = (photoMarker: PhotoMarkerData) => {
    setSelectedPhoto(photoMarker)
    setShowPhotoModal(true)
  }

  // Use the photo markers hook
  const { clearMarkers, addPhotoMarkers } = usePhotoMarkers(photoMarkers, handlePhotoClick)

  const lastCenterRef = useRef<[number, number] | null>(null)

  useEffect(() => {
    if (!open || !mapContainerRef.current) return

    // Remove previous map instance and clear container
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }
    mapContainerRef.current.innerHTML = ''

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: BASE_BW_STYLE,
      center: center || [13.405, 52.52], // use provided center or fallback (Berlin)
      zoom: 10,
    })
    if (center) {
      lastCenterRef.current = center
    }

    mapRef.current.on('style.load', () => {
      applyHighContrastBW(mapRef.current!)
      // Add markers after style loads
      setTimeout(() => addPhotoMarkers(mapRef.current!), 100)
    })
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    return () => {
      clearMarkers()
      mapRef.current?.remove()
      mapRef.current = null
      if (mapContainerRef.current) mapContainerRef.current.innerHTML = ''
    }
  }, [open, center])

  // Effect to add markers when photoMarkers change (for new uploads)
  useEffect(() => {
    if (mapRef.current && photoMarkers.length > 0) {
      addPhotoMarkers(mapRef.current)
    }
  }, [photoMarkers, addPhotoMarkers])

  // NEW effect to fly when center changes after initial load
  useEffect(() => {
    if (!open || !mapRef.current || !center) return
    const prev = lastCenterRef.current
    const changed = !prev || Math.abs(prev[0] - center[0]) > 0.0001 || Math.abs(prev[1] - center[1]) > 0.0001
    if (changed) {
      mapRef.current.flyTo({ center, essential: true, zoom: Math.max(mapRef.current.getZoom(), 10) })
      lastCenterRef.current = center
    }
  }, [center, open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm" role="dialog" aria-modal="true">
      {/* Header bar */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-500/90 via-red-500/90 to-purple-600/90 backdrop-blur-md shadow-lg">
        <h2 className="text-xl font-bold text-white">Sunset Map</h2>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white hover:bg-white/30 transition"
            onClick={() => setShowCard((s) => !s)}
          >
            {showCard ? 'Hide Card' : 'Show Card'}
          </button>
          {onRefresh && (
            <button
              className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white hover:bg-white/30 transition disabled:opacity-40"
              onClick={() => onRefresh()}
              disabled={!!loading}
            >
              {loading ? '...' : 'Refresh'}
            </button>
          )}
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
      </div>

      {/* Floating close button (alternative/additional) */}
      <button
        className="absolute top-40 right-4 z-10 w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-white shadow-lg hover:shadow-xl hover:scale-110 transform transition-all duration-300 flex items-center justify-center"
        onClick={onClose}
        aria-label="Close map"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Map container */}
      <div ref={mapContainerRef} className="flex-1" />

      {/* FlipCard overlay */}
      <div className="pointer-events-none absolute inset-0 flex justify-center items-end p-6 px-4">
        <div className="pointer-events-auto w-full max-w-md flex flex-col items-center">
          <FlipCard
            isVisible={true}
            location={location || 'Unknown'}
            probability={probability} // direct prop
            description={description}
            loading={loading}
            error={error || null}
          />
          <div className="mt-4 mb-2 flex justify-center w-full">
            <button className="btn btn-warning rounded-2xl w-full" onClick={() => setOpenUploadModal(true)}>
              Upload Photo
            </button>
          </div>
          <PhotoUpload openModal={openUploadModal} setModalState={setOpenUploadModal} onPhotoUploaded={handlePhotoUploaded} />
        </div>
      </div>

      {/* Photo Modal */}
      <PhotoModal isOpen={showPhotoModal} photo={selectedPhoto} onClose={() => setShowPhotoModal(false)} />
    </div>
  )
}

export default MapFullScreen
