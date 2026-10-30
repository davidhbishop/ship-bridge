import 'server-only'

import { fromDataJson, normaliseMorning, type RawRecord } from './forecast.ts'
import type { Morning } from './morning.ts'
import { sampleMorning } from './sample.ts'
import { DEFAULT_SETTINGS, validateSettings, type Settings } from './settings.ts'

export const config = {
  // Base URL of the bridge-api worker, e.g. https://bridge-api.example.workers.dev
  apiUrl: process.env.FORECAST_API_URL ?? '',
  apiKey: process.env.FORECAST_API_KEY ?? '',
  // "morning" reads /v1/morning; "datajson" reads a raw R2 data.json via ?date=.
  apiMode: process.env.FORECAST_API_MODE === 'datajson' ? 'datajson' : 'morning',
  tideFix: process.env.LEGACY_TIDE_FIX !== 'false',
}

export const isDemo = !config.apiUrl

export type DayResult = { day: Morning | null; error: string | null }

async function api(path: string, init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {}) {
  const url = new URL(path, config.apiUrl)
  const response = await fetch(url, {
    ...init,
    headers: { 'X-Api-Key': config.apiKey, 'Content-Type': 'application/json', ...init.headers },
  })
  return response
}

// Settings live in bridge-api (R2 config/settings.json). In sample mode they
// are kept in memory so the settings page can be tried out.
let demoSettings: Settings = DEFAULT_SETTINGS

export async function loadSettings(): Promise<{ settings: Settings; error: string | null }> {
  if (isDemo) return { settings: demoSettings, error: null }
  try {
    const response = await api('/v1/settings', { next: { revalidate: 60, tags: ['settings'] } })
    if (response.status === 404) return { settings: DEFAULT_SETTINGS, error: null }
    if (!response.ok) throw new Error(`Settings API answered ${response.status}`)
    const body = (await response.json()) as { settings?: unknown }
    return { settings: validateSettings(body?.settings ?? body), error: null }
  } catch (error) {
    return { settings: DEFAULT_SETTINGS, error: error instanceof Error ? error.message : 'Could not load settings' }
  }
}

export async function saveSettings(settings: Settings): Promise<{ settings: Settings; nextFetchAt?: string }> {
  if (isDemo) {
    demoSettings = { ...settings, updated_at: new Date().toISOString() }
    return { settings: demoSettings }
  }
  const response = await api('/v1/settings', { method: 'PUT', body: JSON.stringify(settings), cache: 'no-store' })
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null
  if (!response.ok) {
    const message = body && typeof body.error === 'string' ? body.error : `Settings API answered ${response.status}`
    throw new Error(message)
  }
  const saved = (body?.settings ?? body) as Settings
  return { settings: validateSettings(saved), nextFetchAt: typeof body?.next_fetch_at === 'string' ? body.next_fetch_at : undefined }
}

export type Station = { station: string; name: string; country?: string }

export async function searchStations(q: string): Promise<Station[]> {
  if (isDemo) {
    // Known stations only; live search uses the Admiralty list via bridge-api.
    const all: Station[] = [
      { station: '0471A', name: 'Conwy' },
      { station: '0478', name: 'Holyhead' },
      { station: '0451', name: 'Liverpool' },
      { station: '0496', name: 'Milford Haven' },
      { station: '0089', name: 'Dover' },
    ]
    return all.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
  }
  const response = await api(`/v1/stations?q=${encodeURIComponent(q)}`, { next: { revalidate: 86400 } })
  if (!response.ok) throw new Error(`Station search answered ${response.status}`)
  const list = (await response.json()) as Station[]
  return Array.isArray(list) ? list.slice(0, 20) : []
}

export async function loadDay(date: string, offset: number, settings: Settings): Promise<DayResult> {
  if (isDemo) return { day: sampleMorning(date, offset, settings), error: null }
  try {
    const path = config.apiMode === 'morning' ? `/v1/morning?date=${date}` : `?date=${date}`
    const response = await api(path, { next: { revalidate: 600, tags: ['forecast'] } })
    if (response.status === 404) return { day: null, error: null }
    if (!response.ok) throw new Error(`Forecast API answered ${response.status}`)
    const json = await response.json()
    if (config.apiMode === 'datajson') {
      const records = (Array.isArray(json) ? json : []) as RawRecord[]
      return {
        day: fromDataJson(date, records, settings.ports, settings.home_port, settings.inshore_areas, config.tideFix),
        error: null,
      }
    }
    return { day: normaliseMorning(date, json as Partial<Morning>), error: null }
  } catch (error) {
    return { day: null, error: error instanceof Error ? error.message : 'Could not load forecast' }
  }
}
