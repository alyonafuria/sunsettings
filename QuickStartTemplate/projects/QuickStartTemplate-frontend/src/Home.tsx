// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'

// Components
import HeroSection from './components/HeroSection'

// Frontend modals

// Smart contract demo modal (backend app calls)

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false)
  const [openMintModal, setOpenMintModal] = useState<boolean>(false)
  const [openTokenModal, setOpenTokenModal] = useState<boolean>(false)
  const [openAppCallsModal, setOpenAppCallsModal] = useState<boolean>(false)
  const [openUploadModal, setOpenUploadModal] = useState<boolean>(false)

  const { activeAddress } = useWallet()

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <HeroSection />
    </div>
  )
}

export default Home
