import type { SunsetAnalysisParams, SunsetAnalysisResult, SunsetServiceConfig } from "../interfaces/sunset"
import { SUNSET_SCORING_PROMPT, SUNSET_DESCRIPTION_PROMPT, SYSTEM_MESSAGE } from "../sunsetPrompts"

/**
 * Service for AI-powered sunset quality analysis
 */
export class SunsetAIService {
  private config: SunsetServiceConfig

  constructor(config: SunsetServiceConfig) {
    this.config = {
      temperature: 0.7,
      temperatureScore: 0.1,
      temperatureDescription: 0.9,
      maxTokens: 200,
      ...config,
    }
  }

  /**
   * Analyzes sunset quality based on weather data using OpenAI API
   */
  async analyzeSunset(params: SunsetAnalysisParams): Promise<SunsetAnalysisResult> {
    const { location, weatherSummary, seed } = params

    const truncatedWxSummary = weatherSummary.length > 220 ? weatherSummary.slice(0, 220) : weatherSummary

    // Pass 1: Deterministic scoring (probability only)
    const scoringPrompt = SUNSET_SCORING_PROMPT
      .replace("{weatherSummary}", truncatedWxSummary || "avg_cloud:NA; avg_humidity:NA; precip_prob_max:NA; precip_total:NA; hours_analyzed:NA")
      .replace("{location}", location)
      .replace("{timeUTC}", new Date().toISOString())
      .replace("{seed}", String(seed))

    const scoreResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model,
        temperature: this.config.temperatureScore ?? this.config.temperature ?? 0.1,
        max_tokens: this.config.maxTokens,
        messages: [
          { role: "system", content: SYSTEM_MESSAGE },
          { role: "user", content: scoringPrompt },
        ],
      }),
    })

    if (!scoreResp.ok) {
      throw new Error(`HTTP ${scoreResp.status}`)
    }

    const scoreData = await scoreResp.json()
    const scoreRaw = scoreData?.choices?.[0]?.message?.content?.trim() || ""
    const probability = this.parseProbability(scoreRaw)

    // Pass 2: Creative description conditioned on the numeric probability
    const descriptionPrompt = SUNSET_DESCRIPTION_PROMPT
      .replace("{weatherSummary}", truncatedWxSummary || "avg_cloud:NA; avg_humidity:NA; precip_prob_max:NA; precip_total:NA; hours_analyzed:NA")
      .replace("{location}", location)
      .replace("{timeUTC}", new Date().toISOString())
      .replace("{seed}", String(seed))
      .replace("{probability}", String(probability ?? "NA"))

    const descResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model,
        temperature: this.config.temperatureDescription ?? this.config.temperature ?? 0.9,
        max_tokens: this.config.maxTokens,
        messages: [
          { role: "system", content: SYSTEM_MESSAGE },
          { role: "user", content: descriptionPrompt },
        ],
      }),
    })

    if (!descResp.ok) {
      throw new Error(`HTTP ${descResp.status}`)
    }

    const descData = await descResp.json()
    const descRaw = descData?.choices?.[0]?.message?.content?.trim() || ""
    const description = this.parseDescription(descRaw)

    return { probability: this.normalizeProbability(probability), description }
  }

  /**
   * Parses the AI response and extracts JSON data
   */
  private parseProbability(raw: string): number | null {
    let parsed: unknown = null
    try {
      parsed = JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        try { parsed = JSON.parse(match[0]) } catch {}
      }
    }
    if (!parsed || typeof parsed !== "object") throw new Error("Bad JSON response (score)")
    const obj = parsed as { probability?: unknown }
    return typeof obj.probability === "number" ? obj.probability : null
  }

  private parseDescription(raw: string): string {
    let parsed: unknown = null
    try {
      parsed = JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        try { parsed = JSON.parse(match[0]) } catch {}
      }
    }
    if (!parsed || typeof parsed !== "object") throw new Error("Bad JSON response (description)")
    const obj = parsed as { description?: unknown }
    return typeof obj.description === "string" ? obj.description : "No description"
  }

  normalizeProbability(probability: unknown): number | null {
    if (typeof probability !== "number") return null
    return Math.min(100, Math.max(0, Math.round(probability)))
  }

  generateFallbackProbability(location: string, weatherSummary: string): number {
    const hash = Array.from(location + weatherSummary).reduce((a, c) => (a * 131 + c.charCodeAt(0)) % 1000003, 7)
    const base = 40 + (hash % 50)
    const jitter = Math.floor(Math.random() * 11)
    let synthetic = base + jitter

    if (synthetic < 55 && Math.random() < 0.4) {
      synthetic += 20
    }

    return Math.min(96, synthetic)
  }

  shouldRetry(
    probability: number | null,
    previousResult: { location: string; probability: number | null } | null,
    currentLocation: string,
  ): boolean {
    if (probability === 75) return true
    if (
      previousResult &&
      previousResult.location === currentLocation &&
      typeof previousResult.probability === "number" &&
      previousResult.probability === probability
    ) {
      return true
    }
    return false
  }
}

export const createSunsetAIService = (): SunsetAIService | null => {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PRIVATE_OPENAI_API_KEY || process.env.NEXT_OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"
  const temperature = process.env.OPENAI_TEMPERATURE ? Number(process.env.OPENAI_TEMPERATURE) : undefined
  const temperatureScore = process.env.OPENAI_TEMPERATURE_SCORE ? Number(process.env.OPENAI_TEMPERATURE_SCORE) : undefined
  const temperatureDescription = process.env.OPENAI_TEMPERATURE_DESCRIPTION ? Number(process.env.OPENAI_TEMPERATURE_DESCRIPTION) : undefined
  const maxTokens = process.env.OPENAI_MAX_TOKENS ? Number(process.env.OPENAI_MAX_TOKENS) : undefined
  if (!apiKey) return null
  return new SunsetAIService({ apiKey, model, temperature, temperatureScore, temperatureDescription, maxTokens })
}
