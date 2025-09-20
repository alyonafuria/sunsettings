import { useState } from 'react'

interface WeatherCoords {
  lat: number
  lon: number
}

interface UseWeatherReturn {
  weatherSummary: string
  fetchHourlyWeather: (lat: number, lon: number) => Promise<string>
}

export const useWeather = (): UseWeatherReturn => {
  const [weatherSummary, setWeatherSummary] = useState<string>('')

  const fetchHourlyWeather = async (lat: number, lon: number): Promise<string> => {
    try {
      const today = new Date()
      const dateParam = today.toISOString().slice(0, 10) // YYYY-MM-DD
      // Bright Sky: if we only pass date, last_date defaults to +1 day; we will filter to today
      const weatherUrl = `https://api.brightsky.dev/weather?date=${dateParam}&lat=${lat}&lon=${lon}&tz=UTC&units=dwd`
      const res = await fetch(weatherUrl)
      if (!res.ok) throw new Error(`Weather HTTP ${res.status}`)
      const json = await res.json()
      const records: any[] = json.weather || []
      if (!records.length) return 'No weather data.'
      const sameDay = records.filter(r => r.timestamp?.startsWith(dateParam))
      const sample = sameDay.length ? sameDay : records

      // Focus on late afternoon / early evening hours (approx sunset window 15-22 UTC)
      const sunsetWindow = sample.filter(r => {
        const hour = parseInt(r.timestamp?.substring(11, 13) || '0', 10)
        return hour >= 15 && hour <= 22
      })
      const targetSet = sunsetWindow.length ? sunsetWindow : sample.slice(-6)

      const avg = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null

      const cloudsArr = targetSet.map(r => typeof r.cloud_cover === 'number' ? r.cloud_cover : null).filter(n => n!==null) as number[]
      const humidArr  = targetSet.map(r => typeof r.relative_humidity === 'number' ? r.relative_humidity : null).filter(n => n!==null) as number[]
      const tempArr   = targetSet.map(r => typeof r.temperature === 'number' ? r.temperature : null).filter(n => n!==null) as number[]
      const precipProbArr = targetSet.map(r => typeof r.precipitation_probability === 'number' ? r.precipitation_probability : null).filter(n => n!==null) as number[]
      const precipArr = targetSet.map(r => typeof r.precipitation === 'number' ? r.precipitation : 0)

      const cloudAvg = avg(cloudsArr)
      const humidAvg = avg(humidArr)
      const tempAvg = avg(tempArr)
      const precipMax = precipProbArr.length ? Math.max(...precipProbArr) : null
      const precipSum = precipArr.reduce((a,b)=>a+(b||0),0)

      // Build concise summary (<= ~220 chars)
      const parts: string[] = []
      if (cloudAvg !== null) parts.push(`avg_cloud:${cloudAvg.toFixed(0)}%`)
      if (humidAvg !== null) parts.push(`avg_humidity:${humidAvg.toFixed(0)}%`)
      if (tempAvg !== null) parts.push(`avg_temp:${tempAvg.toFixed(1)}C`)
      if (precipMax !== null) parts.push(`precip_prob_max:${precipMax}%`)
      if (precipSum > 0) parts.push(`precip_total:${precipSum.toFixed(1)}mm`)
      parts.push(`hours_analyzed:${targetSet.length}`)

      const summary = parts.join('; ')
      setWeatherSummary(summary)
      return summary
    } catch (e: any) {
      const errorSummary = 'Weather fetch failed'
      setWeatherSummary(errorSummary)
      return errorSummary
    }
  }

  return {
    weatherSummary,
    fetchHourlyWeather,
  }
}
