import React, { useCallback, useEffect, useState, FC } from 'react'

export interface PhotoUploadProps {
  open: boolean
  onClose: () => void
  onUploaded: (ipfsHash: string, fileName: string) => void
  coordinates?: [number, number] // [lng, lat]
}

// Get environment variables with fallbacks
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || ''
const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY || ''
const PINATA_API_SECRET = import.meta.env.VITE_PINATA_API_SECRET || ''

const PhotoUpload: FC<PhotoUploadProps> = ({ 
  open, 
  onClose, 
  onUploaded: onPhotoUploaded,
  coordinates
}): JSX.Element | null => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [cid, setCid] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showUploaded, setShowUploaded] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const close = useCallback(() => {
    onClose()
    setFile(null)
    setStatus('')
    setCid('')
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
    setShowUploaded(false)
  }, [onClose, previewUrl])

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    
    // Reset previous state
    setFile(null);
    setCid('');
    setStatus('');
    
    if (!f) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(f.type)) {
      setStatus('Error: Only JPG, PNG, GIF, and WebP images are supported');
      return;
    }
    
    // No artificial file size limit, but we'll warn about very large files
    const fileSizeMB = f.size / (1024 * 1024);
    if (fileSizeMB > 100) { // Warn for files over 100MB
      if (!confirm(`This file is ${fileSizeMB.toFixed(1)}MB. Continue with upload?`)) {
        return;
      }
    }
    
    // Set file and preview if validations pass
    setFile(f);
    setStatus(`Selected: ${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)`);
    
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(f));
    setShowUploaded(false);
    setImageLoaded(false);
  }

  const upload = useCallback(async (retryCount = 0) => {
    const maxRetries = 2; // Maximum number of retry attempts
    
    if (!file) {
      setStatus('Select a file first.');
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    console.log(`Uploading file: ${file.name}, Size: ${fileSizeMB.toFixed(2)}MB, Attempt: ${retryCount + 1}`);

    // Log which credentials are being used for debugging
    const credentialsInfo = {
      hasJWT: !!PINATA_JWT,
      hasApiKey: !!PINATA_API_KEY,
      hasApiSecret: !!PINATA_API_SECRET,
      fileSize: file.size,
      fileSizeMB: fileSizeMB.toFixed(2) + 'MB',
      fileName: file.name,
      fileType: file.type
    };
    
    console.log('Upload details:', credentialsInfo);
    
    // Check if credentials are properly set
    if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_API_SECRET)) {
      const errorMsg = 'Missing Pinata credentials. Please check your .env file.';
      console.error(errorMsg, credentialsInfo);
      setStatus(errorMsg);
      return;
    }

    try {
      setUploading(true);
      setStatus('Uploading...');
      
      const formData = new FormData();
      formData.append('file', file);

      // Prepare metadata with coordinates if available
      const metadata = {
        name: file.name,
        keyvalues: { 
          app: 'quickstart', 
          type: 'photo',
          ...(coordinates && { 
            coordinates: `${coordinates[0]},${coordinates[1]}`
          })
        },
      };
      formData.append('pinataMetadata', JSON.stringify(metadata));

      const options = { cidVersion: 1 };
      formData.append('pinataOptions', JSON.stringify(options));

      // Always prefer JWT if available, fall back to API key/secret
      const headers: HeadersInit = {};
      
      if (PINATA_JWT) {
        headers['Authorization'] = `Bearer ${PINATA_JWT}`;
        console.log('Using JWT authentication');
      } else if (PINATA_API_KEY && PINATA_API_SECRET) {
        headers['pinata_api_key'] = PINATA_API_KEY;
        headers['pinata_secret_api_key'] = PINATA_API_SECRET;
        console.log('Using API key/secret authentication');
      }
      
      console.log('Sending request to Pinata...');
      // Add a unique boundary for each request
      const boundary = `----WebKitFormBoundary${Math.random().toString(16).substr(2)}`;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: {
            ...headers,
          },
          body: formData,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const responseText = await res.text();
        let responseData;
        
        try {
          responseData = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
          console.error('Failed to parse response as JSON:', responseText);
          throw new Error(`Invalid response from server: ${responseText.substring(0, 100)}...`);
        }
        
        if (!res.ok) {
          const errorDetails = {
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries(res.headers.entries()),
            response: responseData,
            request: {
              method: 'POST',
              url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
              fileSize: file.size,
              fileType: file.type,
              hasCredentials: !!PINATA_JWT || (!!PINATA_API_KEY && !!PINATA_API_SECRET)
            }
          };
          
          console.error('Pinata API Error:', errorDetails);
          
          if ((res.status === 429 || res.status >= 500) && retryCount < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff
            console.log(`Retrying upload in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return upload(retryCount + 1);
          }
          
          let errorMessage = `Upload failed: ${res.status} ${res.statusText}`;
          
          if (responseData?.error) {
            if (typeof responseData.error === 'string') {
              errorMessage = responseData.error;
            } else if (responseData.error.details) {
              errorMessage = responseData.error.details;
            } else if (responseData.error.message) {
              errorMessage = responseData.error.message;
            } else {
              errorMessage = JSON.stringify(responseData.error);
            }
          }
          
          throw new Error(errorMessage);
        }
        
        const ipfsHash = responseData.IpfsHash || responseData.cid || '';
        if (!ipfsHash) {
          console.error('No IPFS hash in response:', responseData);
          throw new Error('No IPFS hash received from Pinata');
        }
        
        console.log('Upload successful:', { ipfsHash, response: responseData });
        
        setCid(ipfsHash);
        setStatus('Upload complete!');
        setShowUploaded(true);
        setImageLoaded(false);

        if (onPhotoUploaded) {
          onPhotoUploaded(ipfsHash, file.name);
        }

        setTimeout(() => {
          close();
        }, 1000);

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl('');
        }
      } catch (e: any) {
        console.error('Upload error:', e);
        
        let errorMessage = 'Failed to upload file to IPFS';
        let shouldRetry = false;
        
        if (e.name === 'AbortError') {
          errorMessage = 'Upload timed out. Please try again.';
        } else if (e.message) {
          errorMessage = e.message;
          
          // Check if we should retry
          const isNetworkError = e.message.includes('Failed to fetch') || 
                               e.message.includes('NetworkError') ||
                               e.message.includes('TypeError');
          
          shouldRetry = isNetworkError && retryCount < maxRetries;
        }
        
        // More user-friendly error messages
        if (errorMessage.includes('413') || errorMessage.includes('too large')) {
          errorMessage = 'File is too large. Please try a smaller file.';
        } else if (errorMessage.includes('500') || 
                  errorMessage.includes('IPFS') || 
                  errorMessage.includes('ECONN')) {
          errorMessage = 'Temporary server issue. Please try again in a moment.';
          shouldRetry = retryCount < maxRetries;
        } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
          errorMessage = 'Authentication failed. Please check your Pinata credentials.';
        } else if (errorMessage.includes('file size')) {
          errorMessage = 'The file might be too large for your Pinata plan.';
        }
        
        console.error('Upload failed:', { 
          error: e, 
          message: errorMessage, 
          retryCount, 
          willRetry: shouldRetry 
        });
        
        if (shouldRetry) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          console.log(`Retrying upload in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return upload(retryCount + 1);
        }
        
        setStatus(`Error: ${errorMessage}`);
      } finally {
        setUploading(false);
      }
    } catch (e) {
      console.error('Unexpected error in upload:', e);
      setStatus('An unexpected error occurred. Please try again.');
      setUploading(false);
    }
  }, [file, previewUrl, onPhotoUploaded, coordinates]);

  const handleUploadClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    upload(0); // Start with retryCount = 0
  }, [upload]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const ipfsImageUrl = cid ? `https://tan-mad-gorilla-689.mypinata.cloud/ipfs/${cid}` : ''

  if (!open) return null;

  // Handle click on the modal background to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">Upload Photo to Pinata</h2>
        {!PINATA_JWT && !PINATA_API_KEY && (
          <p className="text-sm text-error mb-3">
            Provide VITE_PINATA_JWT (preferred) or VITE_PINATA_API_KEY & VITE_PINATA_API_SECRET in .env
          </p>
        )}
        <input type="file" accept="image/*" className="file-input file-input-bordered w-full mb-3" onChange={onSelect} />

        {status && <p className="text-sm mb-3">{status}</p>}

        {(uploading || (showUploaded && !imageLoaded)) && (
          <div className="flex flex-col items-center gap-2 mb-4">
            <span className="loading loading-spinner loading-md" />
            <p className="text-xs">{uploading ? 'Uploading to Pinata...' : 'Fetching image from IPFS...'}</p>
          </div>
        )}

        {/* Local preview */}
        {!showUploaded && previewUrl && (
          <div className="mb-4">
            <p className="text-xs mb-1 opacity-70">Local preview (not yet on IPFS)</p>
            <img src={previewUrl} alt="preview" className="max-h-56 rounded border object-contain mx-auto" />
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
                <a className="link" href={ipfsImageUrl} target="_blank" rel="noopener noreferrer">
                  Pinata Gateway
                </a>
                <a className="link" href={`https://ipfs.io/ipfs/${cid}`} target="_blank" rel="noopener noreferrer">
                  ipfs.io
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <button className="btn btn-primary flex-1" onClick={handleUploadClick} disabled={!file || uploading}>
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

// Export as default for backward compatibility
export default PhotoUpload;
