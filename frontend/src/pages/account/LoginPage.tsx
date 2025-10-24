import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadProfile } from '../../store/profile'

export default function LoginPage() {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('') // nickname or email
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const p = loadProfile()
    if (!p) {
      setError('Profile not found. Please register.')
      return
    }
    if (p.email === identifier.trim() || p.nickname === identifier.trim()) {
      navigate('/profile')
    } else {
      setError('Invalid credentials. Please try your nickname or email used for registration.')
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <h1 className="text-2xl font-semibold">Login</h1>

        <label className="block">
          <span className="text-sm text-gray-700">Nickname or Email</span>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
            placeholder="SkySeeker or you@example.com"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" className="flex-1 px-4 py-2 rounded-xl bg-black text-white">
            Login
          </button>
          <button type="button" onClick={() => navigate('/account')} className="flex-1 px-4 py-2 rounded-xl bg-gray-100">
            Back
          </button>
        </div>
      </form>
    </div>
  )
}