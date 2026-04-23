import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, Menu, shell } from 'electron'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null

function getRendererEntryPath(): string {
  return path.join(__dirname, '../../dist/index.html')
}

function getRendererEntryUrl(): string | null {
  return process.env.VITE_DEV_SERVER_URL ?? null
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

  const entryUrl = getRendererEntryUrl()
  if (entryUrl) {
    await mainWindow.loadURL(entryUrl)
  } else {
    await mainWindow.loadFile(getRendererEntryPath())
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
