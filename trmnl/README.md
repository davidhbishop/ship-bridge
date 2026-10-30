# TRMNL boat displays

E-paper screens for the TRMNL OG on board, built for waking up in Conwy marina and
seeing at a glance: the marina gate, tides, sunrise and sunset, the inshore waters
forecast for the log, and anything that needs attention.

```
R2 bucket "forecast"  ──►  trmnl-bridge worker  ──►  TRMNL private plugins (polling)
(written by the tidal,      /morning /tides               Boat · Morning
 daylight and inshore       /forecast /alerts             Boat · Tides & gate
 workers)                                                 Boat · Inshore forecast
                                                          Boat · Alerts
```

## Screens

| Plugin | Route | What it shows |
| --- | --- | --- |
| Boat · Morning | `/morning` | Top alert, gate open/closed with next change, next tide, sunrise/sunset, today's HW/LW, inshore forecast summary |
| Boat · Tides & gate | `/tides` | Today's tide curve with gate windows shaded and a "now" line, then a three day HW/LW and gate table |
| Boat · Inshore forecast | `/forecast` | Area 11 (Great Orme Head to the Mull of Galloway) wind, sea, weather and visibility in large type for copying into the log |
| Boat · Alerts | `/alerts` | Only appears in the playlist when there is something to say (it sets `show: false` otherwise and the screen is skipped) |

Every plugin has full, half horizontal, half vertical and quadrant layouts, so they
also work in mashups.

## Alerts

Built in `worker/src/briefing.js` (`buildAlerts`):

- **Warning**: Met Office warning text on the area (e.g. "Gale warning issued"), any
  forecast wind of gale force 8 or more, or no tide data at all.
- **Caution**: strong wind (force 6+, `STRONG_WIND_FORCE`), rough sea, poor visibility
  or fog, gate closing within 90 minutes (`GATE_WARN_MINUTES`), forecast not updated
  today, forecast missing.

Wind force is the highest Beaufort number or named force ("gale", "severe gale" …)
mentioned anywhere in the wind sentence, so "occasionally 6 at first" counts as 6.

## Gate times

Gate windows are worked out from each Conwy high water: opens `GATE_OPEN_HOURS` (−2)
and closes `GATE_CLOSE_HOURS` (+3) hours either side, matching the existing tidal
worker. Change these in `wrangler.toml` if the marina's sill times differ.

## Time zones

All times shown are Europe/London. The tidal worker currently stores tide times as
UTC+1 all year round (it hard-codes BST), so the bridge undoes that with
`TIDE_STORED_OFFSET = "1"`. When the tidal worker is fixed to store real local
time, set it to `"local"`. Sunrise and sunset from tidetimes.org.uk are already local.

## Deploying the worker

```sh
cd trmnl/worker
npx wrangler deploy
npx wrangler secret put API_KEY   # only when rotating the key
```

The same API key goes in each TRMNL plugin's polling headers as `X-Api-Key: <key>`.
It is not stored in this repo.

## Trying it locally

`test/run.mjs` runs the worker against a folder laid out like the R2 bucket, at a
chosen time:

```sh
node test/run.mjs /path/to/r2-copy 2026-10-30T07:00:00Z /morning
```

`samples/morning-calm.json` is real output for 30 Oct 2026 07:00.
`samples/morning-gale.json` is the same day at 15:00 with a made-up gale forecast,
to show how alerts look. Either can be pasted into a TRMNL plugin's static data to
preview the markup.

## Markup

`plugins/shared.css.liquid` is the shared stylesheet, pasted into each plugin's
shared markup (Alerts adds `plugins/alerts/shared.liquid` for the skip). Each
`plugins/<name>/<size>.liquid` is the markup for that size.
