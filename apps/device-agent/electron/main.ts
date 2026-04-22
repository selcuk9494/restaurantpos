import path from 'node:path'
import { execFile } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, Menu, Tray, dialog, ipcMain, nativeImage, shell, type OpenDialogOptions } from 'electron'
import { BridgeHttpServer } from './bridge-server.js'
import { getSettingsPath, loadSettings, saveSettings } from './config.js'
import { runIngenicoOperation } from './ingenico.js'
import { parseOrderFile } from './parser.js'
import { syncTerminalRegistrationOperation } from './terminal-registration.js'
import { PrintWatcher } from './watcher.js'
import type {
  AppSettings,
  BridgeRequestLogItem,
  BridgeRuntimeInfo,
  IngenicoPaymentRequest,
  PrintJobLog,
  PrinterDiagnosticItem,
  PrinterDiagnostics,
  RuntimeState,
  TerminalHeartbeatRequest,
  TerminalOperation,
  TerminalOperationResult,
  TerminalRegistrationSettings,
  TerminalPairingConfirmRequest,
  TerminalRegisterRequest,
} from '../shared/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow: BrowserWindow | null = null
let watcher: PrintWatcher | null = null
let currentSettings: AppSettings | null = null
let tray: Tray | null = null
let isQuitting = false
let bridgeServer: BridgeHttpServer | null = null
let terminalHeartbeatTimer: NodeJS.Timeout | null = null
let terminalHeartbeatRunning = false

const runtimeState: RuntimeState = {
  watcherRunning: false,
  recentJobs: [],
}

function clearTerminalHeartbeatTimer(): void {
  if (terminalHeartbeatTimer) {
    clearTimeout(terminalHeartbeatTimer)
    terminalHeartbeatTimer = null
  }
}

function getHeartbeatStatusMessage(): string {
  return runtimeState.watcherRunning ? 'watcher-running' : 'watcher-idle'
}

function shouldRunAutoHeartbeat(settings: AppSettings): boolean {
  return settings.terminalRegistration.autoHeartbeatEnabled && settings.terminalRegistration.registrationStatus === 'registered'
}

function queueNextAutoHeartbeat(settings: AppSettings): void {
  clearTerminalHeartbeatTimer()
  if (!shouldRunAutoHeartbeat(settings)) {
    return
  }

  const delayMs = Math.max(15, settings.terminalRegistration.heartbeatIntervalSec) * 1000
  terminalHeartbeatTimer = setTimeout(() => {
    void runScheduledHeartbeat()
  }, delayMs)
}

async function syncAutoHeartbeatScheduler(): Promise<void> {
  const settings = await ensureSettings()
  queueNextAutoHeartbeat(settings)
}

async function runScheduledHeartbeat(): Promise<void> {
  if (terminalHeartbeatRunning) {
    return
  }

  const settings = await ensureSettings()
  if (!shouldRunAutoHeartbeat(settings)) {
    clearTerminalHeartbeatTimer()
    return
  }

  terminalHeartbeatRunning = true
  try {
    const result = await heartbeatTerminal({
      statusMessage: getHeartbeatStatusMessage(),
      notes: settings.terminalRegistration.notes,
    })
    if (!result.ok) {
      console.warn('Automatic terminal heartbeat returned a non-success result:', result.message)
    }
  } catch (error) {
    console.error('Automatic terminal heartbeat failed:', error)
    await syncAutoHeartbeatScheduler()
  } finally {
    terminalHeartbeatRunning = false
  }
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function parsePrinterOutput(output: string): string[] {
  const trimmed = output.trim()
  if (!trimmed) {
    return []
  }

  try {
    const parsed = JSON.parse(trimmed) as string | string[]
    const printers = Array.isArray(parsed) ? parsed : [parsed]
    return uniqueStrings(printers).sort((left, right) => left.localeCompare(right))
  } catch {
    const printers = trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && line.toLowerCase() !== 'name')
    return uniqueStrings(printers).sort((left, right) => left.localeCompare(right))
  }
}

async function runPrinterCommand(command: string, args: string[]): Promise<string[]> {
  return await new Promise<string[]>((resolve, reject) => {
    execFile(command, args, { windowsHide: true }, (error, stdout) => {
      if (error) {
        reject(error)
        return
      }

      resolve(parsePrinterOutput(stdout))
    })
  })
}

