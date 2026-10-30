/**
 * Met Office surface pressure charts from R2.
 *
 * The pressure worker files each chart under the day and time it is valid for,
 * with the forecast lead in the name:
 *   YYYYMMDD/HHMM-pressure-map-outlook-bw-<lead>-hrs.gif   (HHMM is 0000 or 1200 UTC)
 * The same valid time is usually covered by several leads, so we pick the
 * shortest one, which is the most recent forecast.
 */

const HOUR = 60 * 60 * 1000;
const SLOT = 12 * HOUR;

// Keep showing a chart for a few hours after its valid time before moving on.
const GRACE = 3 * HOUR;

export async function pressureCharts(env, now, origin) {
  const first = Math.ceil((now.getTime() - GRACE) / SLOT) * SLOT;
  const charts = [];

  for (let n = 0; n < 4 && charts.length < 3; n++) {
    const at = first + n * SLOT;
    const found = await freshestChart(env, slotKey(at));
    if (!found) continue;
    charts.push({
      valid: `${formatValid(at, { weekday: "short", day: "numeric", month: "short" })} ${formatValid(at, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}`,
      valid_day: formatValid(at, { weekday: "short", day: "numeric", month: "short" }),
      valid_time: formatValid(at, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
      valid_utc: `${new Date(at).toISOString().slice(11, 16)} UTC`,
      lead: `${found.lead}h`,
      url: `${origin}/pressure/${slotKey(at).replace("-", "/")}.gif`,
    });
  }

  return { known: charts.length > 0, chart: charts[0] || null, charts };
}

export async function pressureImage(env, folder, hhmm) {
  const found = await freshestChart(env, `${folder}-${hhmm}`);
  if (!found) return new Response("Not found", { status: 404 });

  const object = await env.FORECAST.get(found.key);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body, {
    headers: { "Content-Type": "image/gif", "Cache-Control": "public, max-age=1800" },
  });
}

async function freshestChart(env, slot) {
  const [folder, hhmm] = slot.split("-");
  const listing = await env.FORECAST.list({ prefix: `${folder}/${hhmm}-pressure-map-outlook-bw-` });
  let best = null;
  for (const obj of listing.objects) {
    const match = obj.key.match(/-(\d+)-hrs\.gif$/);
    if (!match) continue;
    const lead = Number(match[1]);
    if (!best || lead < best.lead) best = { key: obj.key, lead };
  }
  return best;
}

function slotKey(t) {
  const d = new Date(t);
  const folder = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `${folder}-${String(d.getUTCHours()).padStart(2, "0")}00`;
}

function formatValid(t, options) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", ...options }).format(new Date(t));
}
