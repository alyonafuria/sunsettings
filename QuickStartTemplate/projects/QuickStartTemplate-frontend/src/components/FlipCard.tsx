import React, { useState } from 'react'

interface FlipCardProps {
  isVisible: boolean
  location: string
}

const FlipCard: React.FC<FlipCardProps> = ({ isVisible, location }) => {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  // Generate random probability based on location (mock logic)
  const getProbability = () => {
    const seed = location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const probability = 70 + (seed % 25) // Range: 70-95%
    return probability
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="perspective-1000 w-full h-48 mx-auto animate-fade-in-up animation-delay-600">
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={handleFlip}
      >
        {/* Front Side - Probability */}
        <div className="absolute w-full h-full backface-hidden">
          <div className="w-full h-full bg-gradient-to-br from-yellow-400/90 via-orange-500/90 to-pink-500/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 flex flex-col justify-center items-center border border-white/30">
            <div className="text-white text-center">
              <div className="text-sm font-medium mb-2 opacity-90">Today in {location}</div>
              <div className="text-3xl font-bold mb-3">Sunset Quality</div>
              <div className="relative">
                <div className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-100">
                  {getProbability()}%
                </div>
                <div className="absolute -top-2 -right-8 animate-pulse">
                  <svg className="w-12 h-12 text-yellow-200/70" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.591a.75.75 0 101.06 1.06l1.591-1.591zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.591-1.591a.75.75 0 10-1.06 1.06l1.591 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.591a.75.75 0 001.06 1.06l1.591-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06L6.166 5.106a.75.75 0 00-1.06 1.06l1.591 1.591z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Side - Sunset Information */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <div className="w-full h-full bg-gradient-to-br from-purple-500/90 via-pink-500/90 to-orange-500/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 flex flex-col justify-center border border-white/30">
            <div className="text-white">
              <p className="text-sm leading-relaxed opacity-95">
                The golden hour approaches with perfect conditions. Clear skies and scattered clouds create an ideal canvas for nature's
                daily masterpiece.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FlipCard
