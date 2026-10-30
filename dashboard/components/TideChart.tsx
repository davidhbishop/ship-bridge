import type { GateWindow } from '@/lib/forecast'
import type { Morning } from '@/lib/morning'
import { toMinutes } from '@/lib/time'

const W = 720
const H = 180
const PAD = { top: 12, right: 8, bottom: 22, left: 28 }
const HALF_CYCLE = 372 // minutes between high and low water, roughly

type Point = { t: number; h: number }

// Rule-of-twelfths style cosine curve between successive high and low waters,
// extended half a cycle past each end so the line covers the whole day.
function curve(points: Point[]): Point[] {
  if (points.length === 0) return []
  const pts = [...points]
  const first = pts[0]
  const last = pts[pts.length - 1]
  const second = pts[1] ?? { t: first.t + HALF_CYCLE, h: first.h }
  const penultimate = pts[pts.length - 2] ?? { t: last.t - HALF_CYCLE, h: last.h }
  pts.unshift({ t: first.t - HALF_CYCLE, h: second.h })
  pts.push({ t: last.t + HALF_CYCLE, h: penultimate.h })

  const out: Point[] = []
  for (let t = 0; t <= 1440; t += 10) {
    const i = pts.findIndex((p, idx) => idx < pts.length - 1 && t >= p.t && t <= pts[idx + 1].t)
    if (i === -1) continue
    const a = pts[i]
    const b = pts[i + 1]
    const f = (t - a.t) / (b.t - a.t || 1)
    out.push({ t, h: a.h + ((b.h - a.h) * (1 - Math.cos(Math.PI * f))) / 2 })
  }
  return out
}

export function TideChart({ tides, windows, now }: { tides: Morning['tides']; windows: GateWindow[]; now: number | null }) {
  const points = tides
    .map((t) => ({ t: toMinutes(t.local), h: t.height_m }))
    .filter((p): p is Point => p.t !== null && p.h !== null)
  if (points.length < 2) return null

  const line = curve(points)
  const maxH = Math.max(10, Math.ceil(Math.max(...points.map((p) => p.h))))
  const x = (t: number) => PAD.left + (t / 1440) * (W - PAD.left - PAD.right)
  const y = (h: number) => PAD.top + (1 - h / maxH) * (H - PAD.top - PAD.bottom)
  const path = line.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.h).toFixed(1)}`).join(' ')
  const area = `${path} L${x(line[line.length - 1].t)},${y(0)} L${x(line[0].t)},${y(0)} Z`

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tide height through the day with gate open times shaded">
      {windows.map((w, i) => {
        const open = w.open ? (toMinutes(w.open) ?? 0) : 0
        const close = w.close ? (toMinutes(w.close) ?? 1440) : 1440
        return <rect key={i} x={x(open)} y={PAD.top} width={x(close) - x(open)} height={y(0) - PAD.top} fill="var(--gate)" />
      })}
      {[0, 5, 10].filter((h) => h <= maxH).map((h) => (
        <g key={h}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(h)} y2={y(h)} stroke="var(--border)" strokeWidth={1} />
          <text x={PAD.left - 6} y={y(h) + 4} textAnchor="end">
            {h}m
          </text>
        </g>
      ))}
      {[0, 6, 12, 18, 24].map((hour) => (
        <text key={hour} x={x(hour * 60)} y={H - 6} textAnchor={hour === 0 ? 'start' : hour === 24 ? 'end' : 'middle'}>
          {String(hour % 24).padStart(2, '0')}:00
        </text>
      ))}
      <path d={area} fill="var(--water-fill)" />
      <path d={path} fill="none" stroke="var(--water)" strokeWidth={2.5} />
      {points.map((p, i) => (
        <circle key={i} cx={x(p.t)} cy={y(p.h)} r={3.5} fill="var(--water)" />
      ))}
      {now !== null && (
        <line x1={x(now)} x2={x(now)} y1={PAD.top} y2={y(0)} stroke="var(--text)" strokeWidth={1.5} strokeDasharray="4 3" />
      )}
    </svg>
  )
}
