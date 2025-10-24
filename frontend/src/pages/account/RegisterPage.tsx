import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveProfile } from '../../store/profile'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')

  const canSubmit = nickname.trim() && email.trim()

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    saveProfile({ nickname: nickname.trim(), email: email.trim(), bio: bio.trim(), sunsetCount: 0 })
    navigate('/profile')
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <h1 className="text-2xl font-semibold">Registration form</h1>

        <label className="block">
          <span className="text-sm text-gray-700">nickname</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
            placeholder="например, SkySeeker"
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">e-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="text-sm text-gray-700">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2"
            rows={3}
            placeholder="Bio (optional)"
          />
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => navigate('/account')}
            className="flex-1 px-4 py-2 rounded-xl bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}