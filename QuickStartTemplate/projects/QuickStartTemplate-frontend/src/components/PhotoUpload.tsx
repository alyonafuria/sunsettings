import React, { useCallback, useState, useEffect } from 'react'

interface PhotoUploadProps {
  openModal: boolean
  setModalState: (open: boolean) => void
  onPhotoUploaded?: (ipfsHash: string, fileName: string) => void
}

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT as string | undefined
// Optional: allow api key/secret (less secure on frontend)
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY as string | undefined
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET as string | undefined

const PhotoUpload: React.FC<PhotoUploadProps> = ({ openModal, setModalState, onPhotoUploaded }) => {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<string>('')
  const [cid, setCid] = useState<string>('')
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [showUploaded, setShowUploaded] = useState<boolean>(false)
  const [uploading, setUploading] = useState<boolean>(false)
  const [imageLoaded, setImageLoaded] = useState<boolean>(false)

  const close = useCallback(() => {
    setModalState(false)
    setFile(null)
    setStatus('')
    setCid('')
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    setShowUploaded(false)
  }, [setModalState, previewUrl])

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    setFile(f || null)
    setCid('')
    setStatus(f ? `Selected: ${f.name}` : '')
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    if (f) {
      setPreviewUrl(URL.createObjectURL(f))
      setShowUploaded(false)
    } else {
      setPreviewUrl('')
    }
    setImageLoaded(false)
  }

  const upload = async () => {
    if (!file) {
      setStatus('Select a file first.')
      return
    }
    if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_API_SECRET)) {
      setStatus('Missing Pinata credentials. Add VITE_PINATA_JWT or key/secret.')
      return
    }
    try {
      setUploading(true)
      setStatus('Uploading...')
      const formData = new FormData()
      formData.append('file', file)

      // Optional metadata
      const metadata = {
        name: file.name,
        keyvalues: { app: 'quickstart', type: 'photo' }
      }
      formData.append('pinataMetadata', JSON.stringify(metadata))

      const options = { cidVersion: 1 }
      formData.append('pinataOptions', JSON.stringify(options))

      const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: PINATA_JWT
          ? { Authorization: `Bearer ${PINATA_JWT}` }
          : {
              pinata_api_key: PINATA_API_KEY || '',
              pinata_secret_api_key: PINATA_API_SECRET || ''
            },
        body: formData
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `HTTP ${res.status}`)
      }

      const data = await res.json()
      const ipfsHash = data.IpfsHash || data.cid || ''
      setCid(ipfsHash)
      setStatus('Upload complete.')
      setShowUploaded(true)
      setImageLoaded(false)
      
      // Call the callback to add marker to map
      if (onPhotoUploaded && ipfsHash) {
        onPhotoUploaded(ipfsHash, file.name)
      }
      
      // Close the modal after successful upload
      setTimeout(() => {
        close()
      }, 1000)
      
      // Revoke local preview once we rely on IPFS
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl('')
      }
    } catch (e: any) {
      setStatus(`Error: ${e.message}`)
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const ipfsImageUrl = cid ? `https://tan-mad-gorilla-689.mypinata.cloud/ipfs/${cid}` : ''

  if (!openModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Upload Photo to Pinata</h2>
        {!PINATA_JWT && !PINATA_API_KEY && (
          <p className="text-sm text-error mb-3">
            Provide VITE_PINATA_JWT (preferred) or VITE_PINATA_API_KEY & VITE_PINATA_API_SECRET in .env
          </p>
        )}
        <input
          type="file"
          accept="image/*"
          className="file-input file-input-bordered w-full mb-3"
          onChange={onSelect}
        />

        {status && <p className="text-sm mb-3">{status}</p>}

        {(uploading || (showUploaded && !imageLoaded)) && (
          <div className="flex flex-col items-center gap-2 mb-4">
            <span className="loading loading-spinner loading-md" />
            <p className="text-xs">
              {uploading ? 'Uploading to Pinata...' : 'Fetching image from IPFS...'}
            </p>
          </div>
        )}

        {/* Local preview */}
        {!showUploaded && previewUrl && (
          <div className="mb-4">
            <p className="text-xs mb-1 opacity-70">Local preview (not yet on IPFS)</p>
            <img
              src={previewUrl}
              alt="preview"
              className="max-h-56 rounded border object-contain mx-auto"
            />
          </div>
        )}

        {/* Uploaded image */}
        {showUploaded && cid && (
          <div className="mb-4">
            <p className="text-xs mb-1 opacity-70">Uploaded to IPFS</p>
            <img
              src={ipfsImageUrl}
              alt="uploaded"
              className="max-h-56 rounded border object-contain mx-auto"
              onLoad={() => setImageLoaded(true)}
            />
            <div className="text-xs mt-2 break-all">
              CID: {cid}
              <div className="mt-1 flex gap-2 flex-wrap">
                <a
                  className="link"
                  href={ipfsImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Pinata Gateway
                </a>
                <a
                  className="link"
                  href={`https://ipfs.io/ipfs/${cid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ipfs.io
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <button
            className="btn btn-primary flex-1"
            onClick={upload}
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <button className="btn" onClick={close} disabled={uploading}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PhotoUpload
