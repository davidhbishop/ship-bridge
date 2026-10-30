// Sample /v1/morning response used when no API is configured. Times follow
// the Conwy files in data/forecast/20230416, moved ~50 minutes a day.

import type { Morning } from './morning.ts'
import type { Settings } from './settings.ts'
import { shiftTime } from './time.ts'

export function sampleMorning(date: string, dayOffset: number, settings: Settings): Morning {
  const t = (time: string) => shiftTime(time, dayOffset * 50)
  // Other ports: the same tide moved by a made-up per-port offset.
  const ports = settings.ports.map((port, i) => ({
    id: port.id,
    name: port.name,
    station: port.station,
    tides: [
      { type: 'low' as const, local: shiftTime(t('03:03'), i * 23 - 40), height_m: 0.9 + i * 0.2 },
      { type: 'high' as const, local: shiftTime(t('08:40'), i * 23 - 40), height_m: 5.4 + i * 0.6 },
      { type: 'low' as const, local: shiftTime(t('15:38'), i * 23 - 40), height_m: 1.1 + i * 0.2 },
      { type: 'high' as const, local: shiftTime(t('21:29'), i * 23 - 40), height_m: 5.2 + i * 0.6 },
    ],
  }))
  const morning: Morning = {
    date,
    generated_at: new Date().toISOString(),
    tides: [
      { type: 'low', local: t('03:03'), height_m: 1.12 },
      { type: 'high', local: t('08:40'), height_m: 7.81 },
      { type: 'low', local: t('15:38'), height_m: 1.34 },
      { type: 'high', local: t('21:29'), height_m: 7.52 },
    ],
    gates: [
      { type: 'open', local: t('06:40') },
      { type: 'close', local: t('11:40') },
      { type: 'open', local: t('19:29') },
      { type: 'close', local: t('23:59') },
    ],
    daylight: { sunrise: '07:13', sunset: '16:38', moonrise: t('04:29'), moonset: t('14:19'), moon_phase: 'Waning Crescent' },
    shipping: {
      issued: '05:05',
      general_synopsis: 'Low 150 miles west of Shannon 992 expected Malin 996 by 0600 tomorrow.',
      gale_warnings: [],
      area: {
        name: 'Irish Sea',
        wind: 'Southwest 5 to 7, occasionally gale 8 later.',
        sea: 'Moderate or rough.',
        weather: 'Rain or showers.',
        visibility: 'Good, occasionally poor.',
      },
    },
    inshore: {
      issued: '06:00',
      general_situation: 'Low pressure moving northeast across the Irish Sea, filling.',
      areas: [
        {
          id: 9,
          name: "Land's End to St David's Head including the Bristol Channel",
          warning: '',
          next_24h: {
            wind: 'West 3 to 5.',
            sea: 'Slight or moderate.',
            weather: 'Fair.',
            visibility: 'Good.',
          },
        },
        {
          id: 10,
          name: "St David's Head to Great Orme Head, including St George's Channel",
          warning: '',
          next_24h: {
            wind: 'Southwest 4 to 6, occasionally 7 later.',
            sea: 'Slight or moderate, occasionally rough later.',
            weather: 'Showers, rain later.',
            visibility: 'Good, occasionally moderate.',
          },
          outlook: 'West 5 or 6, decreasing 4. Moderate. Showers. Good.',
        },
        {
          id: 11,
          name: 'Great Orme Head to the Mull of Galloway',
          warning: 'Strong winds are forecast',
          next_24h: {
            wind: 'West or southwest 5 to 7.',
            sea: 'Moderate or rough.',
            weather: 'Rain or showers.',
            visibility: 'Good, occasionally poor.',
          },
        },
      ],
    },
    ports,
  }
  morning.inshore!.areas = morning.inshore!.areas.filter((a) => settings.inshore_areas.includes(Number(a.id)))
  return morning
}