async function runPrinterDiagnostic(
  method: string,
  command: string,
  args: string[],
): Promise<PrinterDiagnosticItem> {
  try {
    const printers = await runPrinterCommand(command, args)
    return {
      method,
      success: true,
      printers,
    }
  } catch (error) {
    return {
      method,
      success: false,
      printers: [],
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
    }
  }
}

function getRendererEntryPath(): string {
  return path.join(__dirname, '../../dist/index.html')
}

function shouldLaunchHidden(): boolean {
  return process.argv.includes('--hidden')
}

function getAppIconPath(): string {
  const extension = process.platform === 'win32' ? 'ico' : 'png'
  const basePath = app.isPackaged ? app.getAppPath() : path.join(__dirname, '../..')
  return path.join(basePath, 'build-resources', `icon.${extension}`)
}

function getTrayIconPath(): string {
  const basePath = app.isPackaged ? app.getAppPath() : path.join(__dirname, '../..')
  return path.join(basePath, 'build-resources', process.platform === 'win32' ? 'icon-tray.ico' : 'icon-tray.png')
}

function createAppIcon(variant: 'window' | 'tray' = 'window'): Electron.NativeImage {
  if (variant === 'tray') {
    const trayIcon = nativeImage.createFromPath(getTrayIconPath())
    if (!trayIcon.isEmpty()) {
      return trayIcon
    }
  }

  const icon = nativeImage.createFromPath(getAppIconPath())
  if (!icon.isEmpty()) {
    return icon
  }

  const fallback = nativeImage.createFromPath(getAppIconPath())
  return fallback
}

function getRendererEntryUrl(): string | null {
  if (process.env.VITE_DEV_SERVER_URL) {
    return process.env.VITE_DEV_SERVER_URL
  }

  return null
}

function buildErrorHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <title>Resto Device Agent Hata</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: #f8fafc;
        color: #0f172a;
        display: grid;
        place-items: center;
        min-height: 100vh;
      }
      .panel {
        max-width: 720px;
        margin: 24px;
        padding: 24px;
        border-radius: 16px;
        background: white;
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
      }
      h1 {
        margin-top: 0;
      }
      pre {
        white-space: pre-wrap;
        background: #e2e8f0;
        padding: 12px;
        border-radius: 10px;
      }
    </style>
  </head>
  <body>
    <div class="panel">
      <h1>Arayuz Yuklenemedi</h1>
      <p>Uygulama arayuzu acilirken hata olustu.</p>
      <pre>${message}</pre>
    </div>
  </body>
