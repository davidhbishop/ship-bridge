# Ship Bridge Cloudflare workers

Two workers replace the Python feeds in `shipforecast/` and the dashboard-edited
workers. Both use the R2 bucket `forecast`.

- `bridge-fetch` fetches the sources on one every-minute cron (the free plan
  allows 5 crons per account) and writes `latest/*.json`. See `due()` in
  `bridge-fetch/src/index.js` for the schedule.
- `bridge-api` is the read API for TRMNL and the Next.js dashboard.

## Deploy

```sh
npm install
npx wrangler deploy -c bridge-fetch/wrangler.toml
npx wrangler deploy -c bridge-api/wrangler.toml
npx wrangler secret put API_KEY -c bridge-api/wrangler.toml       # and for bridge-fetch
npx wrangler secret put ADMIRALTY_KEY -c bridge-api/wrangler.toml # and for bridge-fetch
npx wrangler secret put DATAHUB_KEY -c bridge-fetch/wrangler.toml # Met Office Weather DataHub
```

Run a feed by hand: put `{"feeds":["tides"]}` at R2 key `control/run.json`.
The next minute's run picks it up and writes the result to `control/last-run.json`.

## Times

Every event has `at` (ISO 8601 UTC) and `local` (`HH:MM`, Europe/London), and
`date` is the Europe/London date. Nothing adds a fixed BST offset.

## R2 layout

| Key | Written by | Contents |
|---|---|---|
| `config/settings.json` | `PUT /v1/settings` | ports, home port, inshore areas, shipping areas, alert thresholds |
| `latest/tides-{port}.json` | tides, every 6 h | 7 days of `events`, `gates`, `windows` |
| `latest/inshore.json` | inshore, hourly | every area with `next_24h` and `outlook` |
| `latest/shipping.json` | shipping, hourly | `general_synopsis`, `gale_warnings`, every sea area |
| `latest/weather-{port}.json` | weather, 3-hourly | DataHub three-hourly, knots |
| `latest/daylight-{port}.json` | daylight, daily | 7 days of sun and moon |
| `latest/pressure.json`, `pressure/*.gif` | pressure, 6-hourly | analysis and outlook charts |
| `latest/alerts.json` | alerts, hourly | gale, strong wind, gusts, stale feeds |
| `archive/YYYYMMDD/` | inshore, shipping | copies for the log |
| `YYYYMMDD/data.json` and `YYYYMMDD/HHMM-*.json` | tides, daylight, inshore | legacy layout, kept until old readers move |

## API

All requests need `X-Api-Key`.

- `GET /v1/morning?date=YYYYMMDD` (default today): tides, gates, windows,
  daylight, shipping, inshore, weather, alerts, pressure, other ports, stale flags.
- `GET /v1/tides?port=conwy&days=3&date=YYYYMMDD`
- `GET /v1/inshore`, `/v1/shipping`, `/v1/alerts`, `/v1/pressure`,
  `/v1/weather?port=`, `/v1/daylight?port=`
- `GET /v1/pressure/{analysis|t24|t48|...}.gif?style=bw|colour`
- `GET /v1/settings`, `PUT /v1/settings` (full replace, validated, triggers a refetch)
- `GET /v1/stations?q=conwy` searches Admiralty stations for the add-port form.
