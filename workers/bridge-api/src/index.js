import { london, todayLondon } from '../../bridge-fetch/src/lib/time.js';
import { DEFAULT_SETTINGS } from '../../bridge-fetch/src/config.js';

const STATIONS_URL = 'https://admiraltyapi.azure-api.net/uktidalapi/api/V1/Stations';

export default {
  async fetch(request, env) {
    if (!env.API_KEY || request.headers.get('X-Api-Key') !== env.API_KEY) {
      return json({ error: 'unauthorized' }, 401);
    }
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');
    try {
      if (path === '/v1/settings' && request.method === 'GET') return json(await loadSettings(env));
      if (path === '/v1/settings' && request.method === 'PUT') return putSettings(env, request);
      if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405);

      if (path === '/v1/morning') return json(await morning(env, url));
      if (path === '/v1/tides') return json(await tides(env, url));
      if (path === '/v1/stations') return json(await stations(env, url.searchParams.get('q') || ''));
      if (path === '/v1/alerts') return latest(env, 'alerts.json');
      if (path === '/v1/inshore') return latest(env, 'inshore.json');
      if (path === '/v1/shipping') return latest(env, 'shipping.json');
      if (path === '/v1/pressure') return latest(env, 'pressure.json');
      if (path === '/v1/weather' || path === '/v1/daylight') {
        const settings = await loadSettings(env);
        const port = url.searchParams.get('port') || settings.home_port;
        return latest(env, `${path.slice(4)}-${port}.json`);
      }
      const chart = path.match(/^\/v1\/pressure\/(analysis|t\d+)\.gif$/);
      if (chart) return pressureImage(env, chart[1], url.searchParams.get('style') === 'colour' ? 'colour' : 'bw');
      return json({ error: 'not found' }, 404);
    } catch (error) {
      console.error(error);
      return json({ error: error.message }, 500);
    }
  },
};

function json(data, status = 200, maxAge = 60) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': status === 200 ? `private, max-age=${maxAge}` : 'no-store' },
  });
}

async function getJson(env, key) {
  const obj = await env.FORECAST.get(key);
  return obj ? obj.json() : null;
}

async function latest(env, name) {
  const doc = await getJson(env, `latest/${name}`);
  return doc ? json(doc) : json({ error: `no data for ${name}` }, 404);
}

async function loadSettings(env) {
  const saved = await getJson(env, 'config/settings.json');
  const settings = { ...DEFAULT_SETTINGS, ...(saved || {}) };
  settings.inshore_areas = settings.inshore_areas.map(Number);
  return settings;
}

// ---- settings -------------------------------------------------------------

async function putSettings(env, request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'body must be JSON' }, 400);
  }
  const errors = [];
  const ports = Array.isArray(body.ports) ? body.ports : [];
  if (!ports.length) errors.push('ports must be a non-empty array');

  const known = new Map((await stationList(env)).map(s => [s.station, s]));
  const ids = new Set();
  const cleanPorts = ports.map((p, i) => {
    const id = String(p.id || '').toLowerCase();
    if (!/^[a-z0-9-]{2,40}$/.test(id)) errors.push(`ports[${i}].id must be a lowercase slug`);
    if (ids.has(id)) errors.push(`ports[${i}].id "${id}" is duplicated`);
    ids.add(id);
    const station = known.get(String(p.station || ''));
    if (!station) errors.push(`ports[${i}].station "${p.station}" is not an Admiralty station`);
    let gate = null;
    if (p.gate) {
      const open = Number(p.gate.open_h);
      const close = Number(p.gate.close_h);
      if (!Number.isFinite(open) || !Number.isFinite(close) || open >= close || Math.abs(open) > 8 || Math.abs(close) > 8) {
        errors.push(`ports[${i}].gate needs open_h < close_h, both within ±8 hours`);
      }
      gate = { open_h: open, close_h: close };
    }
    return {
      id,
      name: String(p.name || station?.name || id).slice(0, 60),
      station: String(p.station || ''),
      lat: Number.isFinite(Number(p.lat)) ? Number(p.lat) : station?.lat ?? null,
      lon: Number.isFinite(Number(p.lon)) ? Number(p.lon) : station?.lon ?? null,
      gate,
      home: Boolean(p.home),
      ...(p.daylight ? { daylight: String(p.daylight) } : {}),
    };
  });
  if (cleanPorts.filter(p => p.home).length !== 1) errors.push('exactly one port must have home: true');

  const areas = (body.inshore_areas || []).map(Number);
  if (!areas.length || areas.some(a => !Number.isInteger(a) || a < 1 || a > 20)) errors.push('inshore_areas must be area numbers 1 to 20');

  const shippingAreas = body.shipping_areas ?? DEFAULT_SETTINGS.shipping_areas;
  if (!Array.isArray(shippingAreas) || !shippingAreas.length) errors.push('shipping_areas must be a non-empty array of sea area names');
  const gust = Number(body.alerts?.gust_kn ?? DEFAULT_SETTINGS.alerts.gust_kn);
  if (!Number.isFinite(gust) || gust < 5 || gust > 80) errors.push('alerts.gust_kn must be 5 to 80');

  if (errors.length) return json({ error: 'invalid settings', errors }, 400);

  const home = cleanPorts.find(p => p.home);
  const settings = {
    home_port: home.id,
    inshore_areas: [...new Set(areas)].sort((a, b) => a - b),
    shipping_areas: shippingAreas.map(String),
    alerts: { gust_kn: gust },
    ports: cleanPorts,
    updated_at: new Date().toISOString(),
  };
  await env.FORECAST.put('config/settings.json', JSON.stringify(settings), { httpMetadata: { contentType: 'application/json' } });
  // Ask bridge-fetch to refresh within a minute so new ports show up.
  await env.FORECAST.put('control/run.json', JSON.stringify({ feeds: ['tides', 'weather', 'alerts'] }));
  const next = new Date(Math.ceil(Date.now() / 60000) * 60000 + 60000);
  return json({ ...settings, next_fetch_at: next.toISOString() });
}

