/**
 * Interfaces for sunset analysis functionality
 */

export interface SunsetAnalysisResult {
    probability: number
    description: string
}

export interface SunsetAnalysisParams {
    location: string
    weatherSummary: string
    seed: string
}

export interface SunsetServiceConfig {
    apiKey: string
    model: string
    temperature?: number
    maxTokens?: number
}

export interface PreviousResult {
    location: string
    probability: number | null
}
