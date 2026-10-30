// All stored times are derived from a UTC instant. `at` is ISO 8601 UTC,
// `local`/`ymd` are Europe/London wall-clock, so BST is handled by Intl.
const LONDON = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function london(date) {
  const p = Object.fromEntries(LONDON.formatToParts(date).map(x => [x.type, x.value]));
  return {
    ymd: `${p.year}${p.month}${p.day}`,
    date: `${p.year}-${p.month}-${p.day}`,
    hhmm: `${p.hour}${p.minute}`,
    local: `${p.hour}:${p.minute}`,
  };
}

// Admiralty returns "2026-10-30T13:11:00" with no zone; it is UTC.
export function parseUtc(s) {
  return new Date(/([zZ]|[+-]\d\d:?\d\d)$/.test(s) ? s : `${s}Z`);
}

export function iso(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function addHours(date, hours) {
  return new Date(date.getTime() + hours * 3600 * 1000);
}

export function todayLondon(now = new Date()) {
  return london(now).ymd;
}