// ---- stations -------------------------------------------------------------

async function stationList(env) {
  const cached = await env.FORECAST.get('cache/stations.json');
  if (cached && Date.now() - cached.uploaded.getTime() < 7 * 864e5) return cached.json();

  const response = await fetch(STATIONS_URL, { headers: { 'Ocp-Apim-Subscription-Key': env.ADMIRALTY_KEY } });
  if (!response.ok) {
    if (cached) return cached.json();
    throw new Error(`Admiralty stations ${response.status}`);
  }
  const geo = await response.json();
  const list = (geo.features || []).map(f => ({
    station: f.properties.Id,
    name: f.properties.Name,
    country: f.properties.Country,
    lat: f.geometry?.coordinates?.[1] ?? null,
    lon: f.geometry?.coordinates?.[0] ?? null,
  }));
  await env.FORECAST.put('cache/stations.json', JSON.stringify(list), { httpMetadata: { contentType: 'application/json' } });
  return list;
}

async function stations(env, q) {
  const query = q.trim().toLowerCase();
  const list = await stationList(env);
  const hits = query ? list.filter(s => s.name.toLowerCase().includes(query) || s.station.toLowerCase() === query) : list;
  return hits.slice(0, 50);
}

// ---- tides ----------------------------------------------------------------

function parseDate(param) {
  const ymd = param && /^\d{8}$/.test(param) ? param : todayLondon();
  return { ymd, date: `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6)}` };
}

async function portDay(env, port, date) {
  const doc = await getJson(env, `latest/tides-${port.id}.json`);
  let events = (doc?.events || []).filter(e => e.date === date.date);
  let gates = (doc?.gates || []).filter(g => g.date === date.date);
  let windows = (doc?.windows || []).filter(w => [w.open_at, w.close_at, w.hw_at].some(t => london(new Date(t)).date === date.date));

  // Past days are no longer in latest/, so fall back to the legacy day file.
  if (!events.length) {
    const legacy = (await getJson(env, `${date.ymd}/data.json`)) || [];
    const ours = legacy.filter(r => (r.name || '').toLowerCase() === (port.id === 'conwy' ? 'conwy' : port.id) && r.at);
    events = ours.filter(r => /^(high|low)water$/.test(r.event_type))
      .map(r => ({ type: r.event_type.startsWith('high') ? 'high' : 'low', at: r.at, local: r.time, date: date.date, height_m: r.depth }));
    gates = ours.filter(r => /^gate(open|close)$/.test(r.event_type))
      .map(r => ({ type: r.event_type.slice(4), at: r.at, local: r.time, date: date.date }));
  }
  const strip = e => ({ type: e.type, at: e.at, local: e.local, height_m: e.height_m });
  events = dedupe(events.map(strip)).sort(byAt);
  gates = dedupe(gates.map(g => ({ type: g.type, at: g.at, local: g.local, for_hw: g.for_hw ?? null }))).sort(byAt);
  return { events, gates, windows, fetched_at: doc?.fetched_at ?? null };
}

