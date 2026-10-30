# Ship Bridge dashboard

A private Next.js dashboard for the boat, sized for a laptop or an iPhone
(add it to the home screen from Safari's share menu for a full-screen app).
It shows, for Conwy:

- whether the marina gate is open now, and when it next opens or closes
- high and low water times and heights, with a tide curve and the gate windows shaded
- the shipping forecast for the Irish Sea and the inshore waters forecast, each with a
  "Copy for log" button that copies plain text ready to paste into the log
- sunrise, sunset, daylight length, moonrise, moonset and moon phase
- alerts for gale and strong wind warnings, force 6+ winds, poor visibility,
  the gate closing within two hours, and missing data

Today, tomorrow and the day after can be viewed. The page refreshes every five
minutes and whenever the phone wakes. The colour scheme follows the device, or
can be set to day, dark, or a red-only night mode that keeps night vision.

## Data

The dashboard reads from the Cloudflare workers, server-side, sending
`X-Api-Key`. Nothing from the API key reaches the browser.

- `FORECAST_API_MODE=morning` (default): `GET {FORECAST_API_URL}/v1/morning?date=YYYYMMDD`
  on the `bridge-api` worker (see `lib/morning.ts` for the shape).
- `FORECAST_API_MODE=datajson`: `GET {FORECAST_API_URL}?date=YYYYMMDD` returning the raw
  R2 `YYYYMMDD/data.json` array. Tide and gate times there are written as UTC + 1 hour all
  year by the current tidal worker; `LEGACY_TIDE_FIX=true` corrects that in winter.

With no `FORECAST_API_URL` set, the dashboard shows sample data.

## Password protection

There is one password, `DASHBOARD_PASSWORD`. Signing in sets a 30-day,
HTTP-only cookie signed with `SESSION_SECRET` (HMAC-SHA256). `proxy.ts` sends
every request without a valid cookie to `/login`, and the page checks the
cookie again before loading any data. Pages are marked `noindex`. Changing
`SESSION_SECRET` signs everyone out.

## Running

```sh
cd dashboard
cp .env.example .env.local   # fill in the values
npm install
npm run dev                  # http://localhost:3000
npm test                     # unit tests for the adapter, alerts and sessions
npm run build && npm start
```

## Deploying

Any Node host that runs Next.js works. The simplest is Vercel: import the
repository, set the root directory to `dashboard`, and add the environment
variables from `.env.example`. Use a long random password, since the site is
on the public internet.
