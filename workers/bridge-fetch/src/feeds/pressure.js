import { USER_AGENT } from '../config.js';
import { putJson } from '../lib/store.js';
import { iso } from '../lib/time.js';

const URL = 'https://www.metoffice.gov.uk/weather/maps-and-charts/surface-pressure';
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

export async function runPressure(env) {
  const response = await fetch(URL, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`Met Office pressure ${response.status}`);
  const charts = parseCharts(await response.text());
  if (!charts.length) throw new Error('pressure: no charts parsed');

  const doc = { source: 'metoffice-pressure', fetched_at: iso(new Date()), analysis: null, outlooks: [] };
  for (const chart of charts) {
    const image = await fetch(chart.url, { headers: { 'User-Agent': USER_AGENT } });
    if (!image.ok) continue;
    const key = `pressure/${chart.label}-${chart.style}.gif`;
    await env.FORECAST.put(key, await image.arrayBuffer(), { httpMetadata: { contentType: 'image/gif' } });

    let entry = chart.hours === 0 ? doc.analysis : doc.outlooks.find(o => o.hours === chart.hours);
    if (!entry) {
      entry = { hours: chart.hours, valid_at: chart.valid_at };
      if (chart.hours === 0) doc.analysis = entry;
      else doc.outlooks.push(entry);
    }
    entry[chart.style] = key;
  }
  doc.outlooks.sort((a, b) => a.hours - b.hours);
  await putJson(env, 'latest/pressure.json', doc);
  return { analysis: Boolean(doc.analysis), outlooks: doc.outlooks.length };
}

// Each chart is an element like id="chartBW0" data-value="18:00 UTC on Thu 29 Oct 2026"
// wrapping an <img>. The trailing digit is the 12-hour step (0 = analysis).
function parseCharts(html) {
  const charts = [];
  const re = /<[^>]+id="chart(BW|Colour)(\d+)"[^>]*data-value="([^"]+)"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/gi;
  for (const m of html.matchAll(re)) {
    const parts = m[3].trim().split(/\s+/);
    const [hh, mm] = parts[0].split(':').map(Number);
    const day = Number(parts[4]);
    const month = MONTHS[parts[5]?.slice(0, 3)];
    const year = Number(parts[6]);
    const valid = Number.isFinite(day) && month !== undefined ? iso(new Date(Date.UTC(year, month, day, hh, mm))) : null;
    charts.push({
      style: m[1].toLowerCase() === 'bw' ? 'bw' : 'colour',
      hours: Number(m[2]) * 12,
      label: Number(m[2]) === 0 ? 'analysis' : `t${Number(m[2]) * 12}`,
      valid_at: valid,
      url: m[4].startsWith('http') ? m[4] : `https://www.metoffice.gov.uk${m[4]}`,
    });
  }
  return charts;
}
