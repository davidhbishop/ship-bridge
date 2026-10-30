import { USER_AGENT } from '../config.js';
import { parseMarinePage, period, issuedAt } from '../lib/marine.js';
import { putJson } from '../lib/store.js';
import { iso, todayLondon } from '../lib/time.js';

const URL = 'https://www.metoffice.gov.uk/weather/specialist-forecasts/coast-and-sea/inshore-waters-forecast';

export async function runInshore(env) {
  const response = await fetch(URL, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`Met Office inshore ${response.status}`);
  const page = await parseMarinePage(await response.text());

  const areas = page.areas.map((a, index) => {
    // Headings end with the area number, e.g. "Great Orme Head to the Mull of Galloway (11)".
    const number = Number((a.name.match(/\((\d+)\)\s*$/) || [])[1] || index + 1);
    return {
      id: number,
      name: a.name.replace(/\s*\(\d+\)\s*$/, ''),
      warning: a.warning,
      next_24h: period(a.periods[0]),
      outlook: period(a.periods[1]),
    };
  });
  if (!areas.length) throw new Error('inshore: no areas parsed');

  const doc = {
    source: 'metoffice-inshore',
    fetched_at: iso(new Date()),
    issued: issuedAt(page),
    issued_text: page.issuedText,
    general_situation: page.general,
    areas,
  };
  await putJson(env, 'latest/inshore.json', doc);
  await putJson(env, `archive/${todayLondon()}/inshore.json`, doc);

  // Legacy per-area files, still read by the inshore-forecast worker and TRMNL.
  const ymd = todayLondon();
  for (const a of areas) {
    await putJson(env, `${ymd}/0000-inshore-forecast-${a.id}.json`, {
      area: `${a.name} (${a.id})`, warning: a.warning, forecast: a.next_24h || {},
    });
    if (a.outlook) {
      await putJson(env, `${ymd}/0000-inshore-outlook-${a.id}.json`, {
        area: `${a.name} (${a.id})`, warning: a.warning, forecast: a.outlook,
      });
    }
  }
  return { areas: areas.length, issued: doc.issued || doc.issued_text };
}
