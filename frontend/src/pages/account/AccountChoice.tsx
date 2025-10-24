import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function AccountChoice() {
  const navigate = useNavigate()
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-2xl font-semibold mb-4">Personal Account</h1>
        <p className="text-gray-600 mb-6">Choose an action:</p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/login')}
            className="flex-1 px-4 py-2 rounded-xl bg-black text-white"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/register')}
            className="flex-1 px-4 py-2 rounded-xl bg-gray-100"
          >
            Register
          </button>
        </div>
      </div>
    </div>
  )
}