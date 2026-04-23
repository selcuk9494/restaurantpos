import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { access } from 'node:fs/promises'
import { app, BrowserWindow, Menu, shell } from 'electron'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const API_HEALTH_URL = 'http://127.0.0.1:3000/v1/health'
const DEFAULT_DATABASE_URL =
  'postgresql://resto:resto@127.0.0.1:5432/resto_platform?schema=public'

let mainWindow: BrowserWindow | null = null
let apiBootPromise: Promise<void> | null = null

function getRendererEntryPath(): string {
  return path.join(__dirname, '../../dist/index.html')
}

function getRendererEntryUrl(): string | null {
  return process.env.VITE_DEV_SERVER_URL ?? null
}

function getApiScriptPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'embedded-api/dist/src/main.js')
  }

  return path.join(__dirname, '../../../../services/api/dist/src/main.js')
}

async function canAccessFile(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function isApiHealthy(): Promise<boolean> {
  try {
    const response = await fetch(API_HEALTH_URL, {
      signal: AbortSignal.timeout(1200),
    })
    return response.ok
  } catch {
    return false
  }
}

async function waitForApi(timeoutMs = 15000): Promise<boolean> {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    if (await isApiHealthy()) {
      return true
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return false
}

async function ensureEmbeddedApi(): Promise<void> {
  if (await isApiHealthy()) {
    return
  }

  if (!apiBootPromise) {
    const apiScriptPath = getApiScriptPath()

    apiBootPromise = (async () => {
      if (!(await canAccessFile(apiScriptPath))) {
        throw new Error(
          `Yerel API build dosyasi bulunamadi: ${apiScriptPath}. Once @resto/api build alinmalidir.`,
        )
      }

      process.env.DATABASE_URL = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL
      process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me'

      console.log(`[pos-desktop] booting embedded api from ${apiScriptPath}`)
      require(apiScriptPath)
      console.log('[pos-desktop] embedded api module loaded')

      const ready = await waitForApi()
      if (!ready) {
        throw new Error(
          'Yerel API baslatildi fakat cevap vermedi. Docker ve PostgreSQL baglantisini kontrol et.',
        )
      }
    })().catch((error) => {
      apiBootPromise = null
      throw error
    })
  }

  await apiBootPromise
}

function buildErrorHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <title>Resto POS Hata</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: #111827;
        color: #e5eefb;
        display: grid;
        place-items: center;
        min-height: 100vh;
      }
      .panel {
        max-width: 760px;
        margin: 24px;
        padding: 24px;
        border-radius: 16px;
        background: #1f2937;
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.3);
      }
      h1 {
        margin-top: 0;
        color: #f0a443;
      }
      pre {
        white-space: pre-wrap;
        background: #0f172a;
        padding: 12px;
        border-radius: 10px;
        color: #dbeafe;
      }
    </style>
  </head>
  <body>
    <div class="panel">
      <h1>POS Baslatilamadi</h1>
      <p>Yerel API veya veritabani hazir degil.</p>
      <pre>${message}</pre>
      <p>Docker acik oldugundan ve resto-pos-db container'inin calistigindan emin ol.</p>
    </div>
  </body>
</html>`
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 960,
    minWidth: 1200,
    minHeight: 760,
    autoHideMenuBar: true,
    title: 'Resto POS',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  Menu.setApplicationMenu(null)

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  try {
    await ensureEmbeddedApi()

    const entryUrl = getRendererEntryUrl()
    if (entryUrl) {
      await mainWindow.loadURL(entryUrl)
    } else {
      await mainWindow.loadFile(getRendererEntryPath())
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bilinmeyen hata'
    console.error('[pos-desktop] window bootstrap failed:', message)
    await mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(buildErrorHtml(message))}`)
  }
}

app.whenReady().then(async () => {
  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
