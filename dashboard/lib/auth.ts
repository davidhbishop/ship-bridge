// Single-password session for a private, one-person dashboard.
// The cookie holds "<expiry>.<hmac(expiry)>" signed with SESSION_SECRET, so
// it can be checked in proxy.ts and in server components without a database.

export const SESSION_COOKIE = 'sb_session'
export const SESSION_DAYS = 30

const encoder = new TextEncoder()

function secret(): string {
  const value = process.env.SESSION_SECRET
  if (!value || value.length < 32) {
    throw new Error('SESSION_SECRET must be set to at least 32 characters')
  }
  return value
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  let binary = ''
  for (const byte of new Uint8Array(signature)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Constant-time string comparison, so response timing does not leak how
// much of a password or signature matched.
export function safeEqual(a: string, b: string): boolean {
  const left = encoder.encode(a)
  const right = encoder.encode(b)
  let diff = left.length ^ right.length
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0)
  }
  return diff === 0
}

export function checkPassword(attempt: string): boolean {
  const expected = process.env.DASHBOARD_PASSWORD
  if (!expected) return false
  return safeEqual(attempt, expected)
}

export async function createSession(now = Date.now()): Promise<{ value: string; expires: Date }> {
  const expires = new Date(now + SESSION_DAYS * 24 * 60 * 60 * 1000)
  const payload = String(expires.getTime())
  return { value: `${payload}.${await hmac(payload)}`, expires }
}

export async function verifySession(value: string | undefined, now = Date.now()): Promise<boolean> {
  if (!value) return false
  const [payload, signature] = value.split('.')
  if (!payload || !signature) return false
  const expiry = Number(payload)
  if (!Number.isFinite(expiry) || expiry < now) return false
  try {
    return safeEqual(signature, await hmac(payload))
  } catch {
    return false
  }
}
