import { loadSettings, legacyName } from '../config.js';
import { london, parseUtc, iso, addHours } from '../lib/time.js';
import { putJson, replaceLegacyDay } from '../lib/store.js';

const ADMIRALTY = 'https://admiraltyapi.azure-api.net/uktidalapi/api/V1/Stations/STATION/TidalEvents';
const LEGACY_TYPES = ['highwater', 'lowwater', 'gateopen', 'gateclose'];

export async function runTides(env) {
  const { ports } = await loadSettings(env);
  const results = [];
  const days = new Map();
  for (const port of ports) {
    try {
      const raw = await fetchEvents(env, port);
      const doc = buildDoc(port, raw);
      await putJson(env, `latest/tides-${port.id}.json`, doc);
      legacyGroups(port, doc, days);
      results.push({ port: port.id, events: doc.events.length });
    } catch (error) {
      console.error(`tides ${port.id}: ${error.message}`);
      results.push({ port: port.id, error: error.message });
    }
  }
  for (const [ymd, groups] of days) await replaceLegacyDay(env, ymd, groups);
  return results;
}

async function fetchEvents(env, port) {
  const response = await fetch(ADMIRALTY.replace('STATION', port.station), {
    headers: { 'Ocp-Apim-Subscription-Key': env.ADMIRALTY_KEY },
  });
  if (!response.ok) throw new Error(`Admiralty ${response.status}`);
  return response.json();
}

export function buildDoc(port, raw, now = new Date()) {
  const stamp = d => ({ at: iso(d), local: london(d).local, date: london(d).date });

  const events = raw.map(e => {
    const at = parseUtc(e.DateTime);
    return {
      type: e.EventType === 'HighWater' ? 'high' : 'low',
      ...stamp(at),
      height_m: Math.round(e.Height * 100) / 100,
      approx: Boolean(e.IsApproximateTime || e.IsApproximateHeight),
    };
  }).sort((a, b) => a.at.localeCompare(b.at));

  const windows = [];
  const gates = [];
  if (port.gate) {
    for (const hw of events.filter(e => e.type === 'high')) {
      const hwAt = new Date(hw.at);
      const open = addHours(hwAt, port.gate.open_h);
      const close = addHours(hwAt, port.gate.close_h);
      windows.push({ hw_at: hw.at, open_at: iso(open), close_at: iso(close), open_local: london(open).local, close_local: london(close).local });
      gates.push({ type: 'open', ...stamp(open), for_hw: hw.at });
      gates.push({ type: 'close', ...stamp(close), for_hw: hw.at });
    }
    gates.sort((a, b) => a.at.localeCompare(b.at));
  }

  return {
    port: port.id,
    name: port.name,
    station: port.station,
    source: 'admiralty',
    fetched_at: iso(now),
    gate: port.gate || null,
    events,
    gates,
    windows,
  };
}

function legacyGroups(port, doc, days) {
  const byDay = new Map();
  const add = (ymd, rec) => {
    if (!byDay.has(ymd)) byDay.set(ymd, []);
    byDay.get(ymd).push(rec);
  };
  for (const e of doc.events) {
    const type = e.type === 'high' ? 'HighWater' : 'LowWater';
    add(e.date.replaceAll('-', ''), { time: e.local, event_type: type.toLowerCase(), type, depth: e.height_m, at: e.at });
  }
  for (const g of doc.gates) {
    const type = `gate${g.type}`;
    add(g.date.replaceAll('-', ''), { time: g.local, event_type: type, type, at: g.at });
  }

  // The API window starts part way through today, so keep earlier records.
  const firstAt = doc.events[0]?.at;
  const first = firstAt ? london(new Date(firstAt)) : null;
  for (const [ymd, records] of byDay) {
    const keep = first && ymd === first.ymd ? r => String(r.time) < first.local : () => false;
    if (!days.has(ymd)) days.set(ymd, []);
    days.get(ymd).push({ name: legacyName(port), types: LEGACY_TYPES, records, keep });
  }
}
