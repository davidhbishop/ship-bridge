import 'server-only'

import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySession } from './auth.ts'

// proxy.ts already guards every route; pages, actions and route handlers
// check again so data is never served without a session if the matcher changes.
export async function hasSession(): Promise<boolean> {
  const store = await cookies()
  return verifySession(store.get(SESSION_COOKIE)?.value)
}
