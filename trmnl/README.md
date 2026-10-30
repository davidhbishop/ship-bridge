# TRMNL boat displays

E-paper screens for the TRMNL OG on board, built for waking up in Conwy marina and
seeing at a glance: the marina gate, tides, sunrise and sunset, the inshore waters
forecast for the log, and anything that needs attention.

```
R2 bucket "forecast"  ──►  trmnl-bridge worker  ──►  TRMNL private plugins (polling)
(written by the tidal,      /morning /tides               Boat · Morning
 daylight, inshore and      /forecast /alerts             Boat · Tides & gate
 pressure workers)          /pressure                     Boat · Inshore forecast
                                                          Boat · Alerts
                                                          Boat · Pressure
```

## Screens

| Plugin | Route | What it shows |
| --- | --- | --- |
| Boat · Morning | `/morning` | Top alert, gate open/closed with next change, next tide, sunrise/sunset, today's HW/LW, inshore forecast summary |
| Boat · Tides & gate | `/tides` | Today's tide curve with gate windows shaded and a "now" line, then a three day HW/LW and gate table |
| Boat · Inshore forecast | `/forecast` | Area 11 (Great Orme Head to the Mull of Galloway) wind, sea, weather and visibility in large type for copying into the log |
| Boat · Alerts | `/alerts` | Only appears in the playlist when there is something to say (it sets `show: false` otherwise and the screen is skipped) |
| Boat · Shipping forecast | `/forecast` (plugin merge) | Irish Sea wind, sea, weather and visibility for the log, the general synopsis, and Malin and Lundy alongside. Reads the `shipping` block that the Inshore forecast plugin already fetches, through TRMNL's plugin merge, so it needs no key of its own |
| Boat · Pressure | `/pressure` | The Met Office surface pressure chart for the next 00:00 or 12:00 UTC, with the later charts listed |

Every plugin has full, half horizontal, half vertical and quadrant layouts, so they
also work in mashups.

## Settings

The bridge reads `config/settings.json` from the bucket when it exists (written by
the Next.js app through bridge-api):

```json
{ "home_port": "conwy", "inshore_areas": [9, 10, 11],
  "ports": [{ "id": "conwy", "name": "Conwy", "station": "...", "gate": { "open_h": -2, "close_h": 3 }, "home": true }] }
```

The home port's `gate` sets the gate window; a port with `gate: null` shows "No gate
here" and skips gate alerts. Without the file the bridge falls back to the
`wrangler.toml` vars (`PORT_NAME`, `INSHORE_AREAS`, `GATE_OPEN_HOURS`, ...).

The forecast screen shows area 11 when it is one of the chosen areas, otherwise the
last one. Add `?area=9` to the polling URL of a copy of the plugin for another area.

## Pressure charts

The pressure worker files each chart under the day and time it is valid for, as
`YYYYMMDD/HHMM-pressure-map-outlook-bw-<lead>-hrs.gif`. `/pressure` picks the
freshest (shortest lead) chart for each of the next few 12 hour slots, keeping the
current one for three hours after its valid time. The images are served from
`/pressure/YYYYMMDD/HHMM.gif` without the API key, because TRMNL fetches images
without headers; they are public Met Office charts.

## Alerts

Built in `worker/src/briefing.js` (`buildAlerts`):

- **Warning**: Met Office warning text on the area (e.g. "Gale warning issued"), any
  forecast wind of gale force 8 or more, or no tide data at all.
- A gale (or Met Office warning) in the Irish Sea shipping area also raises a
  warning when the inshore forecast has not already.
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

All times shown are Europe/London. Tide and gate records carry an `at` UTC
timestamp, which the bridge uses when present. Older records without it are read as
local time (`TIDE_STORED_OFFSET = "local"`); set a number of hours instead if a
feed stores a fixed offset. Sunrise and sunset from tidetimes.org.uk are already local.

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
shared markup (Alerts adds `plugins/alerts/shared.liquid` for the skip, and Shipping forecast
`plugins/shipping/shared.liquid` for its plugin merge). Each
`plugins/<name>/<size>.liquid` is the markup for that size.
