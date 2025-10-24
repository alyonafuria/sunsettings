import React from 'react'
import { useNavigate } from 'react-router-dom'
import { loadProfile } from '../../store/profile'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const a = parts[0]?.[0] ?? ''
  const b = parts[1]?.[0] ?? ''
  return (a + b).toUpperCase() || 'U'
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const p = loadProfile()

  if (!p) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-center space-y-4">
          <h1 className="text-2xl font-semibold">Profile not found</h1>
          <p className="text-gray-600">Create an account or log in.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/register')} className="px-4 py-2 rounded-xl bg-black text-white">Register</button>
            <button onClick={() => navigate('/login')} className="px-4 py-2 rounded-xl bg-gray-100">Login</button>
          </div>
        </div>
      </div>
    )
  }

  const count = p.sunsetCount ?? 0

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          {p.avatarUrl ? (
            <img src={p.avatarUrl} alt={p.nickname} className="w-20 h-20 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold">
              {initials(p.nickname)}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{p.nickname}</h1>
            <p className="text-gray-600">{p.bio || 'No bio'}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow p-4 min-w-[220px]">
          <div className="text-sm text-gray-600">Personal sunset counter</div>
          <div className="text-3xl font-semibold">{count}/365</div>
          <div className="h-2 mt-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-black"
              style={{ width: `${Math.min(100, (count / 365) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-3">Personal gallery</h2>
        {/* grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400"
            >
              photos
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}