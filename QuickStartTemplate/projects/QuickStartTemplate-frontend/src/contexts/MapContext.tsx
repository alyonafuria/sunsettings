import React, { createContext, useContext, useState, ReactNode } from 'react'

interface MapContextType {
  isMapOpen: boolean
  openMap: () => void
  closeMap: () => void
}

const MapContext = createContext<MapContextType | undefined>(undefined)

export const useMapContext = () => {
  const context = useContext(MapContext)
  if (context === undefined) {
    throw new Error('useMapContext must be used within a MapProvider')
  }
  return context
}

interface MapProviderProps {
  children: ReactNode
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const [isMapOpen, setIsMapOpen] = useState(false)

  const openMap = () => setIsMapOpen(true)
  const closeMap = () => setIsMapOpen(false)

  return (
    <MapContext.Provider value={{ isMapOpen, openMap, closeMap }}>
      {children}
    </MapContext.Provider>
  )
}
