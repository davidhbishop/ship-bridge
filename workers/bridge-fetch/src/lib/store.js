export async function getJson(env, key) {
  const obj = await env.FORECAST.get(key);
  if (!obj) return null;
  try {
    return await obj.json();
  } catch {
    return null;
  }
}

export async function putJson(env, key, data) {
  await env.FORECAST.put(key, JSON.stringify(data), {
    httpMetadata: { contentType: 'application/json' },
  });
}

/**
 * Legacy day file YYYYMMDD/data.json is still read by TRMNL and the old read
 * workers. Replace each feed's records instead of appending, so re-runs never
 * duplicate. Workers allow 1000 R2 calls per run, so one day costs 4 calls:
 * list, get, put, and one bulk delete of the old per-event files, which
 * nothing reads any more.
 *
 * groups: [{ name, types: [event_type], records: [...], keep?: record => bool }]
 */
export async function replaceLegacyDay(env, ymd, groups) {
  const dataKey = `${ymd}/data.json`;
  let records = (await getJson(env, dataKey)) || [];
  const patterns = [];
  for (const g of groups) {
    const lname = g.name.toLowerCase();
    const types = new Set(g.types);
    const keep = g.keep || (() => false);
    records = records.filter(r => !((r.name || '').toLowerCase() === lname && types.has((r.event_type || '').toLowerCase())) || keep(r));
    records.push(...g.records.map(r => ({ name: g.name, ...r })));
    patterns.push(new RegExp(`^${ymd}/\\d{4}-${lname}-(${[...types].join('|')})\\.json$`));
  }
  records.sort((a, b) => String(a.time).localeCompare(String(b.time)));
  await putJson(env, dataKey, dedupe(records));

  const listed = await env.FORECAST.list({ prefix: `${ymd}/` });
  const stale = listed.objects.map(o => o.key).filter(k => patterns.some(p => p.test(k)));
  if (stale.length) await env.FORECAST.delete(stale);
}

function dedupe(records) {
  const seen = new Set();
  return records.filter(r => {
    const k = JSON.stringify([String(r.name).toLowerCase(), r.event_type, r.time]);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
