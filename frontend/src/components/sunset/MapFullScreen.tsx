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

// Get environment variables with fallbacks
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || ''

if (!MAPBOX_TOKEN) {
  console.warn('Mapbox token missing. Set VITE_MAPBOX_TOKEN in .env.')
}

if (!PINATA_JWT) {
  console.warn('Pinata JWT token missing. Set VITE_PINATA_JWT in .env to enable photo uploads.')
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
  const [photoMarkers, setPhotoMarkers] = useState<Array<PhotoMarkerData & { count?: number; photos?: PhotoMarkerData[] }>>([]);
  const [allPhotos, setAllPhotos] = useState<PhotoMarkerData[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMarkerData | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);
  const [showPhotoCarousel, setShowPhotoCarousel] = useState<boolean>(false);
  const [photosAtLocation, setPhotosAtLocation] = useState<PhotoMarkerData[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState<boolean>(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // Helper function to check if two coordinates are approximately the same
  const areCoordinatesEqual = (coord1: [number, number], coord2: [number, number], precision = 4): boolean => {
    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;
    const factor = Math.pow(10, precision);
    return (
      Math.round(lng1 * factor) / factor === Math.round(lng2 * factor) / factor &&
      Math.round(lat1 * factor) / factor === Math.round(lat2 * factor) / factor
    );
  };

  // Group photos by location
  const groupPhotosByLocation = (photos: PhotoMarkerData[]): PhotoMarkerData[] => {
    const groups: { [key: string]: PhotoMarkerData & { count: number; photos: PhotoMarkerData[] } } = {};
    
    photos.forEach(photo => {
      const existingGroup = Object.values(groups).find(group => 
        areCoordinatesEqual(group.coordinates, photo.coordinates)
      );
      
      if (existingGroup) {
        existingGroup.count += 1;
        existingGroup.photos.push(photo);
        // Keep the most recent photo as the main one
        if (new Date(photo.timestamp) > new Date(existingGroup.timestamp)) {
          existingGroup.id = photo.id;
          existingGroup.name = photo.name;
          existingGroup.ipfsHash = photo.ipfsHash;
          existingGroup.timestamp = photo.timestamp;
        }
      } else {
        const key = `${photo.coordinates[0]},${photo.coordinates[1]}`;
        groups[key] = {
          ...photo,
          count: 1,
          photos: [photo]
        };
      }
    });
    
    return Object.values(groups);
  };

  // Fetch photos from Pinata when the component mounts
  useEffect(() => {
    const fetchPinnedPhotos = async () => {
      if (!open) return
      
      setIsLoadingPhotos(true)
      setPhotoError(null)
      
      try {
        if (!PINATA_JWT) {
          throw new Error('Pinata JWT token is not configured. Set VITE_PINATA_JWT in .env')
        }
        
        const response = await fetch('https://api.pinata.cloud/data/pinList?status=pinned', {
          headers: {
            'Authorization': `Bearer ${PINATA_JWT}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch photos: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // Transform Pinata response to PhotoMarkerData format
        const markers: PhotoMarkerData[] = data.rows
          .filter((pin: any) => pin.metadata?.keyvalues?.coordinates)
          .map((pin: any) => {
            // Parse coordinates from the metadata
            const [lng, lat] = pin.metadata.keyvalues.coordinates
              .split(',')
              .map((coord: string) => parseFloat(coord.trim()))
              
            return {
              id: pin.ipfs_pin_hash,
              coordinates: [lng, lat] as [number, number],
              ipfsHash: pin.ipfs_pin_hash,
              name: pin.metadata?.name || 'Untitled Photo',
              timestamp: new Date(pin.date_pinned).toISOString()
            }
          });
        
        // Group photos by location and update state
        const groupedMarkers = groupPhotosByLocation(markers);
        setPhotoMarkers(groupedMarkers);
        
        // Store all photos (ungrouped) for the photo viewer
        setAllPhotos(markers);
      } catch (error) {
        console.error('Error fetching photos from Pinata:', error)
        setPhotoError('Failed to load photos. Please try again later.')
      } finally {
        setIsLoadingPhotos(false)
      }
    }
    
    fetchPinnedPhotos()
  }, [open])

  const handlePhotoUploaded = (ipfsHash: string, fileName: string) => {
    // Use the current map center for the new photo
    const [lng, lat] = mapRef.current?.getCenter().toArray() || center || [13.3777194, 52.497989]

    const newMarker: PhotoMarkerData = {
      id: ipfsHash,
      coordinates: [lng, lat],
      ipfsHash,
      name: fileName,
      timestamp: new Date().toISOString(),
    }

    // Add the new photo and regroup all photos
    const updatedPhotos = [...allPhotos, newMarker];
    const groupedMarkers = groupPhotosByLocation(updatedPhotos);
    
    setAllPhotos(updatedPhotos);
    setPhotoMarkers(groupedMarkers);
  }

  const handlePhotoClick = (photoMarker: PhotoMarkerData & { count?: number; photos?: PhotoMarkerData[] }) => {
    if (photoMarker.count && photoMarker.count > 1 && photoMarker.photos) {
      // Show carousel if there are multiple photos at this location
      setPhotosAtLocation(photoMarker.photos);
      setShowPhotoCarousel(true);
      setSelectedPhoto(photoMarker); // Set the main photo as selected
    } else {
      // Show single photo
      setSelectedPhoto(photoMarker);
      setShowPhotoModal(true);
    }
  }

  // Use the photo markers hook with proper typing
  const { clearMarkers, addPhotoMarkers } = usePhotoMarkers(
    photoMarkers as PhotoMarkerData[], 
    handlePhotoClick as (photoMarker: PhotoMarkerData) => void
  )

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
      {/* Header bar
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
      </div> */}

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
          
          {/* Photo loading/error status */}
          {isLoadingPhotos && (
            <div className="w-full p-3 mb-2 text-center text-sm text-blue-600 bg-blue-50 rounded-lg">
              Loading photos...
            </div>
          )}
          {photoError && (
            <div className="w-full p-3 mb-2 text-center text-sm text-red-600 bg-red-50 rounded-lg">
              {photoError}
            </div>
          )}
          
          <div className="mt-4 mb-2 flex justify-center w-full">
            <button 
              className="btn btn-warning rounded-2xl w-full" 
              onClick={() => setOpenUploadModal(true)}
              disabled={isLoadingPhotos}
            >
              {isLoadingPhotos ? 'Loading...' : 'Upload Photo'}
            </button>
          </div>
        </div>
      </div>

      {/* Photo Upload Modal */}
      <PhotoUpload 
        open={openUploadModal}
        onClose={() => setOpenUploadModal(false)}
        onUploaded={handlePhotoUploaded} 
        coordinates={mapRef.current?.getCenter().toArray() as [number, number] || center} 
      />
      
      {/* Photo View Modal */}
      <PhotoModal isOpen={showPhotoModal} photo={selectedPhoto} onClose={() => setShowPhotoModal(false)} />
    </div>
  )
}

export default MapFullScreen
