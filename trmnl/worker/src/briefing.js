/**
 * Builds the boat briefing from the R2 forecast bucket.
 *
 * R2 layout (written by the tidal, daylight and inshore workers):
 *   YYYYMMDD/data.json                      list of {time, name, event_type, ...}
 *   YYYYMMDD/0000-inshore-forecast-N.json   {area, warning, forecast:{wind, sea, weather, visibility}}
 *   config/settings.json                    {home_port, inshore_areas, ports:[{id, name, gate}]}
 *                                           written by the dashboard; optional
 *
 * Every event is turned into an absolute instant, so it does not matter which
 * day folder an event was filed under, and all times shown are Europe/London.
 */

const ZONE = "Europe/London";
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export async function buildBriefing(env, now, options = {}) {
  const config = readConfig(env, await readJson(env, "config/settings.json", null), options);
  const today = londonParts(now);
  const todayStart = fromLocal(today.y, today.m, today.d, 0, 0);

  // Yesterday to three days ahead, so gate windows and tide curves that
  // cross midnight have the events either side of them.
  const folders = [-1, 0, 1, 2, 3].map((n) => folderFor(addDays(today, n)));
  const records = (await Promise.all(folders.map((f) => tagged(env, f)))).flat();

  const events = normaliseEvents(records, config);
  const extremes = events.filter((e) => e.type === "HW" || e.type === "LW");
  const gates = gateWindows(extremes, config);

  const forecast = await readForecast(env, config, today);
  const gate = config.hasGate
    ? gateStatus(gates, now, extremes.length > 0)
    : { known: false, status: "NO GATE", headline: "No gate here", detail: "" };

  const days = [0, 1, 2].map((n) => dayView(addDays(today, n), n, events, gates));
  const sun = sunView(days[0], events, now, todayStart);
  const nextTide = extremes.find((e) => e.at > now.getTime());

  const alerts = buildAlerts({ forecast, gate, extremes, config });
  const level = alerts.length ? alerts[0].level : "none";

  return {
    updated: formatTime(now.getTime()),
    date_label: formatDate(now.getTime(), { weekday: "long", day: "numeric", month: "long" }),
    port: config.port,
    inshore_areas: config.areas,
    gate,
    next_tide: nextTide ? { ...extremeView(nextTide), in: formatDuration(nextTide.at - now.getTime()) } : null,
    sun,
    days,
    tide_curve: tideCurve(extremes, gates, todayStart, now),
    forecast,
    alerts,
    alert_count: alerts.length,
    alert_level: level,
  };
}

/**
 * Settings come from config/settings.json when the dashboard has saved one,
 * otherwise from the worker's vars. ?area= on the request picks which inshore
 * area to show, so one TRMNL plugin can be set up per area.
 */
function readConfig(env, settings, options) {
  const offset = String(env.TIDE_STORED_OFFSET ?? "1");
  const ports = Array.isArray(settings?.ports) ? settings.ports : [];
  const homeId = String(settings?.home_port || "").toLowerCase();
  const home = ports.find((p) => String(p.id).toLowerCase() === homeId) || ports.find((p) => p.home) || null;
  const fallbackGate = { open_h: Number(env.GATE_OPEN_HOURS ?? -2), close_h: Number(env.GATE_CLOSE_HOURS ?? 3) };
  const gate = home ? home.gate : fallbackGate;

  const areas = (Array.isArray(settings?.inshore_areas) && settings.inshore_areas.length
    ? settings.inshore_areas
    : String(env.INSHORE_AREAS || "9,10,11").split(",")
  ).map((a) => String(a).trim());
  const preferred = String(env.FORECAST_AREA || "11");
  const requested = options.area ? String(options.area) : null;

  return {
    port: home?.name || env.PORT_NAME || "Conwy",
    portIds: (home ? [home.id, home.name] : [env.PORT_NAME || "Conwy"]).filter(Boolean).map((n) => String(n).toLowerCase()),
    areas,
    area: requested || (areas.includes(preferred) ? preferred : areas[areas.length - 1]),
    // The tidal worker currently writes tide times as UTC+1 all year round.
    // Set this to "local" once it writes real Europe/London times.
    tideOffset: offset === "local" ? "local" : Number(offset),
    hasGate: Boolean(gate),
    gateOpen: Number(gate?.open_h ?? 0),
    gateClose: Number(gate?.close_h ?? 0),
    strongWind: Number(env.STRONG_WIND_FORCE ?? 6),
    gateWarnMinutes: Number(env.GATE_WARN_MINUTES ?? 90),
  };
}

async function readJson(env, key, fallback) {
  const object = await env.FORECAST.get(key);
  if (!object) return fallback;
  try {
    return await object.json();
  } catch (e) {
    return fallback;
  }
}

// ---------------------------------------------------------------- events

