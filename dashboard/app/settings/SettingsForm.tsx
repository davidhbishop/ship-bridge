'use client'

import { useActionState, useEffect, useState } from 'react'
import { portId, type Port, type Settings } from '@/lib/settings'
import { save, type SaveState } from './actions'

type Station = { station: string; name: string; country?: string }

function StationSearch({ onPick }: { onPick: (station: Station) => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Station[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/stations?q=${encodeURIComponent(q.trim())}`, { signal: controller.signal })
        const body = await response.json()
        if (!response.ok) throw new Error(body.error ?? 'Search failed')
        setResults(body)
        setError(null)
      } catch (e) {
        if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Search failed')
      }
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [q])

  return (
    <div>
      <label className="field">
        Find a tidal station
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Beaumaris" />
      </label>
      {error && <p className="error">{error}</p>}
      {results.length > 0 && (
        <ul className="results">
          {results.map((s) => (
            <li key={s.station}>
              <button
                type="button"
                onClick={() => {
                  onPick(s)
                  setQ('')
                }}
              >
                {s.name} <span className="muted">· {s.station}{s.country ? ` · ${s.country}` : ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {q.trim().length >= 2 && results.length === 0 && !error && <p className="muted">No stations found.</p>}
    </div>
  )
}

export function SettingsForm({ initial, areas }: { initial: Settings; areas: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(save, { error: null, savedAt: null })
  const [settings, setSettings] = useState<Settings>(initial)

  // Show what the server actually stored after a save.
  useEffect(() => {
    if (state.settings) setSettings(state.settings)
  }, [state.settings])

  const setPort = (index: number, change: Partial<Port>) =>
    setSettings((s) => ({ ...s, ports: s.ports.map((p, i) => (i === index ? { ...p, ...change } : p)) }))

  const toggleArea = (id: number) =>
    setSettings((s) => ({
      ...s,
      inshore_areas: s.inshore_areas.includes(id) ? s.inshore_areas.filter((a) => a !== id) : [...s.inshore_areas, id].sort((a, b) => a - b),
    }))

  return (
    <form action={action} className="settings grid">
      <input type="hidden" name="settings" value={JSON.stringify(settings)} />

      <section className="card span-6">
        <h2>Inshore waters areas</h2>
        <fieldset>
          <legend className="muted" style={{ fontWeight: 400 }}>
            Shown on the dashboard and TRMNL, and checked for warnings.
          </legend>
          <div className="checks">
            {areas.map((area) => (
              <label key={area.id}>
                <input type="checkbox" checked={settings.inshore_areas.includes(area.id)} onChange={() => toggleArea(area.id)} />
                <span>
                  <strong>{area.id}</strong> {area.name}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="card span-6">
        <h2>Tidal ports</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          The home port shows on the main panel. Others are listed for passage planning. New ports get tide times from the
          next forecast run.
        </p>
        {settings.ports.map((port, i) => (
          <div className="port-row" key={i}>
            <label className="field">
              Name
              <input
                type="text"
                value={port.name}
                onChange={(e) => {
                  const id = portId(e.target.value)
                  setSettings((s) => ({
                    ...s,
                    home_port: s.home_port === port.id ? id : s.home_port,
                    ports: s.ports.map((p, j) => (j === i ? { ...p, name: e.target.value, id } : p)),
                  }))
                }}
              />
            </label>
            <label className="field">
              Station
              <input type="text" value={port.station} onChange={(e) => setPort(i, { station: e.target.value.toUpperCase() })} />
            </label>
            <div className="gate">
              <label>
                <input
                  type="radio"
                  name="home"
                  checked={settings.home_port === port.id}
                  onChange={() => setSettings((s) => ({ ...s, home_port: port.id }))}
                />{' '}
                Home port
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={port.gate !== null}
                  onChange={(e) => setPort(i, { gate: e.target.checked ? { open_h: -2, close_h: 3 } : null })}
                />{' '}
                Tidal gate
              </label>
              {port.gate && (
                <>
                  <label>
                    opens HW{' '}
                    <input
                      type="number"
                      min={-6}
                      max={6}
                      value={port.gate.open_h}
                      onChange={(e) => setPort(i, { gate: { ...port.gate!, open_h: Number(e.target.value) } })}
                    />{' '}
                    h
                  </label>
                  <label>
                    closes HW{' '}
                    <input
                      type="number"
                      min={-6}
                      max={6}
                      value={port.gate.close_h}
                      onChange={(e) => setPort(i, { gate: { ...port.gate!, close_h: Number(e.target.value) } })}
                    />{' '}
                    h
                  </label>
                </>
              )}
              <button
                type="button"
                className="button secondary"
                style={{ marginLeft: 'auto' }}
                onClick={() => setSettings((s) => ({ ...s, ports: s.ports.filter((_, j) => j !== i) }))}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <div className="port-row" style={{ display: 'block' }}>
          <StationSearch
            onPick={(station) =>
              setSettings((s) => ({
                ...s,
                ports: [...s.ports, { id: portId(station.name), name: station.name, station: station.station, gate: null }],
              }))
            }
          />
          <button
            type="button"
            className="button secondary"
            style={{ marginTop: 8 }}
            onClick={() => setSettings((s) => ({ ...s, ports: [...s.ports, { id: '', name: '', station: '', gate: null }] }))}
          >
            Add by station id
          </button>
        </div>
      </section>

      <section className="span-12" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="submit" className="button" disabled={pending}>
          {pending ? 'Saving…' : 'Save settings'}
        </button>
        {state.error && <span className="error">{state.error}</span>}
        {!state.error && state.savedAt && (
          <span className="saved">
            Saved.
            {state.nextFetchAt &&
              ` New ports will have tides after ${new Date(state.nextFetchAt).toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' })}.`}
          </span>
        )}
      </section>
    </form>
  )
}
