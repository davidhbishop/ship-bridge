import { loadSettings, legacyName, USER_AGENT } from '../config.js';
import { putJson, replaceLegacyDay } from '../lib/store.js';
import { london, iso } from '../lib/time.js';

// Sun and moon times scraped from tidetimes.org.uk (local UK time already).
const URL = 'https://www.tidetimes.org.uk/PLACE-tide-times-DATE';
const TYPES = ['sunrise', 'sunset', 'moonrise', 'moonset'];

export async function runDaylight(env) {
  const { ports } = await loadSettings(env);
  const home = ports.find(p => p.home) || ports[0];
  const place = home.daylight || home.id;
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = london(new Date(Date.now() + i * 864e5));
    const response = await fetch(URL.replace('PLACE', place).replace('DATE', day.ymd), { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) continue;
    const sky = await parseSky(await response.text());
    days.push({ date: day.date, ...sky });

    const records = TYPES.filter(t => sky[t]).map(t => ({
      time: sky[t], event_type: t, type: t,
      ...(t === 'moonrise' ? { phase: sky.moon_phase, graphic: sky.moon_graphic } : {}),
    }));
    await replaceLegacyDay(env, day.ymd, [{ name: legacyName(home), types: TYPES, records }]);
  }
  await putJson(env, `latest/daylight-${home.id}.json`, { port: home.id, source: 'tidetimes', fetched_at: iso(new Date()), days });
  return { port: home.id, days: days.length };
}

async function parseSky(html) {
  const sky = { sunrise: null, sunset: null, moonrise: null, moonset: null, moon_phase: null, moon_graphic: null };
  const rows = { 2: 'sunrise', 3: 'sunset', 5: 'moonrise', 6: 'moonset' };
  const text = {};
  const rewriter = new HTMLRewriter();
  for (const [n, key] of Object.entries(rows)) {
    rewriter.on(`#phase > div:nth-child(${n}) span`, { text(t) { text[key] = (text[key] || '') + t.text; } });
  }
  rewriter
    .on('#phase > div:nth-child(4) img', { element(el) { sky.moon_graphic = el.getAttribute('src'); } })
    .on('#phase > p', { text(t) { text.phase = (text.phase || '') + t.text; } });
  await rewriter.transform(new Response(html)).text();

  for (const key of Object.values(rows)) {
    const m = (text[key] || '').match(/\d{2}:\d{2}/);
    sky[key] = m ? m[0] : null;
  }
  if (text.phase) sky.moon_phase = text.phase.replace(/^\s*Phase:\s*/i, '').replace(/\s+Moon\s*$/i, '').trim();
  return sky;
}
