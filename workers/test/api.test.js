import { test } from 'node:test';
import assert from 'node:assert/strict';
import api from '../bridge-api/src/index.js';
import { buildDoc } from '../bridge-fetch/src/feeds/tides.js';

function bucket(objects) {
  const store = new Map(Object.entries(objects).map(([k, v]) => [k, JSON.stringify(v)]));
  return {
    store,
    async get(key) {
      if (!store.has(key)) return null;
      const body = store.get(key);
      return { json: async () => JSON.parse(body), uploaded: new Date(), body, httpEtag: '"x"' };
    },
    async put(key, value) { store.set(key, typeof value === 'string' ? value : JSON.stringify(value)); },
  };
}

const conwy = { id: 'conwy', name: 'Conwy', station: '0471A', gate: { open_h: -2, close_h: 3 } };
const tides = buildDoc(conwy, [
  { EventType: 'HighWater', DateTime: '2026-10-30T00:49:00', Height: 7.8 },
  { EventType: 'LowWater', DateTime: '2026-10-30T07:44:00', Height: 1.6 },
  { EventType: 'HighWater', DateTime: '2026-10-30T13:11:00', Height: 7.7 },
]);
const env = {
  API_KEY: 'k',
  FORECAST: bucket({
    'latest/tides-conwy.json': tides,
    'latest/shipping.json': { issued: 'x', general_synopsis: 'High', gale_warnings: [], areas: [{ name: 'Irish Sea', wind: 'SE 3 to 5' }, { name: 'Lundy', wind: 'E 4' }] },
    'latest/inshore.json': { issued: 'y', general_situation: 'Settled', areas: [{ id: 9 }, { id: 10 }, { id: 11 }, { id: 12 }] },
    'latest/alerts.json': { alerts: [{ code: 'gale' }], stale: { weather: true } },
  }),
};
const call = (path, init = {}) => api.fetch(new Request(`https://x${path}`, { ...init, headers: { 'X-Api-Key': 'k', ...(init.headers || {}) } }), env);

test('rejects a missing key', async () => {
  const res = await api.fetch(new Request('https://x/v1/morning'), env);
  assert.equal(res.status, 401);
});

test('/v1/morning shapes the home port day', async () => {
  const body = await (await call('/v1/morning?date=20261030')).json();
  assert.equal(body.date, '2026-10-30');
  assert.deepEqual(body.tides.map(t => [t.type, t.local]), [['high', '00:49'], ['low', '07:44'], ['high', '13:11']]);
  assert.deepEqual(body.gates.map(g => [g.type, g.local]), [['close', '03:49'], ['open', '11:11'], ['close', '16:11']]);
  assert.equal(body.shipping.area.name, 'Irish Sea');
  assert.deepEqual(body.inshore.areas.map(a => a.id), [9, 10, 11]);
  assert.equal(body.alerts[0].code, 'gale');
  assert.equal(body.ports.length, 4);
});

test('PUT /v1/settings validates', async () => {
  env.FORECAST.store.set('cache/stations.json', JSON.stringify([{ station: '0471A', name: 'Conwy', lat: 53.28, lon: -3.83 }]));
  const bad = await call('/v1/settings', { method: 'PUT', body: JSON.stringify({ ports: [{ id: 'conwy', station: 'nope' }], inshore_areas: [30] }) });
  assert.equal(bad.status, 400);
  const good = await call('/v1/settings', { method: 'PUT', body: JSON.stringify({ ports: [{ id: 'conwy', station: '0471A', home: true, gate: { open_h: -2, close_h: 3 } }], inshore_areas: ['11', '10'] }) });
  const saved = await good.json();
  assert.equal(good.status, 200);
  assert.deepEqual(saved.inshore_areas, [10, 11]);
  assert.equal(saved.ports[0].lat, 53.28);
  assert.ok(env.FORECAST.store.has('control/run.json'));
});
