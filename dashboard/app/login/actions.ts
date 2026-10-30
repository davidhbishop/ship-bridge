'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE, checkPassword, createSession } from '@/lib/auth'

export type LoginState = { error: string | null }

// Only allow redirects back to a path on this site.
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === 'string' ? value : '/'
  return next.startsWith('/') && !next.startsWith('//') ? next : '/'
}

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get('password')
  if (typeof password !== 'string' || !checkPassword(password)) {
    // Slow down guessing a little.
    await new Promise((resolve) => setTimeout(resolve, 750))
    return { error: 'Incorrect password' }
  }

  const session = await createSession()
  const store = await cookies()
  store.set(SESSION_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: session.expires,
  })
  redirect(safeNext(formData.get('next')))
}
