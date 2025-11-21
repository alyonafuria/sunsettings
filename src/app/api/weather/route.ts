import { NextResponse } from "next/server"
import { getWeatherSummary } from "@/lib/weather/getWeatherSummary"

export const runtime = "nodejs"

// Simple in-memory TTL cache for server-side
// Key by rounded lat/lon (0.05°) + date (YYYY-MM-DD)
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
type CachedWeather = { summary: string; sunsetUtc: string | null; sunsetLocal: string | null }
const memCache = new Map<string, { value: CachedWeather; expires: number }>()

function roundCoord(x: number, step = 0.05): number {
  return Math.round(x / step) * step
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const latStr = url.searchParams.get("lat")
    const lonStr = url.searchParams.get("lon") || url.searchParams.get("lng")
    const dateStr = url.searchParams.get("date") // optional YYYY-MM-DD

    if (!latStr || !lonStr) {
      return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 })
    }
    const lat = Number(latStr)
    const lon = Number(lonStr)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: "Invalid lat/lon" }, { status: 400 })
    }

    const date = dateStr ? new Date(dateStr) : new Date()
    const ymd = date.toISOString().slice(0, 10)

    const rLat = roundCoord(lat)
    const rLon = roundCoord(lon)
    const cacheKey = `${rLat},${rLon}:${ymd}`

    const now = Date.now()
    const cached = memCache.get(cacheKey)
    if (cached && cached.expires > now) {
      return NextResponse.json({ ok: true, weatherSummary: cached.value.summary, sunsetUtc: cached.value.sunsetUtc, sunsetLocal: cached.value.sunsetLocal, cached: true })
    }

    const [summary, sunset] = await Promise.all([
      getWeatherSummary(lat, lon, date),
      getSunsetLocalAware(lat, lon, ymd).catch(() => ({ utc: null as string | null, local: null as string | null })),
    ])

    memCache.set(cacheKey, { value: { summary, sunsetUtc: sunset.utc, sunsetLocal: sunset.local }, expires: now + CACHE_TTL_MS })

    return NextResponse.json({ ok: true, weatherSummary: summary, sunsetUtc: sunset.utc, sunsetLocal: sunset.local, cached: false })
  } catch (e) {
    return NextResponse.json({ error: (e as Error)?.message || "Unknown error" }, { status: 500 })
  }
}

// Returns both UTC ISO and a human local time string for the location, chosen for the location's CURRENT LOCAL DAY.
type OpenMeteoSunset = {
  daily?: { sunset?: string[] }
  utc_offset_seconds?: number
}

function parseLocalToUtcIso(localTime: string, offsetSec: number): { utcIso: string; localHHmm: string; localDate: string } | null {
  // localTime format: YYYY-MM-DDTHH:MM
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(localTime)
  if (!m) return null
  const y = parseInt(m[1], 10)
  const mo = parseInt(m[2], 10)
  const d = parseInt(m[3], 10)
  const hh = parseInt(m[4], 10)
  const mm = parseInt(m[5], 10)
  const localMs = Date.UTC(y, mo - 1, d, hh, mm, 0)
  const utcMs = localMs - (offsetSec * 1000)
  return {
    utcIso: new Date(utcMs).toISOString(),
    localHHmm: `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`,
    localDate: `${m[1]}-${m[2]}-${m[3]}`,
  }
}

async function getSunsetLocalAware(lat: number, lon: number, ymdUtc: string): Promise<{ utc: string | null; local: string | null }> {
  // Fetch two days to straddle local midnight and select by location's current local date
  const start = ymdUtc
  const endDate = new Date(`${ymdUtc}T00:00:00.000Z`)
  endDate.setUTCDate(endDate.getUTCDate() + 1)
  const end = endDate.toISOString().slice(0, 10)
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=sunset&timezone=auto&start_date=${start}&end_date=${end}`
  const res = await fetch(url)
  if (!res.ok) return { utc: null, local: null }
  const json = (await res.json().catch(() => null)) as unknown as OpenMeteoSunset | null
  if (!json) return { utc: null, local: null }
  const times = Array.isArray(json.daily?.sunset) ? (json.daily!.sunset as string[]) : []
  const offsetSec = typeof json.utc_offset_seconds === 'number' ? json.utc_offset_seconds : 0
  if (!times.length) return { utc: null, local: null }

  const parsed = times
    .map((t) => parseLocalToUtcIso(t, offsetSec))
    .filter((v): v is NonNullable<ReturnType<typeof parseLocalToUtcIso>> => !!v)

  if (!parsed.length) return { utc: null, local: null }

  // Determine current local date at the location
  const nowUtcMs = Date.now()
  const nowLocalMs = nowUtcMs + offsetSec * 1000
  const nowLocalDate = new Date(nowLocalMs).toISOString().slice(0, 10)

  // Prefer sunset whose local date matches location's current local date
  const todayLocal = parsed.find((p) => p.localDate === nowLocalDate)
  if (todayLocal) return { utc: todayLocal.utcIso, local: todayLocal.localHHmm }

  // Fallback: pick the next upcoming sunset after now
  const nextUpcoming = parsed
    .map((p) => ({ ...p, utcMs: Date.parse(p.utcIso) }))
    .filter((p) => Number.isFinite(p.utcMs))
    .sort((a, b) => a.utcMs - b.utcMs)
    .find((p) => nowUtcMs <= p.utcMs)
  if (nextUpcoming) return { utc: nextUpcoming.utcIso, local: nextUpcoming.localHHmm }

  // Else return the latest (already passed) of the range
  const last = parsed
    .map((p) => ({ ...p, utcMs: Date.parse(p.utcIso) }))
    .filter((p) => Number.isFinite(p.utcMs))
    .sort((a, b) => b.utcMs - a.utcMs)[0]
  return last ? { utc: last.utcIso, local: last.localHHmm } : { utc: null, local: null }
}
