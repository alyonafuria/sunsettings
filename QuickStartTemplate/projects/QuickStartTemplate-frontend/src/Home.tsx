// src/components/Home.tsx
import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'

// Frontend modals
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import NFTmint from './components/NFTmint'
import Tokenmint from './components/Tokenmint'
import PhotoUpload from './components/PhotoUpload'

// Smart contract demo modal (backend app calls)
import AppCalls from './components/AppCalls'
import MapFullScreen from './components/MapFullScreen'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openPaymentModal, setOpenPaymentModal] = useState<boolean>(false)
  const [openMintModal, setOpenMintModal] = useState<boolean>(false)
  const [openTokenModal, setOpenTokenModal] = useState<boolean>(false)
  const [openAppCallsModal, setOpenAppCallsModal] = useState<boolean>(false)
  const [openMap, setOpenMap] = useState<boolean>(false)
  const [openUploadModal, setOpenUploadModal] = useState<boolean>(false)

  const { activeAddress } = useWallet()

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-300 to-emerald-400 flex items-center justify-center px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 text-center max-w-md w-full">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
          Algorand dApp Quick Start (TypeScript)
        </h1>
        <p className="text-gray-600 mb-6">
          Connect your wallet, try a payment, mint an NFT or token, and test smart contract calls on TestNet.
        </p>

        <div className="flex flex-col gap-4">
          <button className="btn btn-primary" onClick={() => setOpenWalletModal(true)}>
            {activeAddress ? 'Wallet Connected' : 'Connect Wallet'}
          </button>

          {activeAddress && (
            <>
              <button className="btn btn-accent" onClick={() => setOpenPaymentModal(true)}>
                Send Payment
              </button>

              <button className="btn btn-secondary" onClick={() => setOpenMintModal(true)}>
                Mint NFT (IPFS metadata)
              </button>

              <button className="btn btn-info" onClick={() => setOpenTokenModal(true)}>
                Create Token (ASA)
              </button>

              <div className="divider my-2" />

              <button className="btn" onClick={() => setOpenAppCallsModal(true)}>
                Contract Interactions Demo
              </button>

              <button className="btn btn-outline" onClick={() => setOpenMap(true)}>
                Open Map
              </button>
              <button className="btn btn-warning" onClick={() => setOpenUploadModal(true)}>
                Upload Photo
              </button>
            </>
          )}
        </div>

        {/* Modals */}
        <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />

        <Transact openModal={openPaymentModal} setModalState={setOpenPaymentModal} />
        <NFTmint openModal={openMintModal} setModalState={setOpenMintModal} />
        <Tokenmint openModal={openTokenModal} setModalState={setOpenTokenModal} />

        <AppCalls openModal={openAppCallsModal} setModalState={setOpenAppCallsModal} />
        <MapFullScreen open={openMap} onClose={() => setOpenMap(false)} />
        <PhotoUpload openModal={openUploadModal} setModalState={setOpenUploadModal} />
      </div>
    </div>
  )
}

export default Home
