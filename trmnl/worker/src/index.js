/**
 * trmnl-bridge: read-only Cloudflare Worker that turns the raw forecast data
 * in R2 (written by the tidal, daylight and inshore workers) into
 * display-ready JSON for the TRMNL boat screens.
 *
 * Routes (all need the X-Api-Key header, or ?key= for testing in a browser):
 *   /morning   everything for the wake-up screen
 *   /tides     three day tide and gate table with today's tide curve
 *   /forecast  inshore waters forecast for the home area
 *   /alerts    active alerts only; show=false when there is nothing to say
 */

import { buildBriefing } from "./briefing.js";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const token = request.headers.get("X-Api-Key") || url.searchParams.get("key");

    if (!env.API_KEY || token !== env.API_KEY) {
      return new Response("Unauthorized", { status: 401 });
    }

    const route = url.pathname.replace(/\/+$/, "") || "/morning";
    const briefing = await buildBriefing(env, new Date());

    const views = {
      "/morning": () => briefing,
      "/tides": () => pick(briefing, ["updated", "port", "gate", "tide_curve", "days", "alerts", "alert_count", "alert_level"]),
      "/forecast": () => pick(briefing, ["updated", "forecast", "alerts", "alert_count", "alert_level"]),
      "/alerts": () => ({ ...pick(briefing, ["updated", "port", "alerts", "alert_count", "alert_level", "gate"]), show: briefing.alert_count > 0 }),
    };

    const view = views[route];
    if (!view) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(JSON.stringify(view()), {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  },
};

function pick(obj, keys) {
  return Object.fromEntries(keys.map((k) => [k, obj[k]]));
}
