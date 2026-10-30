// Turns the day's forecast into the short list of things worth noticing on
// waking: warnings, strong wind, poor visibility, gate timing and data gaps.

import type { Morning } from './morning.ts'
import { gateWindows } from './forecast.ts'
import { formatDuration, formatTime, toMinutes } from './time.ts'

export type Severity = 'danger' | 'warning' | 'info'
export type Alert = { severity: Severity; title: string; detail: string }

// Beaufort force at or above which wind is flagged.
export const STRONG_WIND_FORCE = 6
export const GALE_FORCE = 8

// Highest Beaufort force mentioned in a Met Office wind phrase such as
// "Southwest 5 to 7, occasionally gale 8 later". Words count too.
export function maxForce(wind: string): number | null {
  const lower = wind.toLowerCase()
  let max: number | null = null
  for (const match of lower.matchAll(/\b(\d{1,2})\b/g)) {
    const n = Number(match[1])
    if (n >= 0 && n <= 12) max = Math.max(max ?? 0, n)
  }
  const words: [RegExp, number][] = [
    [/hurricane/, 12],
    [/violent storm/, 11],
    [/\bstorm\b/, 10],
    [/severe gale/, 9],
    [/\bgale\b/, 8],
  ]
  for (const [pattern, force] of words) {
    if (pattern.test(lower)) {
      max = Math.max(max ?? 0, force)
      break
    }
  }
  return max
}

function severityOf(level: string | undefined): Severity {
  const value = (level ?? '').toLowerCase()
  if (/danger|severe|red|high|critical|gale/.test(value)) return 'danger'
  if (/warn|amber|medium|caution/.test(value)) return 'warning'
  return 'info'
}

// Alerts worked out from the forecast text, for sources (the legacy
// data.json) that do not send their own.
function forecastAlerts(today: Morning): Alert[] {
  const alerts: Alert[] = []
  for (const warning of today.shipping?.gale_warnings ?? []) {
    alerts.push({ severity: 'danger', title: 'Gale warning', detail: warning })
  }
  const seas = [
    ...(today.shipping?.area ? [{ name: today.shipping.area.name ?? 'Shipping area', warning: '', ...today.shipping.area }] : []),
    ...(today.inshore?.areas ?? []).map((a) => ({ name: a.name, warning: a.warning ?? '', ...(a.next_24h ?? {}) })),
  ]
  // One alert per kind, naming every area it applies to, so a windy day
  // gives one line rather than one per sea area.
  let strongest = 0
  const windy: string[] = []
  const murky: string[] = []
  for (const sea of seas) {
    if (sea.warning) alerts.push({ severity: 'danger', title: sea.warning, detail: sea.name })
    const force = maxForce(sea.wind ?? '')
    if (force !== null && force >= STRONG_WIND_FORCE) {
      strongest = Math.max(strongest, force)
      windy.push(`${sea.name}: ${sea.wind}`)
    }
    if (/\bpoor\b/i.test(sea.visibility ?? '')) murky.push(`${sea.name}: ${sea.visibility}`)
  }
  if (windy.length) {
    alerts.push({
      severity: strongest >= GALE_FORCE ? 'danger' : 'warning',
      title: strongest >= GALE_FORCE ? `Gale force ${strongest} forecast` : `Strong wind, up to force ${strongest}`,
      detail: windy.join(' · '),
    })
  }
  if (murky.length) alerts.push({ severity: 'warning', title: 'Poor visibility at times', detail: murky.join(' · ') })
  return alerts
}

export function buildAlerts(input: {
  today: Morning | null
  nowMinutes: number | null
  error: string | null
  demo: boolean
}): Alert[] {
  const alerts: Alert[] = []
  const { today, nowMinutes, error, demo } = input

  if (demo) {
    alerts.push({
      severity: 'info',
      title: 'Showing sample data',
      detail: 'Set FORECAST_API_URL and FORECAST_API_KEY to show live forecasts.',
    })
  }
  if (error) {
    alerts.push({ severity: 'warning', title: 'Forecast data unavailable', detail: error })
  }
  if (!today) return alerts

  if (today.alerts) {
    for (const alert of today.alerts) {
      alerts.push({ severity: severityOf(alert.level), title: alert.title, detail: alert.detail ?? alert.source ?? '' })
    }
  } else {
    alerts.push(...forecastAlerts(today))
  }

  if (!error && today.tides.length === 0) {
    alerts.push({ severity: 'warning', title: 'No tide times for this day', detail: 'The tidal worker may not have run.' })
  }
  if (!error && !today.shipping && (today.inshore?.areas.length ?? 0) === 0) {
    alerts.push({
      severity: 'warning',
      title: 'No sea forecast for this day',
      detail: 'The forecast workers may not have run yet.',
    })
  }

  // Gate closing within two hours while it is open (today only).
  if (nowMinutes !== null) {
    for (const window of gateWindows(today.gates)) {
      const open = window.open ? toMinutes(window.open) : null
      const close = window.close ? toMinutes(window.close) : null
      if (close !== null && close > nowMinutes && close - nowMinutes <= 120 && (open === null || open <= nowMinutes)) {
        alerts.push({
          severity: 'warning',
          title: `Gate closes in ${formatDuration(close - nowMinutes)}`,
          detail: `Closes at ${formatTime(window.close!)}`,
        })
      }
    }
  }

  const rank: Record<Severity, number> = { danger: 0, warning: 1, info: 2 }
  return alerts.sort((a, b) => rank[a.severity] - rank[b.severity])
}
