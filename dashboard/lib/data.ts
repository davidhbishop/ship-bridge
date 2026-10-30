import 'server-only'

import { fromDataJson, normaliseMorning, type RawRecord } from './forecast.ts'
import type { Morning } from './morning.ts'
import { sampleMorning } from './sample.ts'

export const config = {
  // Base URL of the bridge-api worker, e.g. https://bridge-api.example.workers.dev
  apiUrl: process.env.FORECAST_API_URL ?? '',
  apiKey: process.env.FORECAST_API_KEY ?? '',
  // "morning" reads /v1/morning; "datajson" reads a raw R2 data.json via ?date=.
  apiMode: process.env.FORECAST_API_MODE === 'datajson' ? 'datajson' : 'morning',
  port: process.env.HOME_PORT ?? 'Conwy',
  // Met Office inshore waters areas to show from data.json. 10 and 11 meet at Great Orme Head.
  areas: (process.env.INSHORE_AREAS ?? '10,11')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean),
  tideFix: process.env.LEGACY_TIDE_FIX !== 'false',
}

export const isDemo = !config.apiUrl

export type DayResult = { day: Morning | null; error: string | null }

async function fetchJson(date: string): Promise<unknown | null> {
  const url =
    config.apiMode === 'morning' ? new URL('/v1/morning', config.apiUrl) : new URL(config.apiUrl)
  url.searchParams.set('date', date)
  const response = await fetch(url, {
    headers: { 'X-Api-Key': config.apiKey },
    // Workers update a few times a day; ten minutes is fresh enough.
    next: { revalidate: 600 },
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Forecast API answered ${response.status}`)
  return response.json()
}

export async function loadDay(date: string, offset: number): Promise<DayResult> {
  if (isDemo) {
    return { day: sampleMorning(date, offset), error: null }
  }
  try {
    const json = await fetchJson(date)
    if (config.apiMode === 'datajson') {
      const records = (Array.isArray(json) ? json : []) as RawRecord[]
      return { day: fromDataJson(date, records, config.port, config.areas, config.tideFix), error: null }
    }
    return { day: json ? normaliseMorning(date, json as Partial<Morning>) : null, error: null }
  } catch (error) {
    return { day: null, error: error instanceof Error ? error.message : 'Could not load forecast' }
  }
}