const TYPES = {
  highwater: "HW",
  lowwater: "LW",
  sunrise: "sunrise",
  sunset: "sunset",
  moonrise: "moonrise",
  moonset: "moonset",
};

function normaliseEvents(records, config) {
  const seen = new Map();

  for (const r of records) {
    if (!r || !r.name || !config.portIds.includes(r.name.toLowerCase())) continue;
    const type = TYPES[(r.event_type || r.type || "").toLowerCase()];
    if (!type || !r._folder) continue;
    const clock = parseClock(r.time);
    if (!clock) continue;

    const [y, m, d] = [r._folder.slice(0, 4), r._folder.slice(4, 6), r._folder.slice(6, 8)].map(Number);
    const isTide = type === "HW" || type === "LW";
    // Newer records carry the UTC instant; older ones only a clock time.
    const at = r.at && !Number.isNaN(Date.parse(r.at))
      ? Date.parse(r.at)
      : isTide && config.tideOffset !== "local"
        ? Date.UTC(y, m - 1, d, clock.h, clock.mi) - config.tideOffset * HOUR
        : fromLocal(y, m, d, clock.h, clock.mi);

    const key = `${type}@${at}`;
    if (seen.has(key)) continue;
    seen.set(key, {
      type,
      at,
      height: typeof r.depth === "number" ? r.depth : null,
      phase: r.phase || null,
    });
  }

  return [...seen.values()].sort((a, b) => a.at - b.at);
}

function parseClock(value) {
  const match = String(value || "").match(/^(\d{1,2}):?(\d{2})$/);
  if (!match) return null;
  return { h: Number(match[1]), mi: Number(match[2]) };
}

// data.json rows do not record their own date, so tag them with their folder.
async function tagged(env, folder) {
  const rows = await readJson(env, `${folder}/data.json`, []);
  return Array.isArray(rows) ? rows.map((r) => ({ ...r, _folder: folder })) : [];
}

// ---------------------------------------------------------------- gate

function gateWindows(extremes, config) {
  return extremes
    .filter((e) => e.type === "HW")
    .map((hw) => ({ open: hw.at + config.gateOpen * HOUR, close: hw.at + config.gateClose * HOUR, hw: hw.at }));
}

function gateStatus(windows, now, known) {
  const t = now.getTime();
  if (!known) {
    return { known: false, status: "UNKNOWN", headline: "No tide data", detail: "Check the tidal worker" };
  }

  const current = windows.find((w) => w.open <= t && t < w.close);
  if (current) {
    return {
      known: true,
      open: true,
      status: "OPEN",
      change_label: "Closes",
      change_time: formatTime(current.close),
      change_in: formatDuration(current.close - t),
      change_minutes: Math.round((current.close - t) / 60000),
      headline: `Open until ${formatTime(current.close)}`,
      detail: `Closes in ${formatDuration(current.close - t)}`,
      window: `${formatTime(current.open)}–${formatTime(current.close)}`,
    };
  }

  const next = windows.find((w) => w.open > t);
  if (!next) {
    return { known: true, open: false, status: "CLOSED", headline: "Closed", detail: "No later tide data" };
  }
  return {
    known: true,
    open: false,
    status: "CLOSED",
    change_label: "Opens",
    change_time: formatTime(next.open),
    change_in: formatDuration(next.open - t),
    headline: `Opens at ${formatTime(next.open)}`,
    detail: `Opens in ${formatDuration(next.open - t)}`,
    window: `${formatTime(next.open)}–${formatTime(next.close)}`,
    day_label: dayLabelFor(next.open, t),
  };
}

// ---------------------------------------------------------------- days

function dayView(parts, offset, events, gates) {
  const start = fromLocal(parts.y, parts.m, parts.d, 0, 0);
  const end = fromLocal(...nextDay(parts), 0, 0);
  const within = (t) => t >= start && t < end;
  const find = (type) => events.find((e) => e.type === type && within(e.at));

  const sunrise = find("sunrise");
  const sunset = find("sunset");
  const moonrise = find("moonrise");

  return {
    label: offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : formatDate(start + 12 * HOUR, { weekday: "long" }),
    date: formatDate(start + 12 * HOUR, { weekday: "short", day: "numeric", month: "short" }),
    tides: events.filter((e) => (e.type === "HW" || e.type === "LW") && within(e.at)).map(extremeView),
    gates: gates
      .filter((g) => within(g.hw))
      .map((g) => ({ open: formatTime(g.open), close: formatTime(g.close), hw: formatTime(g.hw) })),
    sunrise: sunrise ? formatTime(sunrise.at) : null,
    sunset: sunset ? formatTime(sunset.at) : null,
    moon_phase: moonrise ? moonrise.phase : null,
  };
}

