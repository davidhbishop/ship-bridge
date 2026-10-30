// The shape of GET /v1/morning on the bridge-api worker. Every field is
// treated as optional so a partly filled response still renders.

export type SeaForecast = { wind?: string; sea?: string; weather?: string; visibility?: string }

export type Morning = {
  date: string
  generated_at?: string
  tides: { type: 'high' | 'low'; at?: string; local: string; height_m: number | null }[]
  gates: { type: 'open' | 'close'; at?: string; local: string; for_hw?: string }[]
  daylight: {
    sunrise?: string | null
    sunset?: string | null
    moonrise?: string | null
    moonset?: string | null
    moon_phase?: string | null
  }
  shipping?: {
    issued?: string
    general_synopsis?: string
    gale_warnings?: string[]
    area?: { name?: string } & SeaForecast
  } | null
  inshore?: {
    issued?: string
    general_situation?: string
    areas: { id: string; name: string; warning?: string; next_24h?: SeaForecast; outlook?: SeaForecast | string }[]
  } | null
  alerts?: { level?: string; code?: string; title: string; detail?: string; source?: string }[]
  stale?: Record<string, unknown>
}
