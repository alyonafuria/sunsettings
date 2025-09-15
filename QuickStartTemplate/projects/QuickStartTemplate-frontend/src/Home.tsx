// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'

// Components
import HeroSection from './components/HeroSection'

// Frontend modals

// Smart contract demo modal (backend app calls)

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {

  const { activeAddress } = useWallet()

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <HeroSection />
    </div>
  )
}

export default Home
