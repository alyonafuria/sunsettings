// src/store/profile.ts
export type UserProfile = {
  nickname: string
  email: string
  bio: string
  avatarUrl?: string
  sunsetCount?: number // number of sunsets posted
}

const LS_KEY = 'sunsettings.userProfile'

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) as UserProfile : null
  } catch {
    return null
  }
}

export function saveProfile(p: UserProfile) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(p))
  } catch {}
}

export function clearProfile() {
  try {
    localStorage.removeItem(LS_KEY)
  } catch {}
}