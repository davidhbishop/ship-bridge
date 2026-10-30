'use server'

import { revalidatePath } from 'next/cache'
import { saveSettings } from '@/lib/data'
import { hasSession } from '@/lib/session'
import { SettingsError, validateSettings, type Settings } from '@/lib/settings'

export type SaveState = { error: string | null; savedAt: string | null; nextFetchAt?: string; settings?: Settings }

export async function save(_state: SaveState, formData: FormData): Promise<SaveState> {
  if (!(await hasSession())) return { error: 'Your session has expired. Sign in again.', savedAt: null }
  try {
    const settings = validateSettings(JSON.parse(String(formData.get('settings') ?? '{}')))
    const result = await saveSettings(settings)
    revalidatePath('/', 'layout')
    return { error: null, savedAt: new Date().toISOString(), nextFetchAt: result.nextFetchAt, settings: result.settings }
  } catch (error) {
    if (error instanceof SettingsError || error instanceof Error) return { error: error.message, savedAt: null }
    return { error: 'Could not save settings', savedAt: null }
  }
}
