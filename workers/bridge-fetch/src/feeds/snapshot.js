import { USER_AGENT } from '../config.js';

// Saves raw source pages to R2 debug/ so parsers can be checked against them.
const PAGES = {
  inshore: 'https://www.metoffice.gov.uk/weather/specialist-forecasts/coast-and-sea/inshore-waters-forecast',
  shipping: 'https://www.metoffice.gov.uk/weather/specialist-forecasts/coast-and-sea/shipping-forecast',
  pressure: 'https://www.metoffice.gov.uk/weather/maps-and-charts/surface-pressure',
};

export async function runSnapshot(env) {
  const out = {};
  for (const [name, url] of Object.entries(PAGES)) {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const html = await response.text();
    await env.FORECAST.put(`debug/${name}.html`, html, { httpMetadata: { contentType: 'text/html' } });
    out[name] = { status: response.status, bytes: html.length };
  }
  return out;
}
