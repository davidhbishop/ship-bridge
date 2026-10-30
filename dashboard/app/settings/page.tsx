import { redirect } from 'next/navigation'
import { isDemo, loadSettings } from '@/lib/data'
import { hasSession } from '@/lib/session'
import { INSHORE_AREAS } from '@/lib/settings'
import { SettingsForm } from './SettingsForm'

export default async function SettingsPage() {
  if (!(await hasSession())) redirect('/login?next=/settings')
  const { settings, error } = await loadSettings()
  return (
    <main className="page">
      <header className="header">
        <div>
          <h1>Settings</h1>
          <div className="sub">Shared with the forecast workers and the TRMNL screens.</div>
        </div>
        <nav className="toolbar">
          <a className="chip" href="/">
            Back to dashboard
          </a>
        </nav>
      </header>
      {error && (
        <div className="alerts">
          <div className="alert alert-warning">
            <strong>Could not load saved settings</strong>
            <span>{error}. Showing defaults; saving will overwrite.</span>
          </div>
        </div>
      )}
      {isDemo && (
        <div className="alerts">
          <div className="alert alert-info">
            <strong>Sample mode</strong>
            <span>Settings are kept in memory until the forecast API is configured.</span>
          </div>
        </div>
      )}
      <SettingsForm initial={settings} areas={INSHORE_AREAS} />
    </main>
  )
}
