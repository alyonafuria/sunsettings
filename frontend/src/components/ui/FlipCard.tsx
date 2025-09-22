import React, { useEffect, useState } from 'react'

interface FlipCardProps {
  isVisible: boolean
  location: string
  probability?: number | null
  description?: string
  loading?: boolean
  error?: string | null
}

const FlipCard: React.FC<FlipCardProps> = ({ isVisible, location, probability, description, loading, error }) => {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const [date, setDate] = useState(new Date())

  const formattedDate = date.toLocaleDateString("de-DE")
  // Log when probability changes (debug)
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('[FlipCard] probability update:', probability)
  }, [probability])

  if (!isVisible) return null

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event from bubbling up to parent elements
    if (loading) return
    if (isClosed) {
      setIsClosed(false)
      return
    }
    setIsFlipped((f) => !f)
  }

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsClosed(true)
    setIsFlipped(false)
  }

  // ONLY uses prop now
  const shownProb = typeof probability === 'number' ? `${probability}%` : loading ? '...' : '--'

  return (
    <div
      className={`perspective-1000 mx-auto animate-fade-in-up animation-delay-600 transition-all duration-500 ${
        isClosed ? 'w-20 h-12 mb-4' : 'w-full h-48'
      }`}
    >
      <div
        onClick={handleCardClick}
        className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front Side - Probability */}
        <div className="absolute w-full h-full backface-hidden">
          <div className="w-full h-full bg-gradient-to-br from-yellow-400/90 via-orange-500/90 to-pink-500/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 flex flex-col justify-center items-center border border-white/30 relative">
            {/* Close Button */}
            {!isClosed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose(e);
                }}
                className="absolute top-3 right-3 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                aria-label="Close card"
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <div className="text-white text-center">
              {isClosed ? (
                // Simplified view when closed
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-xs font-bold mb-1">Sunset</div>
                  <div className="text-lg font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-100">
                    {shownProb}
                  </div>
                </div>
              ) : (
                // Full view when open
                <>
                  <div className="text-sm font-medium mb-2 opacity-90">Today in {location || '—'}</div>
                  <div className="text-3xl font-bold mb-3">Sunset Quality</div>
                  <div className="relative">
                    <div
                      key={shownProb} /* re-trigger text transition if needed */
                      className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-100 transition-all"
                    >
                      {shownProb}
                    </div>
                    {loading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="loading loading-spinner text-yellow-100" />
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm opacity-70">{loading ? 'Evaluating…' : 'Tap card for details'}</p>
                  {!loading && typeof probability === 'number' && probability === 0 && (
                    <p className="text-[10px] text-red-100 mt-1">No data</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <div className="w-full h-full bg-gradient-to-br from-purple-500/90 via-pink-500/90 to-orange-500/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 flex flex-col justify-center border border-white/30 relative">
            {/* Close Button */}
            {!isClosed && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose(e);
                }}
                className="absolute top-3 right-3 w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
                aria-label="Close card"
              >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <div className="text-white text-sm leading-relaxed opacity-95">
              {isClosed ? (
                // Simplified view when closed
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-xs font-bold mb-1">Details</div>
                  <div className="text-xs opacity-80">Tap to expand</div>
                </div>
              ) : (
                // Full view when open
                <>
                  <div className="mb-3 text-lg font-semibold opacity-95">{formattedDate}</div>
                  {loading && (
                    <div className="flex items-center gap-2 opacity-90">
                      <span className="loading loading-spinner loading-sm" />
                      Fetching description...
                    </div>
                  )}
                  {!loading && error && <span className="text-red-200">{error}</span>}
                  {!loading && !error && (
                    <span>{description && description.trim().length > 0 ? description : 'No description available.'}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FlipCard
