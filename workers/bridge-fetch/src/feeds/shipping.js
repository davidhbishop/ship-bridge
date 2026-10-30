import { USER_AGENT } from '../config.js';
import { parseMarinePage, period, issuedAt } from '../lib/marine.js';
import { putJson } from '../lib/store.js';
import { iso, todayLondon } from '../lib/time.js';

const URL = 'https://www.metoffice.gov.uk/weather/specialist-forecasts/coast-and-sea/shipping-forecast';

export async function runShipping(env) {
  const response = await fetch(URL, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`Met Office shipping ${response.status}`);
  const page = await parseMarinePage(await response.text());

  // The page repeats some cards (FitzRoy, Sole) and Trafalgar's heading
  // carries its own issue time, so name areas by the card id and keep one each.
  const seen = new Set();
  const areas = [];
  for (const a of page.areas) {
    const name = a.id || a.name.replace(/\s*\(.*\)\s*$/, '');
    const id = slug(name);
    if (seen.has(id)) continue;
    seen.add(id);
    const note = (a.name.match(/\(([^)]*)\)\s*$/) || [])[1] || null;
    areas.push({
      id,
      name,
      ...(note ? { note } : {}),
      warning: a.warning,
      gale: a.warned || /gale|storm|hurricane/i.test(a.warning),
      ...period(a.periods[0]),
    });
  }
  if (!areas.length) throw new Error('shipping: no areas parsed');

  const doc = {
    source: 'metoffice-shipping',
    fetched_at: iso(new Date()),
    issued: issuedAt(page),
    issued_text: page.issuedText,
    general_synopsis: page.general,
    gale_warnings: areas.filter(a => a.gale).map(a => a.name),
    areas,
  };
  await putJson(env, 'latest/shipping.json', doc);
  // One copy per issue time for the log.
  const stamp = (doc.issued || doc.fetched_at).replace(/[^0-9]/g, '').slice(0, 12);
  await putJson(env, `archive/${todayLondon()}/shipping-${stamp}.json`, doc);
  return { areas: areas.length, gales: doc.gale_warnings, issued: doc.issued || doc.issued_text };
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
