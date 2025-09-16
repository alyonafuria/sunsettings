import mapboxgl from 'mapbox-gl'
import React from 'react'

export interface PhotoMarkerData {
  id: string
  coordinates: [number, number]
  ipfsHash: string
  name: string
  timestamp: string
}

interface PhotoMarkerProps {
  photoMarker: PhotoMarkerData
  onPhotoClick: (photoMarker: PhotoMarkerData) => void
}

/**
 * Creates and manages a single photo marker on the map
 */
export class PhotoMarker {
  private marker: mapboxgl.Marker
  private element: HTMLDivElement
  private photoMarkerData: PhotoMarkerData
  private onPhotoClick: (photoMarker: PhotoMarkerData) => void

  constructor(map: mapboxgl.Map, photoMarkerData: PhotoMarkerData, onPhotoClick: (photoMarker: PhotoMarkerData) => void) {
    this.photoMarkerData = photoMarkerData
    this.onPhotoClick = onPhotoClick
    this.element = this.createMarkerElement()
    this.marker = new mapboxgl.Marker(this.element).setLngLat(photoMarkerData.coordinates).addTo(map)

    this.loadImage()
  }

  private createMarkerElement(): HTMLDivElement {
    const el = document.createElement('div')
    el.className = 'photo-marker'
    el.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 3px solid #ff6b35;
      overflow: hidden;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: width 0.2s, height 0.2s, margin 0.2s;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
    `

    // Create marker with placeholder
    el.innerHTML = '📷'
    el.style.fontSize = '24px'
    el.style.color = '#ff6b35'
    el.style.display = 'flex'
    el.style.alignItems = 'center'
    el.style.justifyContent = 'center'

    // Add hover effects
    el.addEventListener('mouseenter', () => {
      el.style.width = '66px'
      el.style.height = '66px'
      el.style.marginLeft = '-3px'
      el.style.marginTop = '-3px'
    })

    el.addEventListener('mouseleave', () => {
      el.style.width = '60px'
      el.style.height = '60px'
      el.style.marginLeft = '0px'
      el.style.marginTop = '0px'
    })

    // Add click handler
    el.addEventListener('click', () => {
      this.onPhotoClick(this.photoMarkerData)
    })

    return el
  }

  private loadImage(): void {
    const img = document.createElement('img')
    img.src = `https://tan-mad-gorilla-689.mypinata.cloud/ipfs/${this.photoMarkerData.ipfsHash}`
    img.alt = this.photoMarkerData.name
    img.style.width = '100%'
    img.style.height = '100%'
    img.style.objectFit = 'cover'

    img.onload = () => {
      // Replace placeholder with image after it's loaded
      this.element.innerHTML = ''
      this.element.appendChild(img)
    }

    img.onerror = () => {
      console.error('Failed to load image:', img.src)
      // Keep the placeholder if image fails to load
    }
  }

  /**
   * Removes the marker from the map
   */
  public remove(): void {
    this.marker.remove()
  }

  /**
   * Gets the marker data
   */
  public getData(): PhotoMarkerData {
    return this.photoMarkerData
  }
}

/**
 * Hook for managing photo markers on the map
 */
export const usePhotoMarkers = (photoMarkers: PhotoMarkerData[], onPhotoClick: (photoMarker: PhotoMarkerData) => void) => {
  const markersRef = React.useRef<PhotoMarker[]>([])

  const clearMarkers = React.useCallback(() => {
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []
  }, [])

  const addPhotoMarkers = React.useCallback(
    (map: mapboxgl.Map) => {
      if (!map) return

      console.log('Adding photo markers:', photoMarkers.length)
      clearMarkers()

      photoMarkers.forEach((photoMarker) => {
        console.log('Creating marker for:', photoMarker)
        const marker = new PhotoMarker(map, photoMarker, onPhotoClick)
        markersRef.current.push(marker)
      })
    },
    [photoMarkers, onPhotoClick, clearMarkers],
  )

  return {
    clearMarkers,
    addPhotoMarkers,
  }
}
