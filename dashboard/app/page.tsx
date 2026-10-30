import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AutoRefresh } from '@/components/AutoRefresh'
import { CopyButton } from '@/components/CopyButton'
import { ThemeToggle } from '@/components/ThemeToggle'
import { TideChart } from '@/components/TideChart'
import { buildAlerts } from '@/lib/alerts'
import { SESSION_COOKIE, verifySession } from '@/lib/auth'
import { config, isDemo, loadDay } from '@/lib/data'
import { gateOpenAt, gateWindows, logText } from '@/lib/forecast'
import type { Morning, SeaForecast } from '@/lib/morning'
import { addDays, formatDateKey, formatDuration, formatTime, londonDateKey, londonMinutes, toMinutes } from '@/lib/time'

const DAYS = ['Today', 'Tomorrow', 'Day after']

type Event = { time: string; label: string; extra?: string }

function events(day: Morning): Event[] {
  return [
    ...day.tides.map((t) => ({
      time: t.local,
      label: t.type === 'high' ? 'High water' : 'Low water',
      extra: t.height_m !== null ? `${t.height_m.toFixed(1)} m` : undefined,
    })),
    ...day.gates.map((g) => ({ time: g.local, label: g.type === 'open' ? 'Gate opens' : 'Gate closes' })),
  ].sort((a, b) => (toMinutes(a.time) ?? 0) - (toMinutes(b.time) ?? 0))
}

function until(from: number, to: number): string {
  return to >= from ? `in ${formatDuration(to - from)}` : `${formatDuration(from - to)} ago`
}

function Sea({ forecast }: { forecast: SeaForecast }) {
  return (
    <dl>
      {(['wind', 'sea', 'weather', 'visibility'] as const).map((key) =>
        forecast[key] ? (
          <div key={key} style={{ display: 'contents' }}>
            <dt>{key[0].toUpperCase() + key.slice(1)}</dt>
            <dd>{forecast[key]}</dd>
          </div>
        ) : null,
      )}
    </dl>
  )
}

