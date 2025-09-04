import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import React, { useEffect, useRef, useState } from 'react'
import FlipCard from './FlipCard'
import PhotoUpload from './PhotoUpload'

interface MapFullScreenProps {
  open: boolean
  onClose: () => void
  center?: [number, number]
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''
if (!MAPBOX_TOKEN) {
  // eslint-disable-next-line no-console
  console.warn('Mapbox token missing. Set VITE_MAPBOX_TOKEN in .env.')
}

mapboxgl.accessToken = MAPBOX_TOKEN

const BASE_BW_STYLE = 'mapbox://styles/mapbox/light-v11'

const MapFullScreen: React.FC<MapFullScreenProps> = ({ open, onClose, center }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [showCard, setShowCard] = useState(true)
  const locationLabel = center ? `${center[1].toFixed(4)}, ${center[0].toFixed(4)}` : 'Berlin'
  const [openUploadModal, setOpenUploadModal] = useState<boolean>(false)

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
      center: center || [13.4050, 52.5200], // Berlin
      zoom: 10,
    })

    const applyHighContrastBW = () => {
      if (!mapRef.current) return
      const map = mapRef.current
      const layers = map.getStyle()?.layers || []

      // Palette
      const LAND = '#ffffff'
      const LAND_ALT = '#f2f2f2'
      const WATER = '#e6e6e6'
      const ROAD_MAIN = '#000000'
      const ROAD_SEC = '#222222'
      const OUTLINE = '#000000'
      const BUILDING = '#d0d0d0'
      const PARK = '#ededed'
      const TEXT = '#000000'
      const ICON = '#111111'

      layers.forEach(l => {
        const { id, type } = l
        try {
          // Background
            if (type === 'background') {
            map.setPaintProperty(id, 'background-color', LAND)
          }

          const idLower = id.toLowerCase()

          // Water
          if (idLower.includes('water')) {
            if (type === 'fill') map.setPaintProperty(id, 'fill-color', WATER)
            if (type === 'line') map.setPaintProperty(id, 'line-color', WATER)
          }

          // Parks / green areas
          if (idLower.includes('park') || idLower.includes('green') || idLower.includes('landuse')) {
            if (type === 'fill') map.setPaintProperty(id, 'fill-color', PARK)
          }

          // Buildings
          if (idLower.includes('building')) {
            if (type === 'fill') {
              map.setPaintProperty(id, 'fill-color', BUILDING)
              map.setPaintProperty(id, 'fill-outline-color', OUTLINE)
            }
          }

          // Roads
          if (idLower.includes('road') || idLower.includes('street') || idLower.includes('highway')) {
            if (type === 'line') {
              const main = idLower.includes('motorway') || idLower.includes('trunk') || idLower.includes('primary')
              map.setPaintProperty(id, 'line-color', main ? ROAD_MAIN : ROAD_SEC)
              // Boost contrast by widening slighty (ignore failures)
              try {
                const currentWidth = map.getPaintProperty(id, 'line-width')
                if (typeof currentWidth === 'number') {
                  map.setPaintProperty(id, 'line-width', Math.max(currentWidth, main ? 2.4 : 1.4))
                } else {
                  map.setPaintProperty(id, 'line-width', main ? 2.4 : 1.4)
                }
              } catch {}
            }
          }

          // Generic fills (landuse etc.)
          if (type === 'fill' && !idLower.includes('water') && !idLower.includes('park') && !idLower.includes('building')) {
            map.setPaintProperty(id, 'fill-color', LAND_ALT)
            try {
              map.setPaintProperty(id, 'fill-outline-color', '#bfbfbf')
            } catch {}
          }

          // Lines not already touched
          if (type === 'line' && !idLower.includes('road') && !idLower.includes('water')) {
            map.setPaintProperty(id, 'line-color', '#4d4d4d')
          }

          // Symbols (labels/icons)
          if (type === 'symbol') {
            try {
              map.setPaintProperty(id, 'text-color', TEXT)
              map.setPaintProperty(id, 'icon-color', ICON)
              map.setPaintProperty(id, 'text-halo-color', '#ffffff')
              map.setPaintProperty(id, 'text-halo-width', 1.2)
              map.setPaintProperty(id, 'text-halo-blur', 0.2)
            } catch {}
          }

          // Circles (POIs)
          if (type === 'circle') {
            map.setPaintProperty(id, 'circle-color', '#111111')
            try {
              map.setPaintProperty(id, 'circle-stroke-color', '#ffffff')
              map.setPaintProperty(id, 'circle-stroke-width', 0.6)
            } catch {}
          }

          // Hillshade
          if (type === 'hillshade') {
            try {
              map.setPaintProperty(id, 'hillshade-shadow-color', '#333333')
              map.setPaintProperty(id, 'hillshade-highlight-color', '#bbbbbb')
            } catch {}
          }

          // Desaturate where possible
          const saturationProps = [
            'fill-saturation',
            'line-saturation',
            'background-saturation',
            'circle-saturation',
            'symbol-saturation'
          ]
          saturationProps.forEach(p => {
            try { map.setPaintProperty(id, p as any, -1) } catch {}
          })
          // Remove hue/brightness variance
          const adjustments = [
            'fill-brightness-min',
            'fill-brightness-max',
            'line-brightness-min',
            'line-brightness-max'
          ]
          adjustments.forEach(p => {
            try { map.setPaintProperty(id, p as any, 0 ) } catch {}
          })
        } catch {}
      })
    }

    mapRef.current.on('style.load', applyHighContrastBW)
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      if (mapContainerRef.current) mapContainerRef.current.innerHTML = ''
    }
  }, [open, center])

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
        className="absolute right-2 top-40 right-4 z-10 w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-white shadow-lg hover:shadow-xl hover:scale-110 transform transition-all duration-300 flex items-center justify-center"
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
      <div className="pointer-events-none absolute inset-0 flex justify-center items-start pt-28 px-4">
        <div className="pointer-events-auto w-full max-w-md">
          <FlipCard isVisible={showCard} location={locationLabel} />
          <div className="mt-4 flex justify-center">
            <button
              className="btn btn-warning w-full"
              onClick={() => setOpenUploadModal(true)}
            >
              Upload Photo
            </button>
          </div>
          <PhotoUpload openModal={openUploadModal} setModalState={setOpenUploadModal} />
        </div>
      </div>
    </div>
  )
}

export default MapFullScreen
