import { loadSettings } from '../config.js';
import { getJson, putJson } from '../lib/store.js';
import { iso } from '../lib/time.js';

const STALE_HOURS = { tides: 13, inshore: 13, shipping: 13, weather: 7 };

// Derives alerts from the latest/*.json files written by the other feeds.
export async function runAlerts(env) {
  const settings = await loadSettings(env);
  const home = settings.ports.find(p => p.home) || settings.ports[0];
  const gustLimit = settings.alerts?.gust_kn ?? 25;
  const shippingAreas = (settings.shipping_areas || ['Irish Sea']).map(s => s.toLowerCase());

  const [shipping, inshore, weather, tides] = await Promise.all([
    getJson(env, 'latest/shipping.json'),
    getJson(env, 'latest/inshore.json'),
    getJson(env, `latest/weather-${home.id}.json`),
    getJson(env, `latest/tides-${home.id}.json`),
  ]);
  const alerts = [];

  for (const area of shipping?.areas || []) {
    if (area.gale && shippingAreas.includes(area.name.toLowerCase())) {
      alerts.push({ level: 'warning', code: 'gale', title: `Gale warning: ${area.name}`, detail: area.warning, source: 'shipping', issued: shipping.issued });
    }
  }
  for (const area of inshore?.areas || []) {
    if (settings.inshore_areas.includes(area.id) && area.warning) {
      alerts.push({ level: 'warning', code: 'strong-wind', title: `${area.warning}: inshore area ${area.id}`, detail: area.name, source: 'inshore', issued: inshore.issued });
    }
  }
  const horizon = Date.now() + 24 * 3600e3;
  const gusty = (weather?.periods || []).filter(p => new Date(p.at) <= horizon && new Date(p.at) >= Date.now() - 3 * 3600e3 && (p.gust_kn ?? 0) >= gustLimit);
  if (gusty.length) {
    const peak = gusty.reduce((a, b) => (b.gust_kn > a.gust_kn ? b : a));
    alerts.push({ level: 'warning', code: 'gusts', title: `Gusts to ${peak.gust_kn} kn at ${home.name}`, detail: `Peak around ${peak.local}, wind ${peak.dir || ''} ${peak.wind_kn} kn`.trim(), source: 'weather', issued: weather.fetched_at });
  }

  const feeds = { tides, inshore, shipping, weather };
  const stale = {};
  for (const [name, doc] of Object.entries(feeds)) {
    const age = doc ? (Date.now() - new Date(doc.fetched_at)) / 3600e3 : Infinity;
    stale[name] = age > STALE_HOURS[name];
    if (stale[name] && !(name === 'weather' && !doc)) {
      alerts.push({ level: 'info', code: 'stale', title: `${name} data is out of date`, detail: doc ? `Last updated ${doc.fetched_at}` : 'No data yet', source: name, issued: null });
    }
  }

  const doc = { generated_at: iso(new Date()), alerts, stale };
  await putJson(env, 'latest/alerts.json', doc);
  return { alerts: alerts.length };
}
