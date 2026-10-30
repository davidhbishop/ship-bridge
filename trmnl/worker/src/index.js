/**
 * trmnl-bridge: read-only Cloudflare Worker that turns the raw forecast data
 * in R2 (written by the tidal, daylight and inshore workers) into
 * display-ready JSON for the TRMNL boat screens.
 *
 * Routes (all need the X-Api-Key header, or ?key= for testing in a browser):
 *   /morning   everything for the wake-up screen
 *   /tides     three day tide and gate table with today's tide curve
 *   /forecast  inshore waters forecast for the home area, or ?area=N
 *   /alerts    active alerts only; show=false when there is nothing to say
 *   /pressure  the next Met Office pressure charts, with image links
 *
 * /pressure/YYYYMMDD/HHMM.gif serves a chart image without a key: TRMNL fetches
 * images without headers, and the charts are public Met Office data anyway.
 */

import { buildBriefing } from "./briefing.js";
import { pressureCharts, pressureImage } from "./pressure.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const image = url.pathname.match(/^\/pressure\/(\d{8})\/(0000|1200)\.gif$/);
    if (image) {
      return pressureImage(env, image[1], image[2]);
    }

    const token = request.headers.get("X-Api-Key") || url.searchParams.get("key");

    if (!env.API_KEY || token !== env.API_KEY) {
      return new Response("Unauthorized", { status: 401 });
    }

    const route = url.pathname.replace(/\/+$/, "") || "/morning";

    if (route === "/pressure") {
      const charts = await pressureCharts(env, new Date(), url.origin);
      return json({ updated: new Date().toLocaleTimeString("en-GB", { timeZone: "Europe/London", hour: "2-digit", minute: "2-digit" }), ...charts });
    }

    const briefing = await buildBriefing(env, new Date(), { area: url.searchParams.get("area") });

    const views = {
      "/morning": () => briefing,
      "/tides": () => pick(briefing, ["updated", "port", "gate", "tide_curve", "days", "alerts", "alert_count", "alert_level"]),
      "/forecast": () => pick(briefing, ["updated", "inshore_areas", "forecast", "alerts", "alert_count", "alert_level"]),
      "/alerts": () => ({ ...pick(briefing, ["updated", "port", "alerts", "alert_count", "alert_level", "gate"]), show: briefing.alert_count > 0 }),
    };

    const view = views[route];
    if (!view) {
      return new Response("Not found", { status: 404 });
    }

    return json(view());
  },
};

function json(body) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function pick(obj, keys) {
  return Object.fromEntries(keys.map((k) => [k, obj[k]]));
}
