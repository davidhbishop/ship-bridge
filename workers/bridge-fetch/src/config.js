import { getJson } from './lib/store.js';

// Used when config/settings.json is missing. The Next.js settings page
// writes that file through bridge-api; TRMNL reads it too.
export const DEFAULT_SETTINGS = {
  home_port: 'conwy',
  inshore_areas: [9, 10, 11],
  shipping_areas: ['Irish Sea'],
  alerts: { gust_kn: 25 },
  ports: [
    // Gate offsets are hours from high water.
    { id: 'conwy', name: 'Conwy', station: '0471A', lat: 53.2833, lon: -3.8333, gate: { open_h: -2, close_h: 3 }, home: true },
    { id: 'holyhead', name: 'Holyhead', station: '0478', gate: null },
    { id: 'dover', name: 'Dover', station: '0089', gate: null },
    { id: 'liverpool', name: 'Liverpool', station: '0451', gate: null },
    { id: 'milfordhaven', name: 'Milford Haven', station: '0496', gate: null },
  ],
};

export async function loadSettings(env) {
  const saved = await getJson(env, 'config/settings.json');
  const settings = { ...DEFAULT_SETTINGS, ...(saved || {}) };
  settings.inshore_areas = settings.inshore_areas.map(Number);
  return settings;
}

// Legacy files used these names (lowercased into keys, e.g. 0124-holyhead-highwater.json).
export function legacyName(port) {
  return port.id === 'conwy' ? 'Conwy' : port.id.toUpperCase();
}

export const USER_AGENT = 'ShipBridge/2.0 (private yacht dashboard)';