export default async function Home({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  // proxy.ts already guards this page; check again here so the data is never
  // rendered without a session even if the proxy matcher changes.
  const store = await cookies()
  if (!(await verifySession(store.get(SESSION_COOKIE)?.value))) redirect('/login')

  const { day: dayParam } = await searchParams
  const offset = Math.min(Math.max(Number(dayParam) || 0, 0), DAYS.length - 1)
  const now = new Date()
  const dateKey = londonDateKey(addDays(now, offset))
  const nowMinutes = offset === 0 ? londonMinutes(now) : null

  const [{ day, error }, nextDay] = await Promise.all([
    loadDay(dateKey, offset),
    loadDay(londonDateKey(addDays(now, offset + 1)), offset + 1),
  ])
  const alerts = buildAlerts({ today: day, nowMinutes, error, demo: isDemo })
  const windows = day ? gateWindows(day.gates) : []
  const list = day ? events(day) : []
  const nextIndex = nowMinutes === null ? -1 : list.findIndex((e) => (toMinutes(e.time) ?? 0) >= nowMinutes)

  // Hero figures look past midnight into the next day when needed.
  const ref = nowMinutes ?? 0
  const tideAfter = (type: 'high' | 'low') => {
    const later = day?.tides.find((t) => t.type === type && (toMinutes(t.local) ?? 0) >= ref)
    if (later) return { tide: later, tomorrow: false }
    const next = nextDay.day?.tides.find((t) => t.type === type)
    return next ? { tide: next, tomorrow: true } : null
  }
  const nextHigh = tideAfter('high')
  const nextLow = tideAfter('low')
  const gateOpen = nowMinutes !== null && gateOpenAt(windows, nowMinutes)
  const gateChange = (() => {
    const wanted = gateOpen ? 'close' : 'open'
    const later = day?.gates.find((g) => g.type === wanted && (toMinutes(g.local) ?? 0) >= ref)
    if (later) return { gate: later, tomorrow: false }
    const next = nextDay.day?.gates.find((g) => g.type === wanted)
    return next ? { gate: next, tomorrow: true } : null
  })()

  const sunrise = day?.daylight.sunrise
  const sunset = day?.daylight.sunset
  const daylightMinutes =
    sunrise && sunset && toMinutes(sunset) !== null && toMinutes(sunrise) !== null
      ? toMinutes(sunset)! - toMinutes(sunrise)!
      : null

  const shipping = day?.shipping
  const inshore = day?.inshore

  return (
    <main className="page">
      <AutoRefresh />
      <header className="header">
        <div>
          <h1>{config.port}</h1>
          <div className="sub">
            {formatDateKey(dateKey)}
            {nowMinutes !== null && ` · ${formatTime(String(Math.floor(nowMinutes / 60)).padStart(2, '0') + ':' + String(nowMinutes % 60).padStart(2, '0'))} UK time`}
          </div>
        </div>
        <nav className="toolbar" aria-label="Day">
          {DAYS.map((label, i) => (
            <a key={label} className="chip" href={i ? `/?day=${i}` : '/'} aria-current={i === offset ? 'page' : undefined}>
              {label}
            </a>
          ))}
          <ThemeToggle />
          <form action="/logout" method="post">
            <button type="submit" className="chip">
              Sign out
            </button>
          </form>
        </nav>
      </header>

      {alerts.length > 0 && (
        <section className="alerts" aria-label="Alerts">
          {alerts.map((alert, i) => (
            <div key={i} className={`alert alert-${alert.severity}`} role={alert.severity === 'danger' ? 'alert' : undefined}>
              <strong>{alert.title}</strong>
              {alert.detail && <span>{alert.detail}</span>}
            </div>
          ))}
        </section>
      )}

      {day && (
        <div className="grid">
          <section className="card span-12">
            <div className="hero">
              {nowMinutes !== null && day.gates.length > 0 && (
                <div className="stat">
                  <div className="label">Conwy gate</div>
                  <div className={`value ${gateOpen ? 'open' : 'closed'}`}>{gateOpen ? 'Open' : 'Closed'}</div>
                  {gateChange && (
                    <div className="note">
                      {gateOpen ? 'Closes' : 'Opens'} {gateChange.tomorrow ? 'tomorrow ' : ''}
                      {formatTime(gateChange.gate.local)}
                      {!gateChange.tomorrow && ` (${until(nowMinutes, toMinutes(gateChange.gate.local)!)})`}
                    </div>
                  )}
                </div>
              )}
              {[
                ['High water', nextHigh],
                ['Low water', nextLow],
              ].map(([label, next]) => {
                const n = next as ReturnType<typeof tideAfter>
                return (
                  <div className="stat" key={label as string}>
                    <div className="label">{nowMinutes !== null ? `Next ${(label as string).toLowerCase()}` : `First ${(label as string).toLowerCase()}`}</div>
                    <div className="value">{n ? formatTime(n.tide.local) : '—'}</div>
                    {n && (
                      <div className="note">
                        {n.tide.height_m !== null && `${n.tide.height_m.toFixed(1)} m`}
                        {n.tomorrow
                          ? ' · tomorrow'
                          : nowMinutes !== null && ` · ${until(nowMinutes, toMinutes(n.tide.local)!)}`}
                      </div>
                    )}
                  </div>
                )
              })}
              <div className="stat">
                <div className="label">Sunrise</div>
                <div className="value">{sunrise ? formatTime(sunrise) : '—'}</div>
                <div className="note">
                  Sunset {sunset ? formatTime(sunset) : '—'}
                  {daylightMinutes !== null && ` · ${formatDuration(daylightMinutes)} daylight`}
                </div>
              </div>
            </div>
          </section>

          <section className="card span-8">
            <h2>Tides and gate</h2>
            <TideChart tides={day.tides} windows={windows} now={nowMinutes} />
            {list.length > 0 ? (
              <ul className="events">
                {list.map((e, i) => {
                  const past = nowMinutes !== null && (toMinutes(e.time) ?? 0) < nowMinutes
                  return (
                    <li key={i} className={past ? 'past' : i === nextIndex ? 'next' : undefined}>
                      <span className="time">{formatTime(e.time)}</span>
                      <span>{e.label}</span>
                      <span className="extra">{e.extra}</span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="muted">No tide times for this day.</p>
            )}
            <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 0 }}>
              Shaded: gate open. Heights above chart datum.
            </p>
          </section>

          <section className="card span-4">
            <h2>Sun and moon</h2>
            <div className="pairs">
              {(
                [
                  ['Sunrise', sunrise],
                  ['Sunset', sunset],
                  ['Moonrise', day.daylight.moonrise],
                  ['Moonset', day.daylight.moonset],
                ] as const
              ).map(([label, time]) => (
                <div className="stat" key={label}>
                  <div className="label">{label}</div>
                  <div className="value" style={{ fontSize: '1.4rem' }}>
                    {time ? formatTime(time) : '—'}
                  </div>
                </div>
              ))}
            </div>
            {day.daylight.moon_phase && <p style={{ marginBottom: 0 }}>Moon: {day.daylight.moon_phase}</p>}
          </section>

          {shipping && (
            <section className="card span-6">
              <h2>Shipping forecast{shipping.issued && ` · issued ${shipping.issued}`}</h2>
              {shipping.general_synopsis && <p>{shipping.general_synopsis}</p>}
              {(shipping.gale_warnings ?? []).map((w, i) => (
                <div key={i} className="warning-pill">
                  {w}
                </div>
              ))}
              {shipping.area && (
                <div className="area">
                  <h3>{shipping.area.name}</h3>
                  <Sea forecast={shipping.area} />
                  <CopyButton
                    text={logText(
                      `Shipping forecast${shipping.issued ? ` ${shipping.issued}` : ''} ${formatDateKey(dateKey)}`,
                      shipping.area,
                      [shipping.area.name ?? '', ...(shipping.gale_warnings ?? [])].filter(Boolean),
                    )}
                  />
                </div>
              )}
            </section>
          )}

          {inshore && inshore.areas.length > 0 && (
            <section className={`card ${shipping ? 'span-6' : 'span-12'}`}>
              <h2>Inshore waters forecast{inshore.issued && ` · issued ${inshore.issued}`}</h2>
              {inshore.general_situation && <p>{inshore.general_situation}</p>}
              {inshore.areas.map((area) => (
                <div className="area" key={area.id}>
                  <h3>{area.name}</h3>
                  {area.warning && <div className="warning-pill">{area.warning}</div>}
                  {area.next_24h && <Sea forecast={area.next_24h} />}
                  {area.outlook && (
                    <p className="muted">
                      Outlook:{' '}
                      {typeof area.outlook === 'string'
                        ? area.outlook
                        : [area.outlook.wind, area.outlook.sea, area.outlook.weather, area.outlook.visibility]
                            .filter(Boolean)
                            .join(' ')}
                    </p>
                  )}
                  {area.next_24h && (
                    <CopyButton
                      text={logText(
                        `Inshore forecast${inshore.issued ? ` ${inshore.issued}` : ''} ${formatDateKey(dateKey)}`,
                        area.next_24h,
                        [area.name, area.warning ?? ''].filter(Boolean),
                      )}
                    />
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      )}

      <footer className="footer">
        {isDemo ? 'Sample data' : 'Data: Admiralty, Met Office, tidetimes.org.uk via Cloudflare workers'}
        {day?.generated_at && ` · updated ${new Date(day.generated_at).toLocaleString('en-GB', { timeZone: 'Europe/London' })}`}
        {' · '}Not for navigation.
      </footer>
    </main>
  )
}
