import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@txnlab/use-wallet-react'
import ConnectWallet from './ConnectWallet'

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openWalletModal, setOpenWalletModal] = useState(false)
  const navigate = useNavigate()
  const { activeAddress } = useWallet()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleConnectWallet = () => {
    setOpenWalletModal(true)
    setIsMobileMenuOpen(false)
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-400/90 via-red-500/90 to-purple-600/90 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-pink-200">
                  SunsetDApp
                </span>
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => handleNavigation('/leaderboard')}
                className="px-6 py-2 text-white font-medium hover:bg-white/20 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/30"
              >
                Leaderboard
              </button>
              
              <button
                onClick={() => handleNavigation('/map')}
                className="px-6 py-2 text-white font-medium hover:bg-white/20 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/30"
              >
                Map
              </button>

              <button
                onClick={handleConnectWallet}
                className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-medium rounded-full hover:shadow-lg hover:scale-105 transform transition-all duration-300"
              >
                {activeAddress ? 
                  `${activeAddress.substring(0, 6)}...${activeAddress.substring(activeAddress.length - 4)}` 
                  : 'Connect Wallet'
                }
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5"
              aria-label="Toggle menu"
            >
              <span 
                className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span 
                className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                  isMobileMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <span 
                className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </button>
          </div>

          {/* Mobile Menu */}
          <div 
            className={`md:hidden transition-all duration-300 overflow-hidden ${
              isMobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <nav className="flex flex-col space-y-2 py-4">
              <button
                onClick={() => handleNavigation('/leaderboard')}
                className="px-6 py-3 text-white font-medium hover:bg-white/20 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/30 text-left"
              >
                Leaderboard
              </button>
              
              <button
                onClick={() => handleNavigation('/map')}
                className="px-6 py-3 text-white font-medium hover:bg-white/20 rounded-full transition-all duration-300 backdrop-blur-sm border border-white/30 text-left"
              >
                Map
              </button>

              <button
                onClick={handleConnectWallet}
                className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-medium rounded-full hover:shadow-lg transform transition-all duration-300"
              >
                {activeAddress ? 
                  `${activeAddress.substring(0, 6)}...${activeAddress.substring(activeAddress.length - 4)}` 
                  : 'Connect Wallet'
                }
              </button>
            </nav>
          </div>
        </div>

        {/* Gradient border at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-yellow-400/50 via-orange-400/50 to-purple-500/50" />
      </header>

      {/* Connect Wallet Modal */}
      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />
    </>
  )
}

export default Header