import { loadSettings } from '../config.js';
import { putJson } from '../lib/store.js';
import { london, iso } from '../lib/time.js';

// Met Office Weather DataHub, site-specific three-hourly forecast.
const URL = 'https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/three-hourly';
const MS_TO_KN = 1.943844;
const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

export async function runWeather(env) {
  if (!env.DATAHUB_KEY) return { skipped: 'DATAHUB_KEY not set' };
  const settings = await loadSettings(env);
  const results = [];
  for (const port of settings.ports.filter(p => p.home || p.weather)) {
    if (port.lat == null || port.lon == null) continue;
    const url = `${URL}?latitude=${port.lat}&longitude=${port.lon}&includeLocationName=true`;
    const response = await fetch(url, { headers: { apikey: env.DATAHUB_KEY, accept: 'application/json' } });
    if (!response.ok) {
      results.push({ port: port.id, error: `DataHub ${response.status}` });
      continue;
    }
    const json = await response.json();
    const feature = json.features?.[0];
    const series = feature?.properties?.timeSeries || [];
    const doc = {
      port: port.id,
      source: 'metoffice-datahub',
      fetched_at: iso(new Date()),
      model_run: feature?.properties?.modelRunDate || null,
      location: feature?.properties?.location?.name || port.name,
      periods: series.map(p => {
        const at = new Date(p.time);
        return {
          at: iso(at),
          local: london(at).local,
          date: london(at).date,
          wind_kn: round(p.windSpeed10m * MS_TO_KN),
          gust_kn: round(p.windGustSpeed10m * MS_TO_KN),
          max_gust_kn: round(p.max10mWindGust * MS_TO_KN),
          dir_deg: p.windDirectionFrom10m,
          dir: p.windDirectionFrom10m == null ? null : COMPASS[Math.round(p.windDirectionFrom10m / 22.5) % 16],
          temp_c: p.maxScreenAirTemp ?? p.screenTemperature ?? null,
          feels_c: p.feelsLikeTemp ?? null,
          precip_pct: p.probOfPrecipitation ?? null,
          visibility_m: p.visibility ?? null,
          pressure_hpa: p.mslp == null ? null : Math.round(p.mslp / 10) / 10,
          code: p.significantWeatherCode ?? null,
          summary: WEATHER[p.significantWeatherCode] || null,
        };
      }),
    };
    await putJson(env, `latest/weather-${port.id}.json`, doc);
    results.push({ port: port.id, periods: doc.periods.length });
  }
  return results;
}

function round(n) {
  return n == null || Number.isNaN(n) ? null : Math.round(n);
}

const WEATHER = {
  0: 'Clear night', 1: 'Sunny', 2: 'Partly cloudy', 3: 'Partly cloudy', 5: 'Mist', 6: 'Fog',
  7: 'Cloudy', 8: 'Overcast', 9: 'Light rain shower', 10: 'Light rain shower', 11: 'Drizzle',
  12: 'Light rain', 13: 'Heavy rain shower', 14: 'Heavy rain shower', 15: 'Heavy rain',
  16: 'Sleet shower', 17: 'Sleet shower', 18: 'Sleet', 19: 'Hail shower', 20: 'Hail shower',
  21: 'Hail', 22: 'Light snow shower', 23: 'Light snow shower', 24: 'Light snow',
  25: 'Heavy snow shower', 26: 'Heavy snow shower', 27: 'Heavy snow', 28: 'Thunder shower',
  29: 'Thunder shower', 30: 'Thunder',
};
