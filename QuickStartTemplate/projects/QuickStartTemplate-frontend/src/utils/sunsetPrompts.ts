/**
 * AI prompts for sunset quality analysis
 */

export const SUNSET_ANALYSIS_PROMPT = `
You are an analyst producing a sunset quality estimate ONLY from the provided weather features.

WeatherFeatures (parsed summary, semicolon separated, may omit some):
{weatherSummary}

Analysis rules (DO NOT output this section, just use it):
- Ideal vivid sunset: broken/moderate clouds (30-70%) + low precipitation probability (<25%) + some humidity (35-70%) -> probability 80-95.
- Overcast (>80% clouds) or heavy precip (precip_prob_max >60% or precip_total >2mm) -> probability 35-55 (lower if both).
- Very clear (<10% clouds) often reduces dramatic colors -> probability 55-70 unless humidity very favorable.
- Extremely hazy indicator: high humidity (>90%) + high clouds (>70%) + precip_prob_max>40% -> probability 30-50.
- Probability must be INT 0-100. Avoid defaulting to 75. Vary based on metrics. Seed only breaks ties.
- Description: <=160 chars, concise, no quotes, mention key drivers (e.g. "scattered mid clouds", "dry clear air", "high overcast dampens colors").

Return ONLY compact JSON (no markdown, no backticks, no commentary):
{"probability": <int 0-100>, "description":"<text>"}

Location: {location}
TimeUTC: {timeUTC}
RandomSeed: {seed}`.trim()

export const SYSTEM_MESSAGE = 'Output ONLY valid JSON with keys probability (int) and description (string).'
