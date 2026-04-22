import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppSettings,
  BridgeRequestLogItem,
  BridgeRuntimeInfo,
  IngenicoOperationResult,
  IngenicoPaymentRequest,
  PrintJobLog,
  PrinterDiagnostics,
  ReceiptPreviewData,
  RuntimeState,
  TerminalHeartbeatRequest,
  TerminalOperationResult,
  TerminalPairingConfirmRequest,
  TerminalRegisterRequest,
} from '../shared/types.js'

const api = {
  loadSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings: AppSettings): Promise<AppSettings> => ipcRenderer.invoke('settings:save', settings),
  listSystemPrinters: (): Promise<string[]> => ipcRenderer.invoke('printers:list'),
  getPrinterDiagnostics: (): Promise<PrinterDiagnostics> => ipcRenderer.invoke('printers:diagnostics'),
  pickDirectory: (title?: string): Promise<string | null> => ipcRenderer.invoke('directory:pick', title),
  pickPreviewFile: (): Promise<string | null> => ipcRenderer.invoke('preview:pick-file'),
  loadPreviewFile: (filePath: string): Promise<ReceiptPreviewData> => ipcRenderer.invoke('preview:load-file', filePath),
  getRuntimeState: (): Promise<RuntimeState> => ipcRenderer.invoke('runtime:get-state'),
  getBridgeRuntime: (): Promise<BridgeRuntimeInfo> => ipcRenderer.invoke('bridge:get-runtime'),
  getBridgeLogs: (): Promise<BridgeRequestLogItem[]> => ipcRenderer.invoke('bridge:get-logs'),
  exportSettingsBackup: (): Promise<string | null> => ipcRenderer.invoke('settings:export-backup'),
  importSettingsBackup: (): Promise<AppSettings | null> => ipcRenderer.invoke('settings:import-backup'),
  openSettingsDirectory: (): Promise<string> => ipcRenderer.invoke('settings:open-directory'),
  terminalRegister: (request: TerminalRegisterRequest): Promise<TerminalOperationResult> => ipcRenderer.invoke('terminal:register', request),
  terminalHeartbeat: (request: TerminalHeartbeatRequest): Promise<TerminalOperationResult> => ipcRenderer.invoke('terminal:heartbeat', request),
  terminalPairingConfirm: (request: TerminalPairingConfirmRequest): Promise<TerminalOperationResult> =>
    ipcRenderer.invoke('terminal:pairing-confirm', request),
  startWatcher: (): Promise<RuntimeState> => ipcRenderer.invoke('watcher:start'),
  stopWatcher: (): Promise<RuntimeState> => ipcRenderer.invoke('watcher:stop'),
  ingenicoTest: (): Promise<IngenicoOperationResult> => ipcRenderer.invoke('ingenico:test'),
  ingenicoPrecheck: (): Promise<IngenicoOperationResult> => ipcRenderer.invoke('ingenico:precheck'),
  ingenicoPairing: (): Promise<IngenicoOperationResult> => ipcRenderer.invoke('ingenico:pairing'),
  ingenicoCancel: (): Promise<IngenicoOperationResult> => ipcRenderer.invoke('ingenico:cancel'),
  ingenicoPay: (paymentRequest: IngenicoPaymentRequest): Promise<IngenicoOperationResult> =>
    ipcRenderer.invoke('ingenico:pay', paymentRequest),
  onJob: (callback: (job: PrintJobLog) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, job: PrintJobLog) => callback(job)
    ipcRenderer.on('watcher:job', listener)
    return () => ipcRenderer.removeListener('watcher:job', listener)
  },
  onAppLock: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('app:lock', listener)
    return () => ipcRenderer.removeListener('app:lock', listener)
  },
}

declare global {
  interface Window {
    printServerAPI: typeof api
  }
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('printServerAPI', api)
} else {
  window.printServerAPI = api
}
