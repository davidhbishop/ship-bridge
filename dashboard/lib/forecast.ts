// Adapts the raw records in an R2 `YYYYMMDD/data.json` file (written by the
// Cloudflare workers) to the /v1/morning shape, until bridge-api is live,
// and holds the helpers the dashboard uses on either source.

import type { Morning, SeaForecast } from './morning.ts'
import { formatTime, londonOffsetMinutes, shiftTime, toMinutes } from './time.ts'

export type RawRecord = {
  time?: string
  name?: string
  event_type?: string
  type?: string
  [key: string]: unknown
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function eventType(record: RawRecord): string {
  return (text(record.event_type) || text(record.type)).toLowerCase()
}

function byLocal<T extends { local: string }>(a: T, b: T): number {
  return (toMinutes(a.local) ?? 0) - (toMinutes(b.local) ?? 0)
}

// The workers append to data.json on every run, so the same event can appear
// more than once. Keep the last copy of each.
function dedupe(records: RawRecord[]): RawRecord[] {
  const seen = new Map<string, RawRecord>()
  for (const record of records) {
    const time = toMinutes(text(record.time))
    const key = [text(record.name).toLowerCase(), eventType(record), time ?? text(record.time)].join('|')
    seen.set(key, record)
  }
  return [...seen.values()]
}

// The deployed tidal worker stores tide and gate times as UTC + 1 hour all
// year. tideFix undoes that in winter; pass false once the worker is fixed.
export function fromDataJson(
  date: string,
  records: RawRecord[],
  port: string,
  areas: string[],
  tideFix = true,
): Morning {
  const tideShift = tideFix ? londonOffsetMinutes(date) - 60 : 0
  const morning: Morning = {
    date,
    tides: [],
    gates: [],
    daylight: {},
    inshore: { areas: [] },
  }

  for (const record of dedupe(Array.isArray(records) ? records : [])) {
    const name = text(record.name).toLowerCase()
    const type = eventType(record)
    const time = text(record.time)

    if (name === 'inshore-forecast') {
      const id = text(record.event_type)
      if (areas.length && !areas.includes(id)) continue
      morning.inshore!.areas.push({
        id,
        name: text(record.area),
        warning: text(record.warning),
        next_24h: (record.forecast ?? {}) as SeaForecast,
      })
      continue
    }

    if (name !== port.toLowerCase() || toMinutes(time) === null) continue
    const local = formatTime(time)
    const tideLocal = shiftTime(local, tideShift)

    switch (type) {
      case 'highwater':
      case 'lowwater': {
        const height = typeof record.depth === 'number' ? record.depth : Number(record.depth)
        morning.tides.push({
          type: type === 'highwater' ? 'high' : 'low',
          local: tideLocal,
          height_m: Number.isFinite(height) ? height : null,
        })
        break
      }
      case 'gateopen':
      case 'gateclose':
        morning.gates.push({ type: type === 'gateopen' ? 'open' : 'close', local: tideLocal })
        break
      case 'sunrise':
      case 'sunset':
      case 'moonset':
        morning.daylight[type] = local
        break
      case 'moonrise':
        morning.daylight.moonrise = local
        morning.daylight.moon_phase = text(record.phase) || morning.daylight.moon_phase
        break
    }
  }

  morning.tides.sort(byLocal)
  morning.gates.sort(byLocal)
  morning.inshore!.areas.sort((a, b) => Number(a.id) - Number(b.id))
  return morning
}

// Fills gaps in a /v1/morning response so the page can rely on the arrays.
export function normaliseMorning(date: string, value: Partial<Morning>): Morning {
  return {
    ...value,
    date: value.date ?? date,
    tides: [...(value.tides ?? [])].filter((t) => toMinutes(t.local ?? '') !== null).sort(byLocal),
    gates: [...(value.gates ?? [])].filter((g) => toMinutes(g.local ?? '') !== null).sort(byLocal),
    daylight: value.daylight ?? {},
    inshore: value.inshore ? { ...value.inshore, areas: value.inshore.areas ?? [] } : null,
  }
}

// Pairs open/close events into windows. A close with no earlier open means
// the gate opened the day before; an open with no close shuts after midnight.
export type GateWindow = { open: string | null; close: string | null }

export function gateWindows(gates: Morning['gates']): GateWindow[] {
  const windows: GateWindow[] = []
  let current: GateWindow | null = null
  for (const gate of gates) {
    if (gate.type === 'open') {
      if (current) windows.push(current)
      current = { open: gate.local, close: null }
    } else {
      windows.push({ open: current?.open ?? null, close: gate.local })
      current = null
    }
  }
  if (current) windows.push(current)
  return windows
}

export function gateOpenAt(windows: GateWindow[], minutes: number): boolean {
  return windows.some((w) => {
    const open = w.open === null ? 0 : (toMinutes(w.open) ?? 0)
    const close = w.close === null ? 24 * 60 : (toMinutes(w.close) ?? 24 * 60)
    return minutes >= open && minutes < close
  })
}

// Plain-text version of a sea forecast for pasting into the log book.
export function logText(title: string, forecast: SeaForecast, extra: string[] = []): string {
  return [
    title,
    ...extra,
    forecast.wind && `Wind: ${forecast.wind}`,
    forecast.sea && `Sea: ${forecast.sea}`,
    forecast.weather && `Weather: ${forecast.weather}`,
    forecast.visibility && `Visibility: ${forecast.visibility}`,
  ]
    .filter(Boolean)
    .join('\n')
}
