import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySession } from './lib/auth'

// Every page and API route needs a valid session, except the login page and
// the static files the browser fetches before signing in.
export async function proxy(request: NextRequest) {
  const ok = await verifySession(request.cookies.get(SESSION_COOKIE)?.value)
  if (ok) return NextResponse.next()

  const login = new URL('/login', request.url)
  const next = request.nextUrl.pathname + request.nextUrl.search
  if (next !== '/') login.searchParams.set('next', next)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|robots.txt).*)'],
}
