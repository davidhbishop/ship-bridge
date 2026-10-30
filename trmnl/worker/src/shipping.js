/**
 * Met Office shipping forecast from latest/shipping.json (written by the
 * shipping worker), cut down to the home sea area and its neighbours for the
 * log. ?area=<id> picks another area, e.g. ?area=malin.
 */

import { maxForce } from "./briefing.js";

const HOUR = 60 * 60 * 1000;

// Forecasts are issued four times a day, so anything older than this is late.
const STALE_AFTER = 8 * HOUR;

const NEIGHBOURS = {
  "irish-sea": ["malin", "lundy"],
  malin: ["hebrides", "irish-sea"],
  lundy: ["irish-sea", "fastnet"],
};

export async function shippingForecast(env, now, options = {}) {
  const object = await env.FORECAST.get("latest/shipping.json");
  if (!object) return { known: false };

  const data = await object.json();
  const areas = new Map();
  for (const a of data.areas || []) if (a && a.id && !areas.has(a.id)) areas.set(a.id, a);

  const id = String(options.area || env.SHIPPING_AREA || "irish-sea").toLowerCase();
  const home = areas.get(id);
  if (!home) return { known: false };

  const issued = Date.parse(data.issued);
  const nearby = (NEIGHBOURS[id] || []).map((n) => areas.get(n)).filter(Boolean);
  const gales = (data.gale_warnings || []).map((g) => (typeof g === "string" ? g : g.area || g.name || g.text)).filter(Boolean);

  return {
    known: true,
    issued: Number.isNaN(issued) ? data.issued_text || "" : formatIssued(issued),
    stale: !Number.isNaN(issued) && now.getTime() - issued > STALE_AFTER,
    synopsis: data.general_synopsis || "",
    gale_warnings: gales,
    gale_count: gales.length,
    area: areaView(home),
    nearby: nearby.map(areaView),
  };
}

function areaView(a) {
  return {
    id: a.id,
    name: a.name,
    warning: a.warning || "",
    gale: Boolean(a.gale),
    wind: a.wind || "",
    sea: a.sea || "",
    weather: a.weather || "",
    visibility: a.visibility || "",
    max_force: maxForce(a.wind || ""),
  };
}

function formatIssued(t) {
  const fmt = (o) => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", ...o }).format(new Date(t));
  return `${fmt({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" })} ${fmt({ weekday: "short", day: "numeric", month: "short" })}`;
}
