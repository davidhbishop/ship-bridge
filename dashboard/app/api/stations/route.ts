import { NextResponse } from 'next/server'
import { searchStations } from '@/lib/data'
import { hasSession } from '@/lib/session'

export async function GET(request: Request) {
  if (!(await hasSession())) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const q = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])
  try {
    return NextResponse.json(await searchStations(q))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Search failed' }, { status: 502 })
  }
}