const byAt = (a, b) => a.at.localeCompare(b.at);
function dedupe(list) {
  const seen = new Set();
  return list.filter(x => !seen.has(x.type + x.at) && seen.add(x.type + x.at));
}

async function tides(env, url) {
  const settings = await loadSettings(env);
  const port = settings.ports.find(p => p.id === (url.searchParams.get('port') || settings.home_port));
  if (!port) return { error: 'unknown port' };
  const days = Math.min(Math.max(Number(url.searchParams.get('days') || 3), 1), 7);
  const start = parseDate(url.searchParams.get('date'));
  const out = [];
  for (let i = 0; i < days; i++) {
    const noon = new Date(Date.UTC(+start.ymd.slice(0, 4), +start.ymd.slice(4, 6) - 1, +start.ymd.slice(6) + i, 12));
    const d = london(noon);
    const day = await portDay(env, port, { ymd: d.ymd, date: d.date });
    out.push({ date: d.date, tides: day.events, gates: day.gates, windows: day.windows });
  }
  return { port: port.id, name: port.name, station: port.station, gate: port.gate, days: out };
}

// ---- morning --------------------------------------------------------------

async function morning(env, url) {
  const settings = await loadSettings(env);
  const date = parseDate(url.searchParams.get('date'));
  const home = settings.ports.find(p => p.id === settings.home_port) || settings.ports[0];

  const [homeDay, daylight, shipping, inshore, weather, alerts, pressure] = await Promise.all([
    portDay(env, home, date),
    getJson(env, `latest/daylight-${home.id}.json`),
    getJson(env, 'latest/shipping.json'),
    getJson(env, 'latest/inshore.json'),
    getJson(env, `latest/weather-${home.id}.json`),
    getJson(env, 'latest/alerts.json'),
    getJson(env, 'latest/pressure.json'),
  ]);

  const ports = [];
  for (const port of settings.ports.filter(p => p.id !== home.id)) {
    const day = await portDay(env, port, date);
    ports.push({ id: port.id, name: port.name, station: port.station, tides: day.events });
  }

  const wanted = settings.shipping_areas.map(s => s.toLowerCase());
  const shippingAreas = (shipping?.areas || []).filter(a => wanted.includes(a.name.toLowerCase()));
  const sky = daylight?.days?.find(d => d.date === date.date) || null;
  const chartUrl = (label, has) => (has ? `/v1/pressure/${label}.gif` : null);

  return {
    date: date.date,
    generated_at: new Date().toISOString(),
    port: home.id,
    port_name: home.name,
    tides: homeDay.events,
    gates: homeDay.gates,
    windows: homeDay.windows,
    daylight: sky && { sunrise: sky.sunrise, sunset: sky.sunset, moonrise: sky.moonrise, moonset: sky.moonset, moon_phase: sky.moon_phase },
    shipping: shipping && {
      issued: shipping.issued,
      issued_text: shipping.issued_text,
      general_synopsis: shipping.general_synopsis,
      gale_warnings: shipping.gale_warnings,
      area: shippingAreas[0] || null,
      areas: shippingAreas,
    },
    inshore: inshore && {
      issued: inshore.issued,
      issued_text: inshore.issued_text,
      general_situation: inshore.general_situation,
      areas: inshore.areas.filter(a => settings.inshore_areas.includes(a.id)),
    },
    weather: (weather?.periods || []).filter(p => p.date === date.date).map(p => ({
      at: p.at, local: p.local, wind_kn: p.wind_kn, gust_kn: p.gust_kn, dir: p.dir, temp_c: p.temp_c,
      precip_pct: p.precip_pct, pressure_hpa: p.pressure_hpa, summary: p.summary,
    })),
    alerts: alerts?.alerts || [],
    pressure: pressure && {
      analysis: pressure.analysis && { valid_at: pressure.analysis.valid_at, url: chartUrl('analysis', pressure.analysis.bw) },
      outlooks: pressure.outlooks.map(o => ({ hours: o.hours, valid_at: o.valid_at, url: chartUrl(`t${o.hours}`, o.bw) })),
    },
    ports,
    stale: alerts?.stale || {},
  };
}

async function pressureImage(env, label, style) {
  const obj = await env.FORECAST.get(`pressure/${label}-${style}.gif`);
  if (!obj) return json({ error: 'chart not found' }, 404);
  return new Response(obj.body, { headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'private, max-age=600', ETag: obj.httpEtag } });
}
