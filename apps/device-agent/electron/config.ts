import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { App } from 'electron'
import { defaultSettings, sanitizeSettings } from '../shared/defaults.js'
import type { AppSettings } from '../shared/types.js'

export function getSettingsPath(app: App): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

export async function loadSettings(app: App): Promise<AppSettings> {
  const filePath = getSettingsPath(app)

  try {
    const raw = await readFile(filePath, 'utf8')
    return sanitizeSettings(JSON.parse(raw))
  } catch {
    return defaultSettings
  }
}

export async function saveSettings(app: App, settings: AppSettings): Promise<AppSettings> {
  const normalized = sanitizeSettings(settings)
  const filePath = getSettingsPath(app)

  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(normalized, null, 2), 'utf8')

  return normalized
}
