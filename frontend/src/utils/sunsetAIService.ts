import { SunsetAnalysisParams, SunsetAnalysisResult, SunsetServiceConfig } from '../interfaces/sunset'
import { SUNSET_ANALYSIS_PROMPT, SYSTEM_MESSAGE } from './sunsetPrompts'

/**
 * Service for AI-powered sunset quality analysis
 */
export class SunsetAIService {
    private config: SunsetServiceConfig

    constructor(config: SunsetServiceConfig) {
        this.config = {
            temperature: 0.55,
            maxTokens: 160,
            ...config,
        }
    }

    /**
     * Analyzes sunset quality based on weather data using OpenAI API
     */
    async analyzeSunset(params: SunsetAnalysisParams): Promise<SunsetAnalysisResult> {
        const { location, weatherSummary, seed } = params

        // Limit weather summary length to keep prompt efficient
        const truncatedWxSummary = weatherSummary.length > 220 ? weatherSummary.slice(0, 220) : weatherSummary

        const prompt = SUNSET_ANALYSIS_PROMPT
            .replace('{weatherSummary}', truncatedWxSummary || 'avg_cloud:NA; avg_humidity:NA; avg_temp:NA; precip_prob_max:NA; precip_total:NA; hours_analyzed:NA')
            .replace('{location}', location)
            .replace('{timeUTC}', new Date().toISOString())
            .replace('{seed}', seed)

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.config.model,
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
                messages: [
                    { role: 'system', content: SYSTEM_MESSAGE },
                    { role: 'user', content: prompt },
                ],
            }),
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        const raw = data?.choices?.[0]?.message?.content?.trim() || ''

        // Debug raw response
        // eslint-disable-next-line no-console
        console.debug('[SunsetAI raw]', raw)

        return this.parseResponse(raw)
    }

    /**
     * Parses the AI response and extracts JSON data
     */
    private parseResponse(raw: string): SunsetAnalysisResult {
        let parsed: any = null

        try {
            parsed = JSON.parse(raw)
        } catch {
            // Try to extract JSON from the response if it's wrapped in other text
            const match = raw.match(/\{[\s\S]*\}/)
            if (match) {
                try {
                    parsed = JSON.parse(match[0])
                } catch {
                    // If still fails, throw error
                }
            }
        }

        if (!parsed || typeof parsed !== 'object') {
            throw new Error('Bad JSON response from AI')
        }

        return {
            probability: parsed.probability,
            description: parsed.description || 'No description',
        }
    }

    /**
     * Normalizes probability value to ensure it's within valid range
     */
    normalizeProbability(probability: any): number | null {
        if (typeof probability !== 'number') return null
        return Math.min(100, Math.max(0, Math.round(probability)))
    }

    /**
     * Generates a fallback probability when AI response is invalid or default
     */
    generateFallbackProbability(location: string, weatherSummary: string): number {
        const hash = Array.from(location + weatherSummary).reduce(
            (a, c) => (a * 131 + c.charCodeAt(0)) % 1000003,
            7
        )
        const base = 40 + (hash % 50)
        const jitter = Math.floor(Math.random() * 11)
        let synthetic = base + jitter

        if (synthetic < 55 && Math.random() < 0.4) {
            synthetic += 20
        }

        return Math.min(96, synthetic)
    }

    /**
     * Determines if a retry is needed based on probability value and previous results
     */
    shouldRetry(
        probability: number | null,
        previousResult: { location: string; probability: number | null } | null,
        currentLocation: string
    ): boolean {
        if (probability === 75) return true

        if (previousResult &&
            previousResult.location === currentLocation &&
            typeof previousResult.probability === 'number' &&
            previousResult.probability === probability) {
            return true
        }

        return false
    }
}

/**
 * Factory function to create a configured SunsetAIService instance
 */
export const createSunsetAIService = (): SunsetAIService | null => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'

    if (!apiKey) {
        return null
    }

    return new SunsetAIService({
        apiKey,
        model,
    })
}
