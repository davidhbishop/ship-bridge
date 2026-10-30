// Dashboard settings, shared with the workers and TRMNL through bridge-api,
// which keeps them in R2 at config/settings.json.

export type Port = {
  id: string
  name: string
  // Admiralty UK Tidal API station id, e.g. 0471A for Conwy.
  station: string
  gate: { open_h: number; close_h: number } | null
  home?: boolean
}

export type Settings = {
  home_port: string
  inshore_areas: number[]
  ports: Port[]
  updated_at?: string
}

// Met Office inshore waters forecast areas, in the order the forecast page lists them.
export const INSHORE_AREAS: { id: number; name: string }[] = [
  { id: 1, name: 'Cape Wrath to Rattray Head including Orkney' },
  { id: 2, name: 'Rattray Head to Berwick-upon-Tweed' },
  { id: 3, name: 'Berwick-upon-Tweed to Whitby' },
  { id: 4, name: 'Whitby to Gibraltar Point' },
  { id: 5, name: 'Gibraltar Point to North Foreland' },
  { id: 6, name: 'North Foreland to Selsey Bill' },
  { id: 7, name: 'Selsey Bill to Lyme Regis' },
  { id: 8, name: "Lyme Regis to Land's End including the Isles of Scilly" },
  { id: 9, name: "Land's End to St David's Head including the Bristol Channel" },
  { id: 10, name: "St David's Head to Great Orme Head including St George's Channel" },
  { id: 11, name: 'Great Orme Head to the Mull of Galloway' },
  { id: 12, name: 'Isle of Man' },
  { id: 13, name: 'Lough Foyle to Carlingford Lough' },
  { id: 14, name: 'Mull of Galloway to Mull of Kintyre including the Firth of Clyde and the North Channel' },
  { id: 15, name: 'Mull of Kintyre to Ardnamurchan Point' },
  { id: 16, name: 'Ardnamurchan Point to Cape Wrath' },
  { id: 17, name: 'Shetland Isles' },
]

export const DEFAULT_SETTINGS: Settings = {
  home_port: 'conwy',
  inshore_areas: [9, 10, 11],
  ports: [
    { id: 'conwy', name: 'Conwy', station: '0471A', gate: { open_h: -2, close_h: 3 }, home: true },
    { id: 'holyhead', name: 'Holyhead', station: '0478', gate: null },
    { id: 'liverpool', name: 'Liverpool', station: '0451', gate: null },
    { id: 'milfordhaven', name: 'Milford Haven', station: '0496', gate: null },
    { id: 'dover', name: 'Dover', station: '0089', gate: null },
  ],
}

export function portId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

export class SettingsError extends Error {}

function hours(value: unknown, label: string): number {
  const n = Number(value)
  if (!Number.isInteger(n) || n < -6 || n > 6) throw new SettingsError(`${label} must be a whole number of hours from -6 to 6`)
  return n
}

// Checks and tidies settings from the form or the API. Throws SettingsError
// with a message fit to show the user.
export function validateSettings(input: unknown): Settings {
  const value = (input ?? {}) as Partial<Settings>
  const known = new Set(INSHORE_AREAS.map((a) => a.id))
  const areas = [...new Set((value.inshore_areas ?? []).map(Number))].filter((id) => known.has(id))
  areas.sort((a, b) => a - b)
  if (areas.length === 0) throw new SettingsError('Choose at least one inshore area')

  const ports: Port[] = []
  for (const raw of value.ports ?? []) {
    const name = String(raw?.name ?? '').trim()
    const station = String(raw?.station ?? '').trim().toUpperCase()
    if (!name && !station) continue
    if (!name) throw new SettingsError(`Port with station ${station} needs a name`)
    if (!/^[0-9]{4}[A-Z]?$/.test(station)) {
      throw new SettingsError(`${name}: station id should look like 0471A or 0478`)
    }
    const id = portId(name)
    if (!id) throw new SettingsError(`${name}: name needs letters or numbers`)
    if (ports.some((p) => p.id === id)) throw new SettingsError(`${name} is listed twice`)
    const gate = raw?.gate ? { open_h: hours(raw.gate.open_h, `${name} gate open`), close_h: hours(raw.gate.close_h, `${name} gate close`) } : null
    if (gate && gate.open_h >= gate.close_h) throw new SettingsError(`${name}: gate must open before it closes`)
    ports.push({ id, name, station, gate })
  }
  if (ports.length === 0) throw new SettingsError('Add at least one tidal port')
  if (ports.length > 12) throw new SettingsError('Up to 12 tidal ports')

  const home = ports.find((p) => p.id === String(value.home_port ?? '')) ?? ports[0]
  for (const port of ports) port.home = port.id === home.id

  return { home_port: home.id, inshore_areas: areas, ports }
}