function extremeView(e) {
  return {
    type: e.type,
    name: e.type === "HW" ? "High water" : "Low water",
    time: formatTime(e.at),
    height: e.height === null ? null : e.height.toFixed(1),
  };
}

function sunView(day, events, now, todayStart) {
  const t = now.getTime();
  const rise = events.find((e) => e.type === "sunrise" && e.at >= todayStart && e.at < todayStart + DAY);
  const set = events.find((e) => e.type === "sunset" && e.at >= todayStart && e.at < todayStart + DAY);
  const moonrise = events.find((e) => e.type === "moonrise" && e.at >= todayStart && e.at < todayStart + DAY);
  const moonset = events.find((e) => e.type === "moonset" && e.at >= todayStart && e.at < todayStart + DAY);

  let next = null;
  if (rise && t < rise.at) next = `Sunrise in ${formatDuration(rise.at - t)}`;
  else if (set && t < set.at) next = `Sunset in ${formatDuration(set.at - t)}`;
  else if (set) next = "After sunset";

  return {
    sunrise: day.sunrise,
    sunset: day.sunset,
    daylight: rise && set ? formatDuration(set.at - rise.at) : null,
    next,
    moonrise: moonrise ? formatTime(moonrise.at) : null,
    moonset: moonset ? formatTime(moonset.at) : null,
    moon_phase: day.moon_phase,
  };
}

// ---------------------------------------------------------------- tide curve

// Semi-diurnal tide: high waters come round about every 12h 25m.
const TIDE_CYCLE = (12 * 60 + 25) * 60 * 1000;

/**
 * Today's tide curve, sampled every 15 minutes using cosine interpolation
 * between successive high and low waters. Coordinates are percentages of the
 * chart box (x left to right, y top to bottom) so the markup can draw the
 * line in a stretched SVG and place labels with plain CSS.
 */
function tideCurve(extremes, gates, dayStart, now) {
  const dayEnd = dayStart + DAY;
  const inside = extremes.filter((e) => e.at > dayStart && e.at < dayEnd);
  let before = extremes.filter((e) => e.at <= dayStart).slice(-1);
  let after = extremes.filter((e) => e.at >= dayEnd).slice(0, 1);
  // A neighbouring day's file can be missing; borrow the tide one cycle on.
  if (!before.length && inside.length > 1) before = [{ ...inside[1], at: inside[1].at - TIDE_CYCLE }];
  if (!after.length && inside.length > 1) after = [{ ...inside[inside.length - 2], at: inside[inside.length - 2].at + TIDE_CYCLE }];
  const span = [...before, ...inside, ...after];
  if (span.length < 2 || span[0].at > dayStart || span[span.length - 1].at < dayEnd) return null;
  if (span.some((e) => e.height === null)) return null;

  const max = Math.ceil(Math.max(...span.map((e) => e.height)) + 0.5);
  const x = (t) => round(((t - dayStart) / DAY) * 100);
  const y = (h) => round(100 - (h / max) * 100);

  const heightAt = (t) => {
    const i = span.findIndex((e, n) => n < span.length - 1 && e.at <= t && t <= span[n + 1].at);
    const a = span[i];
    const b = span[i + 1];
    const phase = Math.PI * ((t - a.at) / (b.at - a.at));
    return (a.height + b.height) / 2 + ((a.height - b.height) / 2) * Math.cos(phase);
  };

  const points = [];
  for (let t = dayStart; t <= dayEnd; t += 15 * 60 * 1000) points.push(`${x(t)},${y(heightAt(t))}`);
  const line = `M${points.join(" L")}`;

  const t = now.getTime();
  return {
    line,
    max_height: max,
    gates: gates
      .filter((g) => g.close > dayStart && g.open < dayEnd)
      .map((g) => {
        const left = x(Math.max(g.open, dayStart));
        return { left, width: round(x(Math.min(g.close, dayEnd)) - left) };
      }),
    marks: span
      .filter((e) => e.at >= dayStart && e.at < dayEnd)
      .map((e) => ({ ...extremeView(e), x: x(e.at), y: y(e.height), label_x: Math.min(93, Math.max(7, x(e.at))) })),
    now: t >= dayStart && t < dayEnd ? { x: x(t), y: y(heightAt(t)), height: heightAt(t).toFixed(1) } : null,
  };
}

// ---------------------------------------------------------------- forecast

