import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fromDataJson, gateOpenAt, gateWindows } from './forecast.ts'
import { maxForce } from './alerts.ts'
import { createSession, verifySession, safeEqual } from './auth.ts'
import { londonOffsetMinutes } from './time.ts'

const records = [
  { time: '04:03', name: 'Conwy', event_type: 'lowwater', type: 'LowWater', depth: 1.1 },
  { time: '04:03', name: 'Conwy', event_type: 'lowwater', type: 'LowWater', depth: 1.1 },
  { time: '07:40', name: 'Conwy', event_type: 'gateopen', type: 'gateopen' },
  { time: '09:40', name: 'Conwy', event_type: 'highwater', type: 'HighWater', depth: 7.8 },
  { time: '12:40', name: 'Conwy', event_type: 'gateclose', type: 'gateclose' },
  { time: '07:13', name: 'Conwy', event_type: 'sunrise', type: 'sunrise' },
  { time: '04:29', name: 'Conwy', event_type: 'moonrise', type: 'moonrise', phase: 'Full Moon' },
  { time: '0900', name: 'HOLYHEAD', event_type: 'highwater', type: 'HighWater', depth: 5 },
  { time: '0000', name: 'inshore-forecast', event_type: '10', area: 'A10', warning: '', forecast: { wind: 'SW 4' } },
  { time: '0000', name: 'inshore-forecast', event_type: '3', area: 'A3', warning: '', forecast: {} },
]

test('data.json adapter dedupes, filters and corrects winter tide times', () => {
  const ports = [
    { id: 'conwy', name: 'Conwy', station: '0471A', gate: null },
    { id: 'holyhead', name: 'Holyhead', station: '0478', gate: null },
  ]
  const day = fromDataJson('20261030', records, ports, 'conwy', [10])
  assert.deepEqual(day.tides.map((t) => [t.type, t.local, t.height_m]), [
    ['low', '03:03', 1.1],
    ['high', '08:40', 7.8],
  ])
  assert.deepEqual(day.gates.map((g) => g.local), ['06:40', '11:40'])
  assert.equal(day.daylight.sunrise, '07:13') // scraped local time, not shifted
  assert.equal(day.daylight.moon_phase, 'Full Moon')
  assert.deepEqual(day.inshore?.areas.map((a) => a.id), ['10'])
  assert.deepEqual(day.ports?.find((p) => p.id === 'holyhead')?.tides.map((t) => t.local), ['08:00'])
  assert.equal(day.ports?.find((p) => p.id === 'conwy')?.tides.length, 2)
})

test('no tide correction in summer', () => {
  assert.equal(londonOffsetMinutes('20260701'), 60)
  const day = fromDataJson('20260701', records, [], 'conwy', [])
  assert.equal(day.tides[0].local, '04:03')
})

test('gate windows handle a close carried over from the day before', () => {
  const windows = gateWindows([
    { type: 'close', local: '01:10' },
    { type: 'open', local: '06:40' },
    { type: 'close', local: '11:40' },
    { type: 'open', local: '22:00' },
  ])
  assert.equal(gateOpenAt(windows, 30), true)
  assert.equal(gateOpenAt(windows, 120), false)
  assert.equal(gateOpenAt(windows, 7 * 60), true)
  assert.equal(gateOpenAt(windows, 23 * 60), true)
})

test('maxForce reads Met Office wind phrases', () => {
  assert.equal(maxForce('Southwest 4 to 6, occasionally 7 later.'), 7)
  assert.equal(maxForce('Westerly gale 8 to storm 10'), 10)
  assert.equal(maxForce('Cyclonic, severe gale'), 9)
  assert.equal(maxForce('Variable 3'), 3)
  assert.equal(maxForce(''), null)
})

test('session cookies verify, expire and reject tampering', async () => {
  process.env.SESSION_SECRET = 'x'.repeat(40)
  const { value } = await createSession(Date.now())
  assert.equal(await verifySession(value), true)
  assert.equal(await verifySession(value.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A'))), false)
  assert.equal(await verifySession(`${Date.now() + 1e9}.${value.split('.')[1]}`), false)
  const old = await createSession(Date.now() - 40 * 24 * 3600 * 1000)
  assert.equal(await verifySession(old.value), false)
  assert.equal(safeEqual('abc', 'abc'), true)
  assert.equal(safeEqual('abc', 'abd'), false)
  assert.equal(safeEqual('abc', 'abcd'), false)
})

import { validateSettings, DEFAULT_SETTINGS, SettingsError } from './settings.ts'

test('settings validation tidies input and rejects bad ports', () => {
  const ok = validateSettings({
    home_port: 'holyhead',
    inshore_areas: ['11', 9, '9', 99],
    ports: [
      { name: 'Conwy', station: '0471a', gate: { open_h: '-2', close_h: '3' } },
      { name: 'Holyhead', station: '0478', gate: null },
      { name: '', station: '' },
    ],
  })
  assert.deepEqual(ok.inshore_areas, [9, 11])
  assert.equal(ok.home_port, 'holyhead')
  assert.equal(ok.ports[0].station, '0471A')
  assert.deepEqual(ok.ports[0].gate, { open_h: -2, close_h: 3 })
  assert.equal(ok.ports.filter((p) => p.home).length, 1)
  assert.deepEqual(validateSettings(DEFAULT_SETTINGS).ports.map((p) => p.id), DEFAULT_SETTINGS.ports.map((p) => p.id))
  assert.throws(() => validateSettings({ ...DEFAULT_SETTINGS, inshore_areas: [] }), SettingsError)
  assert.throws(() => validateSettings({ ...DEFAULT_SETTINGS, ports: [{ name: 'X', station: 'abc', gate: null }] }), /station id/)
  assert.throws(() => validateSettings({ ...DEFAULT_SETTINGS, ports: [{ name: 'X', station: '0001', gate: { open_h: 3, close_h: -2 } }] }), /open before/)
})
