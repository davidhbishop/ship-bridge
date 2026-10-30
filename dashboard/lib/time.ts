// All times in the forecast store are UK local wall-clock times, so the
// dashboard works in Europe/London regardless of where it is hosted.

export const TIME_ZONE = 'Europe/London'

function parts(date: Date): Record<string, string> {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  return Object.fromEntries(formatted.map((p) => [p.type, p.value]))
}

// YYYYMMDD in London, matching the R2 folder names.
export function londonDateKey(date: Date): string {
  const p = parts(date)
  return `${p.year}${p.month}${p.day}`
}

// Minutes since local midnight in London.
export function londonMinutes(date: Date): number {
  const p = parts(date)
  return Number(p.hour) * 60 + Number(p.minute)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

// Accepts "HHMM" or "HH:MM".
export function toMinutes(time: string): number | null {
  const match = /^(\d{1,2}):?(\d{2})$/.exec(time.trim())
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

export function formatTime(time: string): string {
  const minutes = toMinutes(time)
  if (minutes === null) return time
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function formatDateKey(key: string): string {
  const date = new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(4, 6)) - 1, Number(key.slice(6, 8)), 12))
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

// London's offset from UTC in minutes (0 in winter, 60 in summer) at noon
// on the given YYYYMMDD date.
export function londonOffsetMinutes(dateKey: string): number {
  const noon = new Date(Date.UTC(Number(dateKey.slice(0, 4)), Number(dateKey.slice(4, 6)) - 1, Number(dateKey.slice(6, 8)), 12))
  return londonMinutes(noon) - 12 * 60
}

// Moves an HH:MM time by a number of minutes, wrapping round midnight.
export function shiftTime(time: string, delta: number): string {
  const minutes = toMinutes(time)
  if (minutes === null) return time
  const total = (((minutes + delta) % 1440) + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
