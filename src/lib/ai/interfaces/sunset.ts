export interface SunsetServiceConfig {
  apiKey: string
  model: string
  /**
   * Global fallback temperature if specific ones are not provided
   */
  temperature?: number
  /**
   * Low temperature for deterministic scoring (probability)
   */
  temperatureScore?: number
  /**
   * Higher temperature for creative description
   */
  temperatureDescription?: number
  maxTokens?: number
}

export interface SunsetAnalysisParams {
  location: string
  weatherSummary: string
  seed: number
}

export interface SunsetAnalysisResult {
  probability: number | null
  description: string
}
