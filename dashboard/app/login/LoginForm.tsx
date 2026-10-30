'use client'

import { useActionState } from 'react'
import { login, type LoginState } from './actions'

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null })
  return (
    <form action={action}>
      <h1 style={{ margin: 0 }}>Ship Bridge</h1>
      <p className="muted" style={{ margin: 0 }}>
        Private dashboard. Enter the password to continue.
      </p>
      <input type="hidden" name="next" value={next} />
      <input
        type="password"
        name="password"
        autoComplete="current-password"
        placeholder="Password"
        aria-label="Password"
        required
        autoFocus
      />
      {state.error && (
        <p className="error" role="alert" style={{ margin: 0 }}>
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending}>
        {pending ? 'Checking…' : 'Sign in'}
      </button>
    </form>
  )
}