async function readForecast(env, config, today) {
  const wanted = `(${config.area})`;
  for (const [n, stale] of [[0, false], [-1, true]]) {
    const folder = folderFor(addDays(today, n));
    let data = await readJson(env, `${folder}/0000-inshore-forecast-${config.area}.json`, null);

    // Files are numbered by their position on the Met Office page, so check
    // we have the right area and search the others if the page reordered.
    if (!data || !String(data.area || "").includes(wanted)) {
      data = null;
      for (let i = 1; i <= 25 && !data; i++) {
        const candidate = await readJson(env, `${folder}/0000-inshore-forecast-${i}.json`, null);
        if (candidate && String(candidate.area || "").includes(wanted)) data = candidate;
      }
    }
    if (!data) continue;

    const f = data.forecast || {};
    return {
      known: true,
      stale,
      issued: formatDate(fromLocal(addDays(today, n).y, addDays(today, n).m, addDays(today, n).d, 12, 0), { weekday: "short", day: "numeric", month: "short" }),
      area: data.area,
      area_short: String(data.area).replace(/\s*\(\d+\)\s*$/, "").replace(/^the\s+/i, ""),
      area_number: config.area,
      warning: data.warning || "",
      wind: f.wind || "",
      sea: f.sea || "",
      weather: f.weather || "",
      visibility: f.visibility || "",
      max_force: maxForce(f.wind || ""),
    };
  }
  return { known: false, stale: true, area_number: config.area, warning: "", max_force: null };
}

/** Highest Beaufort force mentioned in a Met Office wind sentence. */
export function maxForce(text) {
  const s = text.toLowerCase();
  let max = 0;
  const named = [
    [/hurricane force/, 12],
    [/violent storm/, 11],
    [/\bstorm\b/, 10],
    [/severe gale/, 9],
    [/\bgale\b/, 8],
  ];
  for (const [pattern, force] of named) if (pattern.test(s)) max = Math.max(max, force);
  for (const m of s.matchAll(/\b(1[0-2]|[0-9])\b/g)) max = Math.max(max, Number(m[1]));
  return max || null;
}

// ---------------------------------------------------------------- alerts

const RANK = { warning: 0, caution: 1, info: 2 };

function buildAlerts({ forecast, gate, extremes, config }) {
  const alerts = [];
  const add = (level, title, detail) => alerts.push({ level, icon: level === "warning" ? "!" : "i", title, detail });

  if (forecast.known) {
    const force = forecast.max_force || 0;
    if (forecast.warning) {
      add("warning", forecast.warning, force ? `Up to force ${force}. ${forecast.wind}` : forecast.wind);
    } else if (force >= 8) {
      add("warning", `Gale force ${force} forecast`, forecast.wind);
    } else if (force >= config.strongWind) {
      add("caution", `Strong wind, force ${force}`, forecast.wind);
    }

    if (/\b(rough|high|phenomenal)\b/i.test(forecast.sea)) add("caution", "Rough sea forecast", forecast.sea);
    if (/\b(poor|fog)\b/i.test(forecast.visibility)) add("caution", "Poor visibility forecast", forecast.visibility);
    if (forecast.stale) add("caution", "Forecast not updated today", `Showing ${forecast.issued}. Check the inshore worker.`);
  } else {
    add("caution", "No inshore forecast", "Nothing in R2 for today or yesterday");
  }

  if (!extremes.length) {
    add("warning", "No tide data", "Check the tidal worker before relying on gate times");
  } else if (config.hasGate && gate.open && gate.change_minutes <= config.gateWarnMinutes) {
    add("caution", `Gate closes at ${gate.change_time}`, `In ${gate.change_in}`);
  }

  return alerts.sort((a, b) => RANK[a.level] - RANK[b.level]);
}

// ---------------------------------------------------------------- time helpers

const partsFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function londonParts(date) {
  const p = Object.fromEntries(partsFormat.formatToParts(date).map((x) => [x.type, x.value]));
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), h: Number(p.hour), mi: Number(p.minute) };
}

function londonOffset(t) {
  const p = londonParts(new Date(t));
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi) - Math.floor(t / 60000) * 60000;
}

/** UTC instant for a Europe/London wall clock time. */
function fromLocal(y, m, d, h, mi) {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  let t = guess - londonOffset(guess);
  const check = guess - londonOffset(t);
  if (check !== t) t = check;
  return t;
}

function addDays(p, n) {
  const d = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
}

function nextDay(p) {
  const n = addDays(p, 1);
  return [n.y, n.m, n.d];
}

function folderFor(p) {
  return `${p.y}${String(p.m).padStart(2, "0")}${String(p.d).padStart(2, "0")}`;
}

function formatTime(t) {
  const p = londonParts(new Date(t));
  return `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`;
}

function formatDate(t, options) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, ...options }).format(new Date(t));
}

function dayLabelFor(t, now) {
  const a = londonParts(new Date(t));
  const b = londonParts(new Date(now));
  if (a.y === b.y && a.m === b.m && a.d === b.d) return "today";
  const tomorrow = addDays(b, 1);
  if (a.y === tomorrow.y && a.m === tomorrow.m && a.d === tomorrow.d) return "tomorrow";
  return formatDate(t, { weekday: "long" });
}

function formatDuration(ms) {
  const minutes = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m} min`;
}

function round(n) {
  return Math.round(n * 10) / 10;
}
