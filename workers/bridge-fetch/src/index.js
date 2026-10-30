import { getJson, putJson } from './lib/store.js';
import { runTides } from './feeds/tides.js';
import { runInshore } from './feeds/inshore.js';
import { runShipping } from './feeds/shipping.js';
import { runWeather } from './feeds/weather.js';
import { runDaylight } from './feeds/daylight.js';
import { runPressure } from './feeds/pressure.js';
import { runAlerts } from './feeds/alerts.js';
import { runSnapshot } from './feeds/snapshot.js';

const FEEDS = {
  tides: runTides,
  inshore: runInshore,
  shipping: runShipping,
  weather: runWeather,
  daylight: runDaylight,
  pressure: runPressure,
  alerts: runAlerts,
  snapshot: runSnapshot,
};

// The free plan allows 5 cron triggers per account, so one every-minute cron
// drives everything. Each feed gets its own minute so each run has its own
// subrequest and CPU budget. Times are UTC.
function due(date) {
  const h = date.getUTCHours();
  const m = date.getUTCMinutes();
  const feeds = [];
  if (m === 5 && h % 6 === 0) feeds.push('tides');
  if (m === 20) feeds.push('shipping');
  if (m === 25) feeds.push('inshore');
  if (m === 30 && h % 3 === 0) feeds.push('weather');
  if (m === 40 && h % 6 === 0) feeds.push('pressure');
  if (m === 15 && h === 0) feeds.push('daylight');
  if (m === 35) feeds.push('alerts');
  return feeds;
}

// Manual runs: write {"feeds":["tides"]} to R2 control/run.json (for example
// with the Cloudflare API); the next minute's run picks it up and deletes it.
const CONTROL_KEY = 'control/run.json';

async function run(env, feeds, logKey) {
  const results = {};
  for (const feed of feeds) {
    try {
      results[feed] = FEEDS[feed] ? await FEEDS[feed](env) : 'unknown feed';
    } catch (error) {
      console.error(feed, error.message);
      results[feed] = { error: error.message };
    }
  }
  if (logKey) await putJson(env, logKey, { at: new Date().toISOString(), results });
  return results;
}

export default {
  async scheduled(event, env) {
    // Awaited rather than passed to waitUntil, which only gets 30 seconds.
    const control = await getJson(env, CONTROL_KEY);
    if (control) {
      await env.FORECAST.delete(CONTROL_KEY);
      await run(env, control.feeds || [], 'control/last-run.json');
      return;
    }
    const feeds = due(new Date(event.scheduledTime));
    if (feeds.length) await run(env, feeds, `control/last-${feeds[0]}.json`);
  },

  async fetch(request, env) {
    if (!env.API_KEY || request.headers.get('X-Api-Key') !== env.API_KEY) {
      return new Response('Unauthorized', { status: 401 });
    }
    const { pathname } = new URL(request.url);
    const match = pathname.match(/^\/run\/([a-z]+)$/);
    if (!match || !FEEDS[match[1]]) {
      return Response.json({ feeds: Object.keys(FEEDS) }, { status: 404 });
    }
    return Response.json(await run(env, [match[1]]));
  },
};