</html>`
}

async function listWindowsPrinters(): Promise<string[]> {
  const diagnostics = await getPrinterDiagnostics()
  for (const result of diagnostics.results) {
    if (result.method !== 'Electron getPrintersAsync' && result.printers.length > 0) {
      return result.printers
    }
  }
  return []
}

async function getPrinterDiagnostics(): Promise<PrinterDiagnostics> {
  const results: PrinterDiagnosticItem[] = []

  if (process.platform === 'win32') {
    results.push(
      await runPrinterDiagnostic(
        'PowerShell Get-Printer',
        'powershell.exe',
        ['-NoProfile', '-Command', 'Get-Printer | Select-Object -ExpandProperty Name | ConvertTo-Json -Compress'],
      ),
    )
    results.push(
      await runPrinterDiagnostic(
        'PowerShell Win32_Printer',
        'powershell.exe',
        ['-NoProfile', '-Command', 'Get-CimInstance Win32_Printer | Select-Object -ExpandProperty Name | ConvertTo-Json -Compress'],
      ),
    )
    results.push(await runPrinterDiagnostic('WMIC Printer', 'cmd.exe', ['/c', 'wmic printer get name']))
  } else {
    results.push({
      method: 'Windows Komutlari',
      success: false,
      printers: [],
      error: `Bu isletim sistemi Windows degil: ${process.platform}`,
    })
  }

  if (mainWindow) {
    try {
      if (mainWindow.webContents.isLoading()) {
        await new Promise<void>((resolve) => {
          mainWindow?.webContents.once('did-finish-load', () => resolve())
        })
      }

      const printers = await mainWindow.webContents.getPrintersAsync()
      results.push({
        method: 'Electron getPrintersAsync',
        success: true,
        printers: uniqueStrings(printers.map((printer) => printer.name)).sort((left, right) => left.localeCompare(right)),
      })
    } catch (error) {
      results.push({
        method: 'Electron getPrintersAsync',
        success: false,
        printers: [],
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      })
    }
  } else {
    results.push({
      method: 'Electron getPrintersAsync',
      success: false,
      printers: [],
      error: 'Ana pencere henuz hazir degil.',
    })
  }

  return {
    platform: process.platform,
    results,
  }
}

async function listAvailablePrinters(): Promise<string[]> {
  const windowsPrinters = await listWindowsPrinters()
  if (windowsPrinters.length > 0) {
    return windowsPrinters
  }

  const diagnostics = await getPrinterDiagnostics()
  const electronResult = diagnostics.results.find((item) => item.method === 'Electron getPrintersAsync')
  return electronResult?.printers ?? []
}

function publishJob(job: PrintJobLog): void {
  runtimeState.recentJobs = [job, ...runtimeState.recentJobs].slice(0, 50)
  mainWindow?.webContents.send('watcher:job', job)
}

async function ensureSettings(): Promise<AppSettings> {
  if (!currentSettings) {
    currentSettings = await loadSettings(app)
  }
  return currentSettings
}

async function storeSettingsLocally(settings: AppSettings): Promise<AppSettings> {
  currentSettings = await saveSettings(app, settings)
  return currentSettings
}

function buildTerminalPairingCode(settings: AppSettings): string {
  return `${settings.terminalIdentity.branchCode}-${settings.terminalIdentity.terminalCode}`
    .replace(/\s+/g, '')
    .toUpperCase()
}

function buildTerminalId(settings: AppSettings): string {
  return `${settings.terminalIdentity.branchCode}-${settings.terminalIdentity.terminalCode}`
    .replace(/\s+/g, '-')
    .toLowerCase()
}

function normalizeRemoteRegistrationStatus(
  operation: TerminalOperation,
  current: TerminalRegistrationSettings,
  patch: Partial<TerminalRegistrationSettings>,
  remoteOk: boolean,
): TerminalRegistrationSettings['registrationStatus'] {
  if (patch.registrationStatus === 'registered' || patch.registrationStatus === 'pairing' || patch.registrationStatus === 'unregistered') {
    return patch.registrationStatus
  }

  const remoteText = [
    patch.lastRemoteSummary,
    patch.lastRemoteMessage,
    patch.lastRemoteError,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const mappedStatus = findMappedRemoteStatus(current, remoteText)
  if (mappedStatus) {
    return mappedStatus
  }

  if (!remoteOk) {
    return current.registrationStatus
  }
  if (operation === 'pairing-confirm') {
    return 'registered'
  }
  if (operation === 'register') {
    return current.registrationStatus === 'registered' ? 'registered' : 'pairing'
  }
  return current.registrationStatus
}

function findMappedRemoteStatus(
  current: TerminalRegistrationSettings,
  value: string,
): TerminalRegistrationSettings['registrationStatus'] | undefined {
  const aliases = getRemoteStatusAliases(current)

  for (const [status, aliasList] of Object.entries(aliases) as Array<
    [TerminalRegistrationSettings['registrationStatus'], string[]]
  >) {
    if (containsOneOf(value, aliasList)) {
      return status
    }
  }

  return undefined
}

function getRemoteStatusAliases(
  current: TerminalRegistrationSettings,
): Record<TerminalRegistrationSettings['registrationStatus'], string[]> {
  return {
    registered: parseAliasList(current.remoteRegisteredAliases),
    pairing: parseAliasList(current.remotePairingAliases),
    unregistered: parseAliasList(current.remoteUnregisteredAliases),
  }
}

function parseAliasList(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
}

function containsOneOf(value: string, keywords: string[]): boolean {
  return keywords.some((keyword) => value.includes(keyword))
}

function mergeRemoteTerminalRegistration(
  settings: AppSettings,
  operation: TerminalOperation,
  remoteOk: boolean,
  syncedAt: string,
  patch: Partial<TerminalRegistrationSettings>,
): TerminalRegistrationSettings {
  const current = settings.terminalRegistration
  const merged: TerminalRegistrationSettings = {
    ...current,
    ...patch,
  }

  merged.registrationStatus = normalizeRemoteRegistrationStatus(operation, current, patch, remoteOk)
  merged.lastSyncAt = patch.lastSyncAt || (remoteOk ? syncedAt : current.lastSyncAt)
  merged.pairingCode = merged.pairingCode || buildTerminalPairingCode(settings)
  merged.terminalId = merged.terminalId || buildTerminalId(settings)
  merged.lastRemoteOperation = patch.lastRemoteOperation ?? operation
  merged.lastRemoteSummary = patch.lastRemoteSummary ?? current.lastRemoteSummary
  merged.lastRemoteEndpoint = patch.lastRemoteEndpoint ?? current.lastRemoteEndpoint
  merged.lastRemoteMessage = patch.lastRemoteMessage ?? current.lastRemoteMessage
  merged.lastRemoteError = patch.lastRemoteError ?? current.lastRemoteError

  if (operation === 'pairing-confirm' && remoteOk && !merged.deviceSecret) {
    merged.deviceSecret = current.deviceSecret || `secret-${Date.now().toString(36)}`
  }

  return merged
}

async function registerTerminal(request: TerminalRegisterRequest): Promise<TerminalOperationResult> {
  const settings = await ensureSettings()
  const now = new Date().toISOString()
  let nextSettings: AppSettings = {
    ...settings,
    terminalRegistration: {
      ...settings.terminalRegistration,
      adminPanelUrl: request.adminPanelUrl?.trim() || settings.terminalRegistration.adminPanelUrl,
      organizationId: request.organizationId?.trim() || settings.terminalRegistration.organizationId,
      locationId: request.locationId?.trim() || settings.terminalRegistration.locationId,
      terminalId: request.terminalId?.trim() || settings.terminalRegistration.terminalId,
      pairingCode: request.pairingCode?.trim().toUpperCase() || settings.terminalRegistration.pairingCode || buildTerminalPairingCode(settings),
      pairingToken: request.pairingToken?.trim() || settings.terminalRegistration.pairingToken || `pair-${Date.now().toString(36)}`,
      registrationStatus: 'pairing',
      lastPairingAt: now,
      lastRemoteError: '',
      notes: request.notes?.trim() || settings.terminalRegistration.notes,
    },
  }

  const remoteResult = await syncTerminalRegistrationOperation(nextSettings, runtimeState, 'register', request)
  nextSettings = {
    ...nextSettings,
    terminalRegistration: mergeRemoteTerminalRegistration(
      nextSettings,
      'register',
      remoteResult.remoteOk,
      remoteResult.syncedAt,
      remoteResult.registrationPatch,
    ),
  }

  const saved = await storeSettingsLocally(nextSettings)
  await syncAutoHeartbeatScheduler()
  return {
    ok: remoteResult.remoteOk,
    operation: 'register',
    message: remoteResult.message,
    syncedAt: remoteResult.syncedAt,
    terminalIdentity: saved.terminalIdentity,
    terminalRegistration: saved.terminalRegistration,
  }
}

async function heartbeatTerminal(request: TerminalHeartbeatRequest): Promise<TerminalOperationResult> {
  const settings = await ensureSettings()
  const now = new Date().toISOString()
  let nextSettings: AppSettings = {
    ...settings,
    terminalRegistration: {
      ...settings.terminalRegistration,
      lastSyncAt: now,
      lastRemoteError: '',
      notes: request.notes?.trim() || settings.terminalRegistration.notes,
    },
  }

  const remoteResult = await syncTerminalRegistrationOperation(nextSettings, runtimeState, 'heartbeat', request)
  nextSettings = {
    ...nextSettings,
    terminalRegistration: mergeRemoteTerminalRegistration(
      nextSettings,
      'heartbeat',
      remoteResult.remoteOk,
      remoteResult.syncedAt,
      remoteResult.registrationPatch,
    ),
  }

  const saved = await storeSettingsLocally(nextSettings)
  await syncAutoHeartbeatScheduler()
  return {
    ok: remoteResult.remoteOk,
    operation: 'heartbeat',
    message: remoteResult.message,
    syncedAt: remoteResult.syncedAt,
    terminalIdentity: saved.terminalIdentity,
    terminalRegistration: saved.terminalRegistration,
  }
}

async function confirmTerminalPairing(request: TerminalPairingConfirmRequest): Promise<TerminalOperationResult> {
  const settings = await ensureSettings()
  const now = new Date().toISOString()
  let nextSettings: AppSettings = {
    ...settings,
    terminalRegistration: {
      ...settings.terminalRegistration,
      organizationId: request.organizationId?.trim() || settings.terminalRegistration.organizationId,
      locationId: request.locationId?.trim() || settings.terminalRegistration.locationId,
      terminalId: request.terminalId?.trim() || settings.terminalRegistration.terminalId || buildTerminalId(settings),
      pairingToken: request.pairingToken?.trim() || settings.terminalRegistration.pairingToken,
      deviceSecret: request.deviceSecret?.trim() || settings.terminalRegistration.deviceSecret || `secret-${Date.now().toString(36)}`,
      registrationStatus: 'registered',
      lastPairingAt: settings.terminalRegistration.lastPairingAt || now,
      lastSyncAt: now,
      lastRemoteError: '',
      notes: request.notes?.trim() || settings.terminalRegistration.notes,
    },
  }

  const remoteResult = await syncTerminalRegistrationOperation(nextSettings, runtimeState, 'pairing-confirm', request)
  nextSettings = {
    ...nextSettings,
    terminalRegistration: mergeRemoteTerminalRegistration(
      nextSettings,
      'pairing-confirm',
      remoteResult.remoteOk,
      remoteResult.syncedAt,
      remoteResult.registrationPatch,
    ),
  }

  const saved = await storeSettingsLocally(nextSettings)
  await syncAutoHeartbeatScheduler()
  return {
    ok: remoteResult.remoteOk,
    operation: 'pairing-confirm',
    message: remoteResult.message,
    syncedAt: remoteResult.syncedAt,
    terminalIdentity: saved.terminalIdentity,
    terminalRegistration: saved.terminalRegistration,
  }
}

async function runIngenico(operation: 'test' | 'precheck' | 'pairing' | 'payment' | 'cancel', paymentRequest?: IngenicoPaymentRequest) {
  const settings = await ensureSettings()
  return await runIngenicoOperation(app, settings, operation, paymentRequest)
}

async function getBridgeRuntimeInfo(): Promise<BridgeRuntimeInfo> {
  const settings = await ensureSettings()
  const baseRuntimeInfo: BridgeRuntimeInfo = {
    enabled: settings.bridge.enabled,
    address: bridgeServer ? bridgeServer.getAddress() : `${settings.bridge.host}:${settings.bridge.port}`,
    authRequired: settings.bridge.authRequired,
    requestLogLimit: settings.bridge.requestLogLimit,
    requestCount: bridgeServer?.getRequestLogs().length ?? 0,
    autoHeartbeatScheduled: terminalHeartbeatTimer !== null,
    autoHeartbeatRunning: terminalHeartbeatRunning,
    terminalIdentity: settings.terminalIdentity,
    terminalRegistration: settings.terminalRegistration,
    recentRequests: bridgeServer?.getRequestLogs() ?? [],
  }

  return bridgeServer
    ? {
        ...bridgeServer.getRuntimeInfo(settings),
        ...baseRuntimeInfo,
      }
    : baseRuntimeInfo
}

async function getBridgeRequestLogs(): Promise<BridgeRequestLogItem[]> {
  return bridgeServer?.getRequestLogs() ?? []
}

async function syncBridgeServer(): Promise<void> {
  await bridgeServer?.stop()
  bridgeServer = null

  const settings = await ensureSettings()
  if (!settings.bridge.enabled) {
    return
  }

  bridgeServer = new BridgeHttpServer({
    getSettings: ensureSettings,
    getRuntimeState: () => runtimeState,
    registerTerminal,
    heartbeatTerminal,
    confirmTerminalPairing,
    runIngenicoOperation: runIngenico,
  })
  await bridgeServer.start()
}

function createTrayIcon(): Tray {
  const nextTray = new Tray(process.platform === 'win32' ? getTrayIconPath() : createAppIcon('tray'))
  if (process.platform === 'win32') {
    nextTray.setImage(getTrayIconPath())
  }
  nextTray.setToolTip('Resto Device Agent')
  nextTray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Goster',
        click: () => {
          mainWindow?.show()
          mainWindow?.focus()
        },
      },
      {
        label: 'Cikis',
        click: () => {
          isQuitting = true
          app.quit()
        },
      },
    ]),
  )
  nextTray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
  return nextTray
}

function lockRendererSession(): void {
  mainWindow?.webContents.send('app:lock')
}

function applyLoginItemSettings(settings: AppSettings): void {
  if (process.platform !== 'win32') {
    return
  }

  const openAtLogin = settings.general.launchOnWindowsStartup
  const isPackaged = app.isPackaged

  app.setLoginItemSettings({
    openAtLogin,
    path: process.execPath,
    args: isPackaged ? ['--hidden'] : [],
  })
}

async function createMainWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 820,
    height: 540,
    minWidth: 700,
    minHeight: 480,
    autoHideMenuBar: true,
    icon: createAppIcon('window'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: true,
      sandbox: false,
    },
  })

  mainWindow.on('close', async (event) => {
    const settings = await ensureSettings()
    if (isQuitting || !settings.general.closeToTray) {
      return
    }

    event.preventDefault()
    lockRendererSession()
    mainWindow?.hide()
  })

  mainWindow.on('minimize', () => {
    lockRendererSession()
  })

  mainWindow.on('hide', () => {
    lockRendererSession()
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    void mainWindow?.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(
        buildErrorHtml(`Kod: ${errorCode}\nMesaj: ${errorDescription}\nURL: ${validatedURL}`),
      )}`,
    )
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    void mainWindow?.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(
        buildErrorHtml(`Renderer kapandi.\nSebep: ${details.reason}\nKod: ${details.exitCode ?? '-'}`),
      )}`,
    )
  })

  const rendererUrl = getRendererEntryUrl()
  if (rendererUrl) {
    await mainWindow.loadURL(rendererUrl)
  } else {
    await mainWindow.loadFile(getRendererEntryPath())
  }

  if (shouldLaunchHidden()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
  }

  if (process.platform === 'win32') {
    mainWindow.setOverlayIcon(null, '')
  }
}

async function stopWatcher(): Promise<void> {
  if (watcher) {
    await watcher.stop()
    watcher = null
  }
  runtimeState.watcherRunning = false
}

async function startWatcher(): Promise<void> {
  const settings = await ensureSettings()
  await stopWatcher()

  watcher = new PrintWatcher(settings, {
    onJob: publishJob,
  })
  await watcher.start()
  runtimeState.watcherRunning = true
}

async function applyImportedSettings(settings: AppSettings): Promise<AppSettings> {
  currentSettings = await saveSettings(app, settings)
  applyLoginItemSettings(currentSettings)
  await syncBridgeServer()
  await syncAutoHeartbeatScheduler()

  if (runtimeState.watcherRunning) {
    await startWatcher()
  }

  return currentSettings
}

async function exportSettingsBackup(): Promise<string | null> {
  const settings = await ensureSettings()
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const defaultPath = path.join(app.getPath('documents'), `resto-device-agent-settings-${timestamp}.json`)
  const result = mainWindow
    ? await dialog.showSaveDialog(mainWindow, {
        title: 'Ayar Yedegini Kaydet',
        defaultPath,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      })
    : await dialog.showSaveDialog({
        title: 'Ayar Yedegini Kaydet',
        defaultPath,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      })

  if (result.canceled || !result.filePath) {
    return null
  }

  await saveSettings(app, settings)
  const raw = await readFile(getSettingsPath(app), 'utf8')
  await writeFile(result.filePath, raw, 'utf8')
  return result.filePath
}

async function importSettingsBackup(): Promise<AppSettings | null> {
  const result = mainWindow
    ? await dialog.showOpenDialog(mainWindow, {
        title: 'Ayar Yedegini Sec',
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }],
      })
    : await dialog.showOpenDialog({
        title: 'Ayar Yedegini Sec',
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }],
      })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const raw = await readFile(result.filePaths[0], 'utf8')
  const parsed = JSON.parse(raw) as AppSettings
  return await applyImportedSettings(parsed)
}

async function openSettingsDirectory(): Promise<string> {
  const settingsDir = path.dirname(getSettingsPath(app))
  const error = await shell.openPath(settingsDir)
  if (error) {
    throw new Error(error)
  }

  return settingsDir
}

function registerIpc(): void {
  ipcMain.handle('settings:load', async () => ensureSettings())

  ipcMain.handle('settings:save', async (_event, settings: AppSettings) => {
    return await applyImportedSettings(settings)
  })

  ipcMain.handle('settings:export-backup', async () => await exportSettingsBackup())
  ipcMain.handle('settings:import-backup', async () => await importSettingsBackup())
  ipcMain.handle('settings:open-directory', async () => await openSettingsDirectory())

  ipcMain.handle('printers:list', async () => {
    return await listAvailablePrinters()
  })

  ipcMain.handle('printers:diagnostics', async () => {
    return await getPrinterDiagnostics()
  })

  ipcMain.handle('preview:pick-file', async () => {
    const options: OpenDialogOptions = {
      title: 'Onizlenecek Siparis Dosyasini Sec',
      properties: ['openFile'],
      filters: [
        { name: 'Desteklenen Dosyalar', extensions: ['txt', 'json', '*'] },
        { name: 'Tum Dosyalar', extensions: ['*'] },
      ],
    }

    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, options)
      : await dialog.showOpenDialog(options)

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  ipcMain.handle('directory:pick', async (_event, title?: string) => {
    const options: OpenDialogOptions = {
      title: title || 'Klasor Sec',
      properties: ['openDirectory'],
    }

    const result = mainWindow
      ? await dialog.showOpenDialog(mainWindow, options)
      : await dialog.showOpenDialog(options)

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  ipcMain.handle('preview:load-file', async (_event, filePath: string) => {
    return await parseOrderFile(filePath)
  })

  ipcMain.handle('runtime:get-state', async () => runtimeState)
  ipcMain.handle('bridge:get-runtime', async () => await getBridgeRuntimeInfo())
  ipcMain.handle('bridge:get-logs', async () => await getBridgeRequestLogs())
  ipcMain.handle('terminal:register', async (_event, request: TerminalRegisterRequest) => await registerTerminal(request))
  ipcMain.handle('terminal:heartbeat', async (_event, request: TerminalHeartbeatRequest) => await heartbeatTerminal(request))
  ipcMain.handle('terminal:pairing-confirm', async (_event, request: TerminalPairingConfirmRequest) => await confirmTerminalPairing(request))

  ipcMain.handle('ingenico:test', async () => await runIngenico('test'))

  ipcMain.handle('ingenico:precheck', async () => await runIngenico('precheck'))

  ipcMain.handle('ingenico:pairing', async () => await runIngenico('pairing'))

  ipcMain.handle('ingenico:cancel', async () => await runIngenico('cancel'))

  ipcMain.handle('ingenico:pay', async (_event, paymentRequest: IngenicoPaymentRequest) => await runIngenico('payment', paymentRequest))

  ipcMain.handle('watcher:start', async () => {
    await startWatcher()
    return runtimeState
  })

  ipcMain.handle('watcher:stop', async () => {
    await stopWatcher()
    return runtimeState
  })
}

app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.selcukyilmaz.resto.deviceagent')
  }
  currentSettings = await loadSettings(app)
  applyLoginItemSettings(currentSettings)
  registerIpc()
  await syncBridgeServer()
  await syncAutoHeartbeatScheduler()
  tray = createTrayIcon()
  await createMainWindow()

  if (currentSettings.general.autoStart && currentSettings.general.watchDirectory) {
    try {
      await startWatcher()
    } catch (error) {
      publishJob({
        id: `${Date.now()}-${Math.random()}`,
        filePath: currentSettings.general.watchDirectory,
        fileName: path.basename(currentSettings.general.watchDirectory),
        printerNo: null,
        printerName: null,
        status: 'error',
        message: error instanceof Error ? error.message : 'Izleme baslatilamadi.',
        createdAt: new Date().toISOString(),
      })
    }
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') {
    return
  }
})

app.on('before-quit', () => {
  isQuitting = true
  tray?.destroy()
  clearTerminalHeartbeatTimer()
  void stopWatcher()
  void bridgeServer?.stop()
})
