import { useEffect, useMemo, useRef, useState } from 'react'
import { createPrinterConfig, defaultSettings, sanitizeSettings } from '../shared/defaults'
import { buildStyledReceiptLines } from '../shared/receipt'
import type {
  AppSettings,
  BridgeRequestLogItem,
  BridgeRuntimeInfo,
  IngenicoOperationResult,
  IngenicoPaymentRequest,
  PrintJobLog,
  PrinterConfig,
  PrinterDiagnostics,
  ReceiptPreviewData,
  RuntimeState,
  TerminalHeartbeatRequest,
  TerminalOperationResult,
  TerminalPairingConfirmRequest,
  TerminalRegistrationStatus,
  TerminalRegisterRequest,
} from '../shared/types'
import './App.css'

type TabKey = 'genel' | 'fis' | 'cihazlar' | 'onizleme'
type DeviceSectionKey = 'ozet' | 'yazicilar' | 'ingenico' | 'bridge' | 'tani' | 'loglar'
type AliasSnapshot = {
  registered: string
  pairing: string
  unregistered: string
}
type AliasUndoState = {
  label: string
  before: AliasSnapshot
  after: AliasSnapshot
}
type DesktopApi = {
  loadSettings: () => Promise<AppSettings>
  saveSettings: (settings: AppSettings) => Promise<AppSettings>
  listSystemPrinters: () => Promise<string[]>
  getPrinterDiagnostics: () => Promise<PrinterDiagnostics>
  pickDirectory: (title?: string) => Promise<string | null>
  pickPreviewFile: () => Promise<string | null>
  loadPreviewFile: (filePath: string) => Promise<ReceiptPreviewData>
  getRuntimeState: () => Promise<RuntimeState>
  getBridgeRuntime: () => Promise<BridgeRuntimeInfo>
  getBridgeLogs: () => Promise<BridgeRequestLogItem[]>
  exportSettingsBackup: () => Promise<string | null>
  importSettingsBackup: () => Promise<AppSettings | null>
  openSettingsDirectory: () => Promise<string>
  terminalRegister: (request: TerminalRegisterRequest) => Promise<TerminalOperationResult>
  terminalHeartbeat: (request: TerminalHeartbeatRequest) => Promise<TerminalOperationResult>
  terminalPairingConfirm: (request: TerminalPairingConfirmRequest) => Promise<TerminalOperationResult>
  startWatcher: () => Promise<RuntimeState>
  stopWatcher: () => Promise<RuntimeState>
  ingenicoTest: () => Promise<IngenicoOperationResult>
  ingenicoPrecheck: () => Promise<IngenicoOperationResult>
  ingenicoPairing: () => Promise<IngenicoOperationResult>
  ingenicoCancel: () => Promise<IngenicoOperationResult>
  ingenicoPay: (paymentRequest: IngenicoPaymentRequest) => Promise<IngenicoOperationResult>
  onJob: (callback: (job: PrintJobLog) => void) => () => void
  onAppLock: (callback: () => void) => () => void
}

const demoReceiptText = `Masa 4
2 x Adana Durum
1 x Ayran
------------------------
Toplam: 420.00 TL
Not: Acisiz olsun`

const fontPresets = [
  { label: 'Fis Standart', value: "'Courier New', Courier, monospace" },
  { label: 'Consolas', value: "Consolas, 'Courier New', monospace" },
  { label: 'Lucida Console', value: "'Lucida Console', 'Courier New', monospace" },
  { label: 'Segoe UI', value: "'Segoe UI', Arial, sans-serif" },
]

const terminalStatusAliasPresets = [
  {
    key: 'standart',
    label: 'Standart',
    registered: 'registered, active, approved, confirmed, paired, connected, online, enabled, ready, completed, success',
    pairing: 'pairing, pending, awaiting, waiting, verification, verify, code, awaiting_code, pending_pair, pair_required, pair-requested, challenge',
    unregistered: 'unregistered, revoked, deleted, disabled, rejected, inactive, blocked, cancelled, canceled, expired, removed',
  },
  {
    key: 'awaiting-code',
    label: 'Awaiting Code',
    registered: 'registered, active, approved, confirmed, paired, connected, ready, success',
    pairing: 'awaiting_code, verification_required, verification_pending, code_wait, code_sent, pending_code, pending_pair, pairing, pending',
    unregistered: 'revoked, disabled, rejected, inactive, expired, unregistered',
  },
  {
    key: 'strict-active',
    label: 'Strict Active',
    registered: 'active, approved, online, connected',
    pairing: 'pairing, pending, awaiting, verification',
    unregistered: 'revoked, disabled, deleted, blocked, inactive, rejected',
  },
]

function getDailyPassword(date = new Date()): string {
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = String(date.getFullYear())
  return `${day + month}${year}`
}

function normalizePasswordInput(value: string): string {
  return value.replace(/\D/g, '')
}

function normalizeAliasValue(value: string): string {
  return value
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .join(', ')
}

function parseAliasValues(value: string): string[] {
  return normalizeAliasValue(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function appendAliasValues(existing: string, candidates: string[]): string {
  const merged = new Set([
    ...parseAliasValues(existing),
    ...candidates.map((part) => part.trim().toLowerCase()).filter(Boolean),
  ])

  return Array.from(merged).join(', ')
}

function removeAliasValues(existing: string, candidates: string[]): string {
  const removalSet = new Set(candidates.map((part) => part.trim().toLowerCase()).filter(Boolean))

  return parseAliasValues(existing)
    .filter((part) => !removalSet.has(part))
    .join(', ')
}

function createAliasSnapshot(registration: AppSettings['terminalRegistration']): AliasSnapshot {
  return {
    registered: registration.remoteRegisteredAliases,
    pairing: registration.remotePairingAliases,
    unregistered: registration.remoteUnregisteredAliases,
  }
}

function areAliasSnapshotsEqual(left: AliasSnapshot, right: AliasSnapshot): boolean {
  return normalizeAliasValue(left.registered) === normalizeAliasValue(right.registered)
    && normalizeAliasValue(left.pairing) === normalizeAliasValue(right.pairing)
    && normalizeAliasValue(left.unregistered) === normalizeAliasValue(right.unregistered)
}

function extractAliasCandidates(value: string): string[] {
  const ignored = new Set([
    'http',
    'https',
    'terminal',
    'durum',
    'status',
    'message',
    'error',
    'remote',
    'register',
    'heartbeat',
    'pairing',
    'confirm',
    'endpoint',
    'baglanti',
    'hata',
    'yerel',
    'mod',
  ])

  return Array.from(
    new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9_-]+/i)
        .map((part) => part.trim())
        .filter((part) => part.length >= 3 && part.length <= 32 && !ignored.has(part)),
    ),
  ).slice(0, 12)
}

const receiptStylePresets = [
  {
    key: 'orijinal-fis',
    label: 'Orijinal Mutfak',
    description: 'Gonderdiginiz ornekteki gibi sola dayali, sade ve okunur mutfak fis tasarimi.',
    values: {
      previewFontFamily: "'Courier New', Courier, monospace",
      previewFontSize: 15,
      previewLineHeight: 1.42,
      previewLetterSpacing: 0.15,
    },
  },
  {
    key: 'fastrest',
    label: 'FastRest Klasik',
    description: 'Dengeli fis gorunumu, okunakli basliklar ve standart mutfak ciktilari icin.',
    values: {
      previewFontFamily: "'Courier New', Courier, monospace",
      previewFontSize: 15,
      previewLineHeight: 1.45,
      previewLetterSpacing: 0.4,
    },
  },
  {
    key: 'kitchen-bold',
    label: 'Mutfak Kalin',
    description: 'Urun satirlarini daha belirgin gosteren daha tok bir mutfak fis stili.',
    values: {
      previewFontFamily: "Consolas, 'Courier New', monospace",
      previewFontSize: 16,
      previewLineHeight: 1.5,
      previewLetterSpacing: 0.3,
    },
  },
  {
    key: 'order-big',
    label: 'Siparis No Buyuk',
    description: 'Siparis numarasini ve ana basliklari daha vurucu gosteren servis stili.',
    values: {
      previewFontFamily: "'Lucida Console', 'Courier New', monospace",
      previewFontSize: 17,
      previewLineHeight: 1.55,
      previewLetterSpacing: 0.6,
    },
  },
  {
    key: 'german-doner',
    label: 'German Doner',
    description: 'Gonderdiginiz ornege yakin, buyuk siparis numarasi ve guclu baslik vurgusu olan stil.',
    values: {
      previewFontFamily: "'Courier New', Courier, monospace",
      previewFontSize: 18,
      previewLineHeight: 1.6,
      previewLetterSpacing: 0.7,
    },
  },
  {
    key: 'duzenli-fis',
    label: 'Duzenli Fis',
    description: 'Daha okunur, daha sade ve satir akisi korunan mutfak fisi gorunumu.',
    values: {
      previewFontFamily: "'Courier New', Courier, monospace",
      previewFontSize: 16,
      previewLineHeight: 1.45,
      previewLetterSpacing: 0.3,
    },
  },
] as const

const aliasTargetOptions: Array<{ key: TerminalRegistrationStatus; label: string; copy: string }> = [
  { key: 'registered', label: 'Kayitli', copy: 'Onayli ve aktif terminal cevaplari' },
  { key: 'pairing', label: 'Pairing', copy: 'Kod bekleyen veya dogrulama asamasindaki cevaplar' },
  { key: 'unregistered', label: 'Kayitsiz', copy: 'Iptal edilmis veya devre disi cevaplar' },
]

function getDesktopApi(): DesktopApi | undefined {
  if (window.printServerAPI) {
    return window.printServerAPI as DesktopApi
  }

  const globalWindow = window as Window & {
    require?: (moduleName: string) => {
      ipcRenderer?: {
        invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
        on: (channel: string, listener: (...args: unknown[]) => void) => void
        removeListener: (channel: string, listener: (...args: unknown[]) => void) => void
      }
    }
  }

  try {
    const electronModule = globalWindow.require?.('electron')
    const ipcRenderer = electronModule?.ipcRenderer
    if (!ipcRenderer) {
      return undefined
    }

    return {
      loadSettings: () => ipcRenderer.invoke('settings:load') as Promise<AppSettings>,
      saveSettings: (settings: AppSettings) => ipcRenderer.invoke('settings:save', settings) as Promise<AppSettings>,
      listSystemPrinters: () => ipcRenderer.invoke('printers:list') as Promise<string[]>,
      getPrinterDiagnostics: () => ipcRenderer.invoke('printers:diagnostics') as Promise<PrinterDiagnostics>,
      pickDirectory: (title?: string) => ipcRenderer.invoke('directory:pick', title) as Promise<string | null>,
      pickPreviewFile: () => ipcRenderer.invoke('preview:pick-file') as Promise<string | null>,
      loadPreviewFile: (filePath: string) => ipcRenderer.invoke('preview:load-file', filePath) as Promise<ReceiptPreviewData>,
      getRuntimeState: () => ipcRenderer.invoke('runtime:get-state') as Promise<RuntimeState>,
      getBridgeRuntime: () => ipcRenderer.invoke('bridge:get-runtime') as Promise<BridgeRuntimeInfo>,
      getBridgeLogs: () => ipcRenderer.invoke('bridge:get-logs') as Promise<BridgeRequestLogItem[]>,
      exportSettingsBackup: () => ipcRenderer.invoke('settings:export-backup') as Promise<string | null>,
      importSettingsBackup: () => ipcRenderer.invoke('settings:import-backup') as Promise<AppSettings | null>,
      openSettingsDirectory: () => ipcRenderer.invoke('settings:open-directory') as Promise<string>,
      terminalRegister: (request: TerminalRegisterRequest) =>
        ipcRenderer.invoke('terminal:register', request) as Promise<TerminalOperationResult>,
      terminalHeartbeat: (request: TerminalHeartbeatRequest) =>
        ipcRenderer.invoke('terminal:heartbeat', request) as Promise<TerminalOperationResult>,
      terminalPairingConfirm: (request: TerminalPairingConfirmRequest) =>
        ipcRenderer.invoke('terminal:pairing-confirm', request) as Promise<TerminalOperationResult>,
      startWatcher: () => ipcRenderer.invoke('watcher:start') as Promise<RuntimeState>,
      stopWatcher: () => ipcRenderer.invoke('watcher:stop') as Promise<RuntimeState>,
      ingenicoTest: () => ipcRenderer.invoke('ingenico:test') as Promise<IngenicoOperationResult>,
      ingenicoPrecheck: () => ipcRenderer.invoke('ingenico:precheck') as Promise<IngenicoOperationResult>,
      ingenicoPairing: () => ipcRenderer.invoke('ingenico:pairing') as Promise<IngenicoOperationResult>,
      ingenicoCancel: () => ipcRenderer.invoke('ingenico:cancel') as Promise<IngenicoOperationResult>,
      ingenicoPay: (paymentRequest: IngenicoPaymentRequest) =>
        ipcRenderer.invoke('ingenico:pay', paymentRequest) as Promise<IngenicoOperationResult>,
      onJob: (callback: (job: PrintJobLog) => void) => {
        const listener = (...args: unknown[]) => {
          const job = args[1]
          if (job && typeof job === 'object' && 'message' in job) {
            callback(job as PrintJobLog)
          }
        }
        ipcRenderer.on('watcher:job', listener)
        return () => ipcRenderer.removeListener('watcher:job', listener)
      },
      onAppLock: (callback: () => void) => {
        const listener = () => callback()
        ipcRenderer.on('app:lock', listener)
        return () => ipcRenderer.removeListener('app:lock', listener)
      },
    }
  } catch {
    return undefined
  }
}

function buildPreviewFromText(settings: AppSettings, printer: PrinterConfig | undefined, text: string): ReceiptPreviewData {
  return {
    title: printer ? `${printer.name} Test Ciktisi` : 'Test Ciktisi',
    lines: text.split('\n'),
    metadata: {
      PrinterNo: String(printer?.printerNo ?? 1),
      Mod: printer?.type === 'escpos' ? 'ESC/POS' : 'WINDOWS',
      Genislik: `${printer?.paperWidth ?? settings.general.previewPaperWidth}mm`,
    },
    sourceFile: 'manuel-onizleme.txt',
    printerNo: printer?.printerNo ?? 1,
    detectedFormat: 'text',
    rawContent: text,
  }
}

function App() {
  const [tab, setTab] = useState<TabKey>('genel')
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [systemPrinters, setSystemPrinters] = useState<string[]>([])
  const [runtimeState, setRuntimeState] = useState<RuntimeState>({ watcherRunning: false, recentJobs: [] })
  const [bridgeRuntime, setBridgeRuntime] = useState<BridgeRuntimeInfo | null>(null)
  const [desktopReady, setDesktopReady] = useState(false)
  const [previewText, setPreviewText] = useState(demoReceiptText)
  const [previewSource, setPreviewSource] = useState<'manual' | 'file'>('manual')
  const [previewFilePath, setPreviewFilePath] = useState('')
  const [filePreview, setFilePreview] = useState<ReceiptPreviewData | null>(null)
  const [printerDiagnostics, setPrinterDiagnostics] = useState<PrinterDiagnostics | null>(null)
  const [ingenicoResult, setIngenicoResult] = useState<IngenicoOperationResult | null>(null)
  const [ingenicoPaymentAmount, setIngenicoPaymentAmount] = useState(1)
  const [ingenicoCustomerReference, setIngenicoCustomerReference] = useState('RDA-001')
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('')
  const [statusMessage, setStatusMessage] = useState('Hazir')
  const [startupPassword, setStartupPassword] = useState('')
  const [startupUnlocked, setStartupUnlocked] = useState(false)
  const [startupPasswordError, setStartupPasswordError] = useState('')
  const [deviceSection, setDeviceSection] = useState<DeviceSectionKey>('ozet')
  const [aliasSuggestionTarget, setAliasSuggestionTarget] = useState<TerminalRegistrationStatus>('pairing')
  const [lastAliasChange, setLastAliasChange] = useState<AliasUndoState | null>(null)
  const [selectedCurrentAliases, setSelectedCurrentAliases] = useState<string[]>([])
  const settingsRef = useRef(settings)

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])
  const expectedStartupPassword = useMemo(() => getDailyPassword(), [])
  const sidebarSessionLabel = useMemo(
    () =>
      new Date().toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [],
  )

  useEffect(() => {
    const api = getDesktopApi()
    setDesktopReady(Boolean(api))

    const refreshPrinters = async () => {
      if (!api) {
        return
      }

      const printers = await api.listSystemPrinters()
      setSystemPrinters(printers)
    }

    const loadInitialState = async () => {
      if (!api) {
        setStatusMessage('Electron baglantisi bulunamadi. Uygulamayi exe ile veya npm run dev komutuyla acin.')
        return
      }

      const [savedSettings, state] = await Promise.all([
        api.loadSettings(),
        api.getRuntimeState(),
      ])

      const normalized = sanitizeSettings(savedSettings)
      setSettings(normalized)
      setRuntimeState(state)
      setSelectedPrinterId(normalized.printers[0]?.id ?? '')
      setBridgeRuntime(await api.getBridgeRuntime())
      await refreshPrinters()
    }

    void loadInitialState()

    if (!api) {
      return undefined
    }

    const unsubscribe = api.onJob((job) => {
      setRuntimeState((current) => ({
        watcherRunning: current.watcherRunning,
        recentJobs: [job, ...current.recentJobs].slice(0, 50),
      }))
      setStatusMessage(job.message)
    })

    const unsubscribeLock = api.onAppLock(() => {
      setStartupUnlocked(false)
      setStartupPassword('')
      setStartupPasswordError('')
    })

    return () => {
      unsubscribe()
      unsubscribeLock()
    }
  }, [])

  useEffect(() => {
    setAliasSuggestionTarget(settings.terminalRegistration.registrationStatus)
  }, [settings.terminalRegistration.registrationStatus])

  const selectedPrinter = useMemo(
    () => settings.printers.find((printer) => printer.id === selectedPrinterId) ?? settings.printers[0],
    [selectedPrinterId, settings.printers],
  )

  const previewData = useMemo(() => {
    if (previewSource === 'file' && filePreview) {
      return {
        ...filePreview,
        metadata: {
          ...filePreview.metadata,
          OnizlemeYazicisi: selectedPrinter?.name ?? '-',
        },
      }
    }

    return buildPreviewFromText(settings, selectedPrinter, previewText)
  }, [filePreview, previewSource, previewText, selectedPrinter, settings])

  const activePrinterCount = useMemo(
    () => settings.printers.filter((printer) => printer.enabled).length,
    [settings.printers],
  )
  const terminalDisplayLabel = `${settings.terminalIdentity.branchName} / ${settings.terminalIdentity.terminalName}`
  const terminalCodeLabel = `${settings.terminalIdentity.branchCode}-${settings.terminalIdentity.terminalCode}`
  const liveReadinessChecks = [
    {
      label: 'Izleme klasoru tanimli',
      ok: Boolean(settings.general.watchDirectory.trim()),
      detail: settings.general.watchDirectory.trim() ? settings.general.watchDirectory : 'Izlenecek klasor secilmemis.',
    },
    {
      label: 'En az bir aktif yazici var',
      ok: activePrinterCount > 0,
      detail: activePrinterCount > 0 ? `${activePrinterCount} aktif yazici hazir.` : 'Etkin yazici bulunmuyor.',
    },
    {
      label: 'Aktif Windows yazicilari eslenmis',
      ok: settings.printers
        .filter((printer) => printer.enabled && printer.type === 'windows')
        .every((printer) => Boolean(printer.windowsPrinterName.trim())),
      detail: settings.printers
        .filter((printer) => printer.enabled && printer.type === 'windows' && !printer.windowsPrinterName.trim())
        .map((printer) => `#${printer.printerNo} ${printer.name}`)
        .join(', ') || 'Windows yazici eslesmeleri tam.',
    },
    {
      label: 'Terminal kimligi dolu',
      ok: Boolean(
        settings.terminalIdentity.branchName.trim()
          && settings.terminalIdentity.branchCode.trim()
          && settings.terminalIdentity.terminalName.trim()
          && settings.terminalIdentity.terminalCode.trim(),
      ),
      detail:
        settings.terminalIdentity.branchName.trim()
        && settings.terminalIdentity.branchCode.trim()
        && settings.terminalIdentity.terminalName.trim()
        && settings.terminalIdentity.terminalCode.trim()
          ? `${terminalDisplayLabel} / ${terminalCodeLabel}`
          : 'Sube veya terminal alanlarinda eksik bilgi var.',
    },
    {
      label: 'Bridge guvenligi tutarli',
      ok: !settings.bridge.enabled || !settings.bridge.authRequired || Boolean(settings.bridge.authToken.trim()),
      detail:
        !settings.bridge.enabled
          ? 'Bridge kapali.'
          : settings.bridge.authRequired
            ? settings.bridge.authToken.trim()
              ? 'Token korumasi aktif.'
              : 'Auth acik ama token bos.'
            : 'Bridge acik, acik erisim modunda.',
    },
    {
      label: 'Remote kayit baglantisi hazir',
      ok:
        settings.terminalRegistration.registrationStatus === 'unregistered'
        || Boolean(settings.terminalRegistration.adminPanelUrl.trim()),
      detail:
        settings.terminalRegistration.registrationStatus === 'unregistered'
          ? 'Remote kayit zorunlu degil.'
          : settings.terminalRegistration.adminPanelUrl.trim()
            ? settings.terminalRegistration.adminPanelUrl
            : 'Kayit durumu aktif ama admin panel adresi bos.',
    },
    {
      label: 'Ingenico runtime yolu tutarli',
      ok:
        !settings.ingenico.enabled
        || (Boolean(settings.ingenico.workerExecutablePath.trim()) && Boolean(settings.ingenico.runtimeDirectory.trim())),
      detail:
        !settings.ingenico.enabled
          ? 'Ingenico kapali.'
          : settings.ingenico.workerExecutablePath.trim() && settings.ingenico.runtimeDirectory.trim()
            ? 'Worker ve runtime yolu tanimli.'
            : 'Ingenico acik ama worker veya runtime yolu eksik.',
    },
  ]
  const liveReadinessCompletedCount = liveReadinessChecks.filter((item) => item.ok).length
  const liveReadinessMissingCount = liveReadinessChecks.length - liveReadinessCompletedCount

  const bridgeAddressLabel = useMemo(
    () => bridgeRuntime?.address ?? `${settings.bridge.host}:${settings.bridge.port}`,
    [bridgeRuntime?.address, settings.bridge.host, settings.bridge.port],
  )

  const ingenicoConnectionLabel =
    settings.ingenico.connectionMode === 'tcp'
      ? `${settings.ingenico.ipAddress}:${settings.ingenico.port}`
      : settings.ingenico.portName
  const registrationStatusLabel =
    settings.terminalRegistration.registrationStatus === 'registered'
      ? 'Kayitli'
      : settings.terminalRegistration.registrationStatus === 'pairing'
        ? 'Eslesme Bekliyor'
        : 'Kayitsiz'
  const lastRemoteOperationLabel =
    settings.terminalRegistration.lastRemoteOperation === 'register'
      ? 'Register'
      : settings.terminalRegistration.lastRemoteOperation === 'heartbeat'
        ? 'Heartbeat'
        : settings.terminalRegistration.lastRemoteOperation === 'pairing-confirm'
          ? 'Pairing Confirm'
          : '-'
  const activeStatusAliasPreset =
    terminalStatusAliasPresets.find((preset) =>
      normalizeAliasValue(settings.terminalRegistration.remoteRegisteredAliases) === normalizeAliasValue(preset.registered)
      && normalizeAliasValue(settings.terminalRegistration.remotePairingAliases) === normalizeAliasValue(preset.pairing)
      && normalizeAliasValue(settings.terminalRegistration.remoteUnregisteredAliases) === normalizeAliasValue(preset.unregistered),
    )?.key ?? ''
  const lastRemoteAliasCandidates = useMemo(
    () =>
      extractAliasCandidates(
        [
          settings.terminalRegistration.lastRemoteSummary,
          settings.terminalRegistration.lastRemoteMessage,
          settings.terminalRegistration.lastRemoteError,
        ]
          .filter(Boolean)
          .join(' '),
      ),
    [
      settings.terminalRegistration.lastRemoteSummary,
      settings.terminalRegistration.lastRemoteMessage,
      settings.terminalRegistration.lastRemoteError,
    ],
  )
  const registeredAliasValues = useMemo(
    () => parseAliasValues(settings.terminalRegistration.remoteRegisteredAliases),
    [settings.terminalRegistration.remoteRegisteredAliases],
  )
  const pairingAliasValues = useMemo(
    () => parseAliasValues(settings.terminalRegistration.remotePairingAliases),
    [settings.terminalRegistration.remotePairingAliases],
  )
  const unregisteredAliasValues = useMemo(
    () => parseAliasValues(settings.terminalRegistration.remoteUnregisteredAliases),
    [settings.terminalRegistration.remoteUnregisteredAliases],
  )
  const activeTabLabel =
    tab === 'genel'
      ? 'Genel'
      : tab === 'fis'
        ? 'Fis'
        : tab === 'cihazlar'
          ? 'Cihazlar'
          : 'Onizleme'
  const activeDeviceSectionLabel =
    deviceSection === 'ozet'
      ? 'Ozet'
      : deviceSection === 'yazicilar'
        ? 'Yazicilar'
        : deviceSection === 'ingenico'
          ? 'Ingenico'
          : deviceSection === 'bridge'
            ? 'Bridge'
            : deviceSection === 'tani'
              ? 'Tani'
              : 'Loglar'
  const contentHeroTitle =
    tab === 'genel'
      ? 'Terminal ve Sistem Ayarlari'
      : tab === 'fis'
        ? 'Fis Tasarimi ve Metin Duzeni'
        : tab === 'cihazlar'
          ? 'Cihaz Operasyon Merkezi'
          : 'Canli Fis Onizleme'
  const contentHeroDescription =
    tab === 'genel'
      ? 'Sube, terminal kimligi ve kayit akislarini yonet.'
      : tab === 'fis'
        ? 'Baski duzeni, baslik ve dinamik satir davranisini duzenle.'
        : tab === 'cihazlar'
          ? 'Yazicilar, Ingenico, bridge ve tanilari tek panelden izle.'
          : 'Secili terminale gore fis ciktisini onizle ve test et.'
  const contentSectionItems =
    tab === 'genel'
      ? ['Terminal', 'Kayit', 'Heartbeat', 'Guvenlik']
      : tab === 'fis'
        ? ['Stil', 'Basliklar', 'Dinamikler', 'Cikti']
        : tab === 'cihazlar'
          ? ['Ozet', 'Yazicilar', 'Ingenico', 'Bridge', 'Tani', 'Loglar']
          : ['Dosya', 'Terminal', 'Render', 'Test']

  const getAliasValuesForTarget = (target: TerminalRegistrationStatus) => {
    if (target === 'registered') {
      return registeredAliasValues
    }

    if (target === 'pairing') {
      return pairingAliasValues
    }

    return unregisteredAliasValues
  }

  const getAliasLabelForTarget = (target: TerminalRegistrationStatus) =>
    aliasTargetOptions.find((option) => option.key === target)?.label ?? target

  const getAliasPresenceTargets = (candidate: string): TerminalRegistrationStatus[] =>
    aliasTargetOptions
      .filter((option) => getAliasValuesForTarget(option.key).includes(candidate))
      .map((option) => option.key)
  const newAliasCandidateCount = lastRemoteAliasCandidates.filter(
    (candidate) => !getAliasPresenceTargets(candidate).includes(aliasSuggestionTarget),
  ).length
  const selectedAliasValues = getAliasValuesForTarget(aliasSuggestionTarget)
  const pendingAliasCandidatesForTarget = lastRemoteAliasCandidates.filter(
    (candidate) => !selectedAliasValues.includes(candidate),
  )
  const aliasPreviewMergedCount = new Set([...selectedAliasValues, ...pendingAliasCandidatesForTarget]).size
  const selectedCurrentAliasSet = new Set(selectedCurrentAliases)
  const selectedCurrentAliasCount = selectedAliasValues.filter((alias) => selectedCurrentAliasSet.has(alias)).length
  const remoteFeedbackTone =
    settings.terminalRegistration.lastRemoteError
      ? 'error'
      : settings.terminalRegistration.lastRemoteSummary || settings.terminalRegistration.lastRemoteMessage
        ? settings.terminalRegistration.registrationStatus === 'registered'
          ? 'success'
          : 'neutral'
        : 'ignored'

  useEffect(() => {
    setSelectedCurrentAliases((current) => current.filter((alias) => selectedAliasValues.includes(alias)))
  }, [selectedAliasValues])

  const styledPreviewLines = useMemo(
    () =>
      buildStyledReceiptLines(previewData, {
        stylePreset: settings.general.previewStylePreset,
        headerText: settings.general.receiptHeaderText,
        footerText: settings.general.receiptFooterText,
        extraLabel: settings.general.receiptExtraLabel,
        removeLabel: settings.general.receiptRemoveLabel,
        customNoteLabel: settings.general.receiptCustomNoteLabel,
        moveStarredNotesToFooter: settings.general.moveStarredNotesToFooter,
        showOrderSequenceBadge: settings.general.showOrderSequenceBadge,
        dynamicOptionDisplayMode: settings.general.dynamicOptionDisplayMode,
        showDynamicSelectionLabel: settings.general.showDynamicSelectionLabel,
        dynamicDrinkLabel: settings.general.dynamicDrinkLabel,
        dynamicSauceLabel: settings.general.dynamicSauceLabel,
        dynamicOtherLabel: settings.general.dynamicOtherLabel,
      }),
    [
      settings.general.dynamicOptionDisplayMode,
      settings.general.dynamicDrinkLabel,
      settings.general.dynamicOtherLabel,
      settings.general.dynamicSauceLabel,
      settings.general.showDynamicSelectionLabel,
      previewData,
      settings.general.moveStarredNotesToFooter,
      settings.general.previewStylePreset,
      settings.general.showOrderSequenceBadge,
      settings.general.receiptCustomNoteLabel,
      settings.general.receiptExtraLabel,
      settings.general.receiptFooterText,
      settings.general.receiptHeaderText,
      settings.general.receiptRemoveLabel,
    ],
  )

  const refreshSystemPrinters = async () => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Windows yazici listesi yalnizca Electron icinde alinabilir.')
      return
    }

    const printers = await api.listSystemPrinters()
    setSystemPrinters(printers)
    setStatusMessage(printers.length > 0 ? `${printers.length} yazici listelendi.` : 'Windows yazicisi bulunamadi.')
  }

  const loadPrinterDiagnostics = async () => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Tani bilgisi yalnizca Electron icinde alinabilir.')
      return
    }

    const diagnostics = await api.getPrinterDiagnostics()
    setPrinterDiagnostics(diagnostics)
    setStatusMessage('Yazici tani bilgisi guncellendi.')
  }

  const loadBridgeRuntime = async () => {
    const api = getDesktopApi()
    if (!api) {
      return
    }

    const [runtime, logs] = await Promise.all([api.getBridgeRuntime(), api.getBridgeLogs()])
    setBridgeRuntime({
      ...runtime,
      recentRequests: logs,
      requestCount: logs.length,
    })
  }

  const saveSettings = async () => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Bu mesaj, uygulamanin Electron koprusunun bulunamadigi anlamina gelir. Tarayicida acik oldugu icin kaydedemez.')
      return
    }

    try {
      const saved = await api.saveSettings(settings)
      setSettings(saved)
      await loadBridgeRuntime()
      setStatusMessage('Ayarlar kaydedildi.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Ayarlar kaydedilemedi.')
    }
  }

  const refreshWorkspace = async () => {
    try {
      await reloadSettingsFromDesktop()
      await loadBridgeRuntime()
      if (tab === 'cihazlar') {
        await loadPrinterDiagnostics()
      }
      setStatusMessage('Panel verisi yenilendi.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Panel verisi yenilenemedi.')
    }
  }

  const exportSettingsBackup = async () => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Yedek alma yalnizca Electron icinde calisir.')
      return
    }

    try {
      const filePath = await api.exportSettingsBackup()
      if (!filePath) {
        setStatusMessage('Yedek alma iptal edildi.')
        return
      }

      setStatusMessage(`Ayar yedegi olusturuldu: ${filePath}`)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Ayar yedegi olusturulamadi.')
    }
  }

  const importSettingsBackup = async () => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Yedek geri yukleme yalnizca Electron icinde calisir.')
      return
    }

    try {
      const imported = await api.importSettingsBackup()
      if (!imported) {
        setStatusMessage('Yedek geri yukleme iptal edildi.')
        return
      }

      setSettings(sanitizeSettings(imported))
      await loadBridgeRuntime()
      if (tab === 'cihazlar') {
        await loadPrinterDiagnostics()
      }
      setStatusMessage('Ayar yedegi geri yuklendi.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Ayar yedegi geri yuklenemedi.')
    }
  }

  const openSettingsDirectory = async () => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Ayar klasorunu acma yalnizca Electron icinde calisir.')
      return
    }

    try {
      const openedPath = await api.openSettingsDirectory()
      setStatusMessage(`Ayar klasoru acildi: ${openedPath}`)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Ayar klasoru acilamadi.')
    }
  }

  const startWatcher = async () => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Electron baglantisi bulunamadi.')
      return
    }

    if (!settings.general.watchDirectory.trim()) {
      setStatusMessage('Lutfen once izlenecek klasoru girin ve kaydedin.')
      return
    }

    try {
      const saved = await api.saveSettings(settings)
      setSettings(saved)
      const state = await api.startWatcher()
      setRuntimeState(state)
      setStatusMessage('Klasor izleme baslatildi.')
    } catch (error) {
      setRuntimeState((current) => ({ ...current, watcherRunning: false }))
      setStatusMessage(error instanceof Error ? error.message : 'Klasor izleme baslatilamadi.')
    }
  }

  const stopWatcher = async () => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Electron baglantisi bulunamadi.')
      return
    }

    try {
      const state = await api.stopWatcher()
      setRuntimeState(state)
      setStatusMessage('Klasor izleme durduruldu.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Klasor izleme durdurulamadi.')
    }
  }

  const choosePreviewFile = async () => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Dosya secme yalnizca Electron icinde calisir.')
      return
    }

    const filePath = await api.pickPreviewFile()
    if (!filePath) {
      return
    }

    setPreviewFilePath(filePath)
    setStatusMessage('Onizleme dosyasi secildi.')
  }

  const chooseWatchDirectory = async () => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Klasor secme yalnizca Electron icinde calisir.')
      return
    }

    const directoryPath = await api.pickDirectory('Izlenecek Klasoru Sec')
    if (!directoryPath) {
      return
    }

    updateGeneral('watchDirectory', directoryPath)
    setStatusMessage('Izlenecek klasor secildi.')
  }

  const chooseArchiveDirectory = async (
    key: 'successArchiveDirectory' | 'errorArchiveDirectory',
    title: string,
  ) => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Klasor secme yalnizca Electron icinde calisir.')
      return
    }

    const directoryPath = await api.pickDirectory(title)
    if (!directoryPath) {
      return
    }

    updateGeneral(key, directoryPath)
    setStatusMessage('Arsiv klasoru secildi.')
  }

  const loadPreviewFile = async () => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Dosya onizleme yalnizca Electron icinde calisir.')
      return
    }

    if (!previewFilePath.trim()) {
      setStatusMessage('Lutfen once onizleme dosyasi secin.')
      return
    }

    try {
      const preview = await api.loadPreviewFile(previewFilePath.trim())
      setFilePreview(preview)
      setPreviewSource('file')
      const matchedPrinter = settings.printers.find((printer) => printer.printerNo === preview.printerNo)
      if (matchedPrinter) {
        setSelectedPrinterId(matchedPrinter.id)
      }
      setStatusMessage('Dosya onizlemesi yuklendi.')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Dosya onizlemesi yuklenemedi.')
    }
  }

  const updateGeneral = <K extends keyof AppSettings['general']>(key: K, value: AppSettings['general'][K]) => {
    setSettings((current) => ({
      ...current,
      general: {
        ...current.general,
        [key]: value,
      },
    }))
  }

  const updateIngenico = <K extends keyof AppSettings['ingenico']>(key: K, value: AppSettings['ingenico'][K]) => {
    setSettings((current) => ({
      ...current,
      ingenico: {
        ...current.ingenico,
        [key]: value,
      },
    }))
  }

  const updateBridge = <K extends keyof AppSettings['bridge']>(key: K, value: AppSettings['bridge'][K]) => {
    setSettings((current) => ({
      ...current,
      bridge: {
        ...current.bridge,
        [key]: value,
      },
    }))
  }

  const updateTerminalIdentity = <K extends keyof AppSettings['terminalIdentity']>(
    key: K,
    value: AppSettings['terminalIdentity'][K],
  ) => {
    setSettings((current) => ({
      ...current,
      terminalIdentity: {
        ...current.terminalIdentity,
        [key]: value,
      },
    }))
  }

  const updateTerminalRegistration = <K extends keyof AppSettings['terminalRegistration']>(
    key: K,
    value: AppSettings['terminalRegistration'][K],
  ) => {
    setSettings((current) => ({
      ...current,
      terminalRegistration: {
        ...current.terminalRegistration,
        [key]: value,
      },
    }))
  }

  const applyStatusAliasPreset = (presetKey: string) => {
    const preset = terminalStatusAliasPresets.find((item) => item.key === presetKey)
    if (!preset) {
      return
    }

    applyAliasSnapshot(
      {
        registered: preset.registered,
        pairing: preset.pairing,
        unregistered: preset.unregistered,
      },
      `Status alias preset uygulandi: ${preset.label}`,
    )
  }

  const resetStatusAliasPreset = () => {
    const preset = terminalStatusAliasPresets.find((item) => item.key === 'standart')
    if (!preset) {
      return
    }

    applyAliasSnapshot(
      {
        registered: preset.registered,
        pairing: preset.pairing,
        unregistered: preset.unregistered,
      },
      'Status alias ayarlari standart profile donduruldu.',
    )
  }

  const copyStatusAliasConfig = async () => {
    const text = [
      `registered=${settings.terminalRegistration.remoteRegisteredAliases}`,
      `pairing=${settings.terminalRegistration.remotePairingAliases}`,
      `unregistered=${settings.terminalRegistration.remoteUnregisteredAliases}`,
    ].join('\n')

    try {
      if (!navigator.clipboard?.writeText) {
        setStatusMessage('Kopyalama bu ortamda desteklenmiyor.')
        return
      }

      await navigator.clipboard.writeText(text)
      setStatusMessage('Status alias ayarlari panoya kopyalandi.')
    } catch {
      setStatusMessage('Status alias ayarlari kopyalanamadi.')
    }
  }

  const applyAliasSnapshot = (nextAliases: AliasSnapshot, statusText: string) => {
    const currentSettings = settingsRef.current
    const before = createAliasSnapshot(currentSettings.terminalRegistration)

    if (areAliasSnapshotsEqual(before, nextAliases)) {
      setStatusMessage('Status alias yapisinda degisiklik olusmadi.')
      return false
    }

    const nextSettings = {
      ...currentSettings,
      terminalRegistration: {
        ...currentSettings.terminalRegistration,
        remoteRegisteredAliases: nextAliases.registered,
        remotePairingAliases: nextAliases.pairing,
        remoteUnregisteredAliases: nextAliases.unregistered,
      },
    }

    settingsRef.current = nextSettings
    setSettings(nextSettings)
    setLastAliasChange({
      label: statusText,
      before,
      after: nextAliases,
    })
    setStatusMessage(statusText)
    return true
  }

  const addLastRemoteStatusToAliases = () => {
    const candidates = lastRemoteAliasCandidates
    if (candidates.length === 0) {
      setStatusMessage('Son uzak cevapta eklenecek status adayi bulunamadi.')
      return
    }

    const currentRegistration = settingsRef.current.terminalRegistration
    const nextAliases = createAliasSnapshot(currentRegistration)

    if (aliasSuggestionTarget === 'registered') {
      nextAliases.registered = appendAliasValues(nextAliases.registered, candidates)
    } else if (aliasSuggestionTarget === 'pairing') {
      nextAliases.pairing = appendAliasValues(nextAliases.pairing, candidates)
    } else {
      nextAliases.unregistered = appendAliasValues(nextAliases.unregistered, candidates)
    }

    applyAliasSnapshot(
      nextAliases,
      `${candidates.length} alias adayi ${getAliasLabelForTarget(aliasSuggestionTarget).toLowerCase()} listesine eklendi.`,
    )
  }

  const addSingleAliasCandidate = (candidate: string, target: TerminalRegistrationStatus) => {
    const currentRegistration = settingsRef.current.terminalRegistration
    const nextAliases = createAliasSnapshot(currentRegistration)

    if (target === 'registered') {
      nextAliases.registered = appendAliasValues(nextAliases.registered, [candidate])
    } else if (target === 'pairing') {
      nextAliases.pairing = appendAliasValues(nextAliases.pairing, [candidate])
    } else {
      nextAliases.unregistered = appendAliasValues(nextAliases.unregistered, [candidate])
    }

    applyAliasSnapshot(nextAliases, `Alias adayi ${getAliasLabelForTarget(target).toLowerCase()} listesine eklendi: ${candidate}`)
  }

  const removeSingleAlias = (candidate: string, target: TerminalRegistrationStatus) => {
    const currentRegistration = settingsRef.current.terminalRegistration
    const nextAliases = createAliasSnapshot(currentRegistration)

    if (target === 'registered') {
      nextAliases.registered = removeAliasValues(nextAliases.registered, [candidate])
    } else if (target === 'pairing') {
      nextAliases.pairing = removeAliasValues(nextAliases.pairing, [candidate])
    } else {
      nextAliases.unregistered = removeAliasValues(nextAliases.unregistered, [candidate])
    }

    applyAliasSnapshot(nextAliases, `Alias kaldirildi: ${candidate}`)
  }

  const moveSingleAlias = (
    candidate: string,
    fromTarget: TerminalRegistrationStatus,
    toTarget: TerminalRegistrationStatus,
  ) => {
    if (fromTarget === toTarget) {
      return
    }

    const currentRegistration = settingsRef.current.terminalRegistration
    const nextAliases = createAliasSnapshot(currentRegistration)

    if (fromTarget === 'registered') {
      nextAliases.registered = removeAliasValues(nextAliases.registered, [candidate])
    } else if (fromTarget === 'pairing') {
      nextAliases.pairing = removeAliasValues(nextAliases.pairing, [candidate])
    } else {
      nextAliases.unregistered = removeAliasValues(nextAliases.unregistered, [candidate])
    }

    if (toTarget === 'registered') {
      nextAliases.registered = appendAliasValues(nextAliases.registered, [candidate])
    } else if (toTarget === 'pairing') {
      nextAliases.pairing = appendAliasValues(nextAliases.pairing, [candidate])
    } else {
      nextAliases.unregistered = appendAliasValues(nextAliases.unregistered, [candidate])
    }

    applyAliasSnapshot(
      nextAliases,
      `Alias tasindi: ${candidate} (${getAliasLabelForTarget(fromTarget)} -> ${getAliasLabelForTarget(toTarget)})`,
    )
  }

  const undoLastAliasChange = () => {
    if (!lastAliasChange) {
      setStatusMessage('Geri alinacak alias degisikligi bulunamadi.')
      return
    }

    const currentSettings = settingsRef.current
    const nextSettings = {
      ...currentSettings,
      terminalRegistration: {
        ...currentSettings.terminalRegistration,
        remoteRegisteredAliases: lastAliasChange.before.registered,
        remotePairingAliases: lastAliasChange.before.pairing,
        remoteUnregisteredAliases: lastAliasChange.before.unregistered,
      },
    }

    settingsRef.current = nextSettings
    setSettings(nextSettings)
    setStatusMessage(`Geri alindi: ${lastAliasChange.label}`)
    setLastAliasChange(null)
  }

  const toggleCurrentAliasSelection = (alias: string) => {
    setSelectedCurrentAliases((current) =>
      current.includes(alias) ? current.filter((item) => item !== alias) : [...current, alias],
    )
  }

  const toggleAllCurrentAliases = () => {
    setSelectedCurrentAliases((current) =>
      current.length === selectedAliasValues.length ? [] : [...selectedAliasValues],
    )
  }

  const moveSelectedAliases = (toTarget: TerminalRegistrationStatus) => {
    const aliasesToMove = selectedAliasValues.filter((alias) => selectedCurrentAliasSet.has(alias))
    if (aliasesToMove.length === 0 || toTarget === aliasSuggestionTarget) {
      return
    }

    const nextAliases = createAliasSnapshot(settingsRef.current.terminalRegistration)

    if (aliasSuggestionTarget === 'registered') {
      nextAliases.registered = removeAliasValues(nextAliases.registered, aliasesToMove)
    } else if (aliasSuggestionTarget === 'pairing') {
      nextAliases.pairing = removeAliasValues(nextAliases.pairing, aliasesToMove)
    } else {
      nextAliases.unregistered = removeAliasValues(nextAliases.unregistered, aliasesToMove)
    }

    if (toTarget === 'registered') {
      nextAliases.registered = appendAliasValues(nextAliases.registered, aliasesToMove)
    } else if (toTarget === 'pairing') {
      nextAliases.pairing = appendAliasValues(nextAliases.pairing, aliasesToMove)
    } else {
      nextAliases.unregistered = appendAliasValues(nextAliases.unregistered, aliasesToMove)
    }

    if (
      applyAliasSnapshot(
        nextAliases,
        `${aliasesToMove.length} alias tasindi (${getAliasLabelForTarget(aliasSuggestionTarget)} -> ${getAliasLabelForTarget(toTarget)})`,
      )
    ) {
      setSelectedCurrentAliases([])
    }
  }

  const removeSelectedAliases = () => {
    const aliasesToRemove = selectedAliasValues.filter((alias) => selectedCurrentAliasSet.has(alias))
    if (aliasesToRemove.length === 0) {
      return
    }

    const nextAliases = createAliasSnapshot(settingsRef.current.terminalRegistration)

    if (aliasSuggestionTarget === 'registered') {
      nextAliases.registered = removeAliasValues(nextAliases.registered, aliasesToRemove)
    } else if (aliasSuggestionTarget === 'pairing') {
      nextAliases.pairing = removeAliasValues(nextAliases.pairing, aliasesToRemove)
    } else {
      nextAliases.unregistered = removeAliasValues(nextAliases.unregistered, aliasesToRemove)
    }

    if (applyAliasSnapshot(nextAliases, `${aliasesToRemove.length} alias kaldirildi (${getAliasLabelForTarget(aliasSuggestionTarget)})`)) {
      setSelectedCurrentAliases([])
    }
  }

  const reloadSettingsFromDesktop = async () => {
    const api = getDesktopApi()
    if (!api) {
      return
    }

    const saved = sanitizeSettings(await api.loadSettings())
    setSettings(saved)
  }

  const runTerminalOperation = async (
    action: (api: DesktopApi) => Promise<TerminalOperationResult>,
    fallback: () => void,
  ) => {
    const api = getDesktopApi()
    if (!api) {
      fallback()
      return
    }

    try {
      const saved = await api.saveSettings(settings)
      setSettings(saved)
      const result = await action(api)
      await reloadSettingsFromDesktop()
      await loadBridgeRuntime()
      setStatusMessage(result.message)
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Terminal islemi basarisiz oldu.')
    }
  }

  const markRegistrationPairing = () => {
    void runTerminalOperation(
      (api) =>
        api.terminalRegister({
          adminPanelUrl: settings.terminalRegistration.adminPanelUrl,
          organizationId: settings.terminalRegistration.organizationId,
          locationId: settings.terminalRegistration.locationId,
          terminalId: settings.terminalRegistration.terminalId,
          pairingCode: settings.terminalRegistration.pairingCode,
          pairingToken: settings.terminalRegistration.pairingToken,
          notes: settings.terminalRegistration.notes,
        }),
      () => {
        const pairingCode =
          settings.terminalRegistration.pairingCode.trim() ||
          `${settings.terminalIdentity.branchCode}-${settings.terminalIdentity.terminalCode}`.replace(/\s+/g, '').toUpperCase()
        const pairingToken =
          settings.terminalRegistration.pairingToken.trim() ||
          `pair-${Date.now().toString(36)}`

        setSettings((current) => ({
          ...current,
          terminalRegistration: {
            ...current.terminalRegistration,
            pairingCode,
            pairingToken,
            registrationStatus: 'pairing',
            lastPairingAt: new Date().toISOString(),
          },
        }))
        setStatusMessage('Terminal pairing bekleyen duruma alindi.')
      },
    )
  }

  const markRegistrationCompleted = () => {
    void runTerminalOperation(
      (api) =>
        api.terminalPairingConfirm({
          terminalId: settings.terminalRegistration.terminalId,
          organizationId: settings.terminalRegistration.organizationId,
          locationId: settings.terminalRegistration.locationId,
          pairingToken: settings.terminalRegistration.pairingToken,
          deviceSecret: settings.terminalRegistration.deviceSecret,
          notes: settings.terminalRegistration.notes,
        }),
      () => {
        const terminalId =
          settings.terminalRegistration.terminalId.trim() ||
          `${settings.terminalIdentity.branchCode}-${settings.terminalIdentity.terminalCode}`.toLowerCase()

        setSettings((current) => ({
          ...current,
          terminalRegistration: {
            ...current.terminalRegistration,
            terminalId,
            registrationStatus: 'registered',
            lastSyncAt: new Date().toISOString(),
          },
        }))
        setStatusMessage('Terminal kayitli olarak isaretlendi.')
      },
    )
  }

  const syncTerminalHeartbeat = () => {
    void runTerminalOperation(
      (api) =>
        api.terminalHeartbeat({
          statusMessage: runtimeState.watcherRunning ? 'watcher-running' : 'watcher-idle',
          notes: settings.terminalRegistration.notes,
        }),
      () => {
        setSettings((current) => ({
          ...current,
          terminalRegistration: {
            ...current.terminalRegistration,
            lastSyncAt: new Date().toISOString(),
          },
        }))
        setStatusMessage('Terminal heartbeat guncellendi.')
      },
    )
  }

  const resetTerminalRegistration = () => {
    setSettings((current) => ({
      ...current,
      terminalRegistration: {
        ...current.terminalRegistration,
        organizationId: '',
        locationId: '',
        terminalId: '',
        registrationStatus: 'unregistered',
        pairingCode: '',
        pairingToken: '',
        deviceSecret: '',
        lastPairingAt: '',
        lastSyncAt: '',
        lastRemoteAttemptAt: '',
        lastRemoteOperation: '',
        lastRemoteEndpoint: '',
        lastRemoteSummary: '',
        lastRemoteStatusCode: 0,
        lastRemoteMessage: '',
        lastRemoteError: '',
      },
    }))
    setStatusMessage('Terminal kayit bilgileri sifirlandi.')
  }

  const unlockStartupScreen = () => {
    if (normalizePasswordInput(startupPassword) === expectedStartupPassword) {
      setStartupUnlocked(true)
      setStartupPasswordError('')
      setStartupPassword('')
      return
    }

    setStartupPasswordError('Sifre hatali.')
  }

  const applyReceiptStylePreset = (presetKey: (typeof receiptStylePresets)[number]['key']) => {
    const preset = receiptStylePresets.find((item) => item.key === presetKey)
    if (!preset) {
      return
    }

    setSettings((current) => ({
      ...current,
      general: {
        ...current.general,
        previewStylePreset: preset.key,
        ...preset.values,
      },
    }))
    setStatusMessage(`${preset.label} stili uygulandi.`)
  }

  const updatePrinter = (printerId: string, patch: Partial<PrinterConfig>) => {
    setSettings((current) => ({
      ...current,
      printers: current.printers.map((printer) =>
        printer.id === printerId
          ? {
              ...printer,
              ...patch,
            }
          : printer,
      ),
    }))
  }

  const runIngenicoAction = async (action: () => Promise<IngenicoOperationResult>) => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Ingenico islemleri yalnizca Electron icinde calisir.')
      return
    }

    try {
      const saved = await api.saveSettings(settings)
      setSettings(saved)
      const result = await action()
      setIngenicoResult(result)
      setStatusMessage(result.message)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ingenico islemi basarisiz oldu.'
      setIngenicoResult({
        isSuccess: false,
        operation: 'test',
        message,
      })
      setStatusMessage(message)
    }
  }

  const testIngenicoConnection = async () => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Ingenico islemleri yalnizca Electron icinde calisir.')
      return
    }

    await runIngenicoAction(() => api.ingenicoTest())
  }

  const runIngenicoPrecheck = async () => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Ingenico islemleri yalnizca Electron icinde calisir.')
      return
    }

    await runIngenicoAction(() => api.ingenicoPrecheck())
  }

  const startIngenicoPairing = async () => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Ingenico islemleri yalnizca Electron icinde calisir.')
      return
    }

    await runIngenicoAction(() => api.ingenicoPairing())
  }

  const cancelIngenicoPayment = async () => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Ingenico islemleri yalnizca Electron icinde calisir.')
      return
    }

    await runIngenicoAction(() => api.ingenicoCancel())
  }

  const sendIngenicoPayment = async () => {
    const api = getDesktopApi()
    if (!api) {
      setStatusMessage('Ingenico islemleri yalnizca Electron icinde calisir.')
      return
    }

    if (ingenicoPaymentAmount <= 0) {
      setStatusMessage('Odeme tutari sifirdan buyuk olmali.')
      return
    }

    const paymentRequest: IngenicoPaymentRequest = {
      amount: ingenicoPaymentAmount,
      customerReference: ingenicoCustomerReference.trim() || 'RDA-001',
      items: [
        {
          name: 'Resto Device Agent Test Tahsilati',
          unitPrice: ingenicoPaymentAmount,
          quantity: 1,
        },
      ],
    }

    await runIngenicoAction(() => api.ingenicoPay(paymentRequest))
  }

  const addPrinter = () => {
    const nextNo = Math.max(0, ...settings.printers.map((printer) => printer.printerNo)) + 1
    const printer = createPrinterConfig(nextNo)
    setSettings((current) => ({
      ...current,
      printers: [...current.printers, printer],
    }))
    setSelectedPrinterId(printer.id)
  }

  const removePrinter = (printerId: string) => {
    const nextPrinters = settings.printers.filter((printer) => printer.id !== printerId)
    setSettings((current) => ({
      ...current,
      printers: nextPrinters.length > 0 ? nextPrinters : [createPrinterConfig(1)],
    }))
    if (selectedPrinterId === printerId) {
      setSelectedPrinterId(nextPrinters[0]?.id ?? '')
    }
  }

  const renderGeneralTab = () => (
    <div className="panel-grid">
      <section className="card">
        <div className="card-header">
          <h2>Isletme ve Terminal</h2>
          <span className="pill neutral">{terminalCodeLabel}</span>
        </div>
        <div className="settings-surface-grid">
          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Isletme</h3>
              <p className="settings-subcard-copy">Marka ve ticari unvan bilgileri</p>
            </div>
            <label>
              <span>Isletme unvani</span>
              <input
                value={settings.terminalIdentity.businessName}
                onChange={(event) => updateTerminalIdentity('businessName', event.target.value)}
                placeholder="Ornek Restoran A.S."
              />
            </label>
            <label>
              <span>Marka gorunumu</span>
              <input
                value={settings.terminalIdentity.brandName}
                onChange={(event) => updateTerminalIdentity('brandName', event.target.value)}
                placeholder="FastRest POS"
              />
            </label>
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Sube</h3>
              <p className="settings-subcard-copy">Sube adi ve kodu</p>
            </div>
            <div className="two-col">
              <label>
                <span>Sube adi</span>
                <input
                  value={settings.terminalIdentity.branchName}
                  onChange={(event) => updateTerminalIdentity('branchName', event.target.value)}
                  placeholder="Merkez Sube"
                />
              </label>
              <label>
                <span>Sube kodu</span>
                <input
                  value={settings.terminalIdentity.branchCode}
                  onChange={(event) => updateTerminalIdentity('branchCode', event.target.value.toUpperCase())}
                  placeholder="MRKZ"
                />
              </label>
            </div>
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Terminal</h3>
              <p className="settings-subcard-copy">Kasa, cihaz grubu ve operator etiketi</p>
            </div>
            <div className="two-col">
              <label>
                <span>Terminal adi</span>
                <input
                  value={settings.terminalIdentity.terminalName}
                  onChange={(event) => updateTerminalIdentity('terminalName', event.target.value)}
                  placeholder="Kasa 1"
                />
              </label>
              <label>
                <span>Terminal kodu</span>
                <input
                  value={settings.terminalIdentity.terminalCode}
                  onChange={(event) => updateTerminalIdentity('terminalCode', event.target.value.toUpperCase())}
                  placeholder="KASA-01"
                />
              </label>
            </div>
            <div className="two-col">
              <label>
                <span>Cihaz grubu</span>
                <input
                  value={settings.terminalIdentity.deviceGroup}
                  onChange={(event) => updateTerminalIdentity('deviceGroup', event.target.value)}
                  placeholder="Salon"
                />
              </label>
              <label>
                <span>Varsayilan operator etiketi</span>
                <input
                  value={settings.terminalIdentity.cashierLabel}
                  onChange={(event) => updateTerminalIdentity('cashierLabel', event.target.value)}
                  placeholder="Kasiyer"
                />
              </label>
            </div>
          </section>
        </div>
        <div className="hint-box">
          Aktif kimlik: <code>{terminalDisplayLabel}</code>
          <br />
          Terminal kodu: <code>{terminalCodeLabel}</code>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Terminal Kaydi</h2>
          <span
            className={`pill ${
              settings.terminalRegistration.registrationStatus === 'registered'
                ? 'success'
                : settings.terminalRegistration.registrationStatus === 'pairing'
                  ? 'ignored'
                  : 'error'
            }`}
          >
            {registrationStatusLabel}
          </span>
        </div>
        <div className="settings-surface-grid">
          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Uzak Erisim</h3>
              <p className="settings-subcard-copy">Admin panel adresi, token ve header ayarlari</p>
            </div>
            <label>
              <span>Admin panel URL</span>
              <input
                value={settings.terminalRegistration.adminPanelUrl}
                onChange={(event) => updateTerminalRegistration('adminPanelUrl', event.target.value)}
                placeholder="https://admin.ornek.com"
              />
            </label>
            <label>
              <span>Remote bearer token</span>
              <input
                value={settings.terminalRegistration.remoteAuthToken}
                onChange={(event) => updateTerminalRegistration('remoteAuthToken', event.target.value)}
                placeholder="Opsiyonel Bearer token"
              />
            </label>
            <div className="two-col">
              <label>
                <span>Ozel header adi</span>
                <input
                  value={settings.terminalRegistration.remoteHeaderName}
                  onChange={(event) => updateTerminalRegistration('remoteHeaderName', event.target.value)}
                  placeholder="X-Api-Key"
                />
              </label>
              <label>
                <span>Ozel header degeri</span>
                <input
                  value={settings.terminalRegistration.remoteHeaderValue}
                  onChange={(event) => updateTerminalRegistration('remoteHeaderValue', event.target.value)}
                  placeholder="opsiyonel header degeri"
                />
              </label>
            </div>
            <label>
              <span>Request timeout (ms)</span>
              <input
                type="number"
                min={1000}
                step={500}
                value={settings.terminalRegistration.remoteRequestTimeoutMs}
                onChange={(event) => updateTerminalRegistration('remoteRequestTimeoutMs', Number(event.target.value))}
              />
            </label>
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Senkron</h3>
              <p className="settings-subcard-copy">Heartbeat ve retry davranisi</p>
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.terminalRegistration.autoHeartbeatEnabled}
                onChange={(event) => updateTerminalRegistration('autoHeartbeatEnabled', event.target.checked)}
              />
              <span>Kayitli terminal icin otomatik heartbeat gonder</span>
            </label>
            <label>
              <span>Heartbeat araligi (sn)</span>
              <input
                type="number"
                min={15}
                value={settings.terminalRegistration.heartbeatIntervalSec}
                onChange={(event) => updateTerminalRegistration('heartbeatIntervalSec', Number(event.target.value))}
              />
            </label>
            <div className="two-col">
              <label>
                <span>Retry sayisi</span>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={settings.terminalRegistration.remoteRetryCount}
                  onChange={(event) => updateTerminalRegistration('remoteRetryCount', Number(event.target.value))}
                />
              </label>
              <label>
                <span>Retry bekleme (ms)</span>
                <input
                  type="number"
                  min={250}
                  step={250}
                  value={settings.terminalRegistration.remoteRetryDelayMs}
                  onChange={(event) => updateTerminalRegistration('remoteRetryDelayMs', Number(event.target.value))}
                />
              </label>
            </div>
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Status Map</h3>
              <p className="settings-subcard-copy">Admin panel status alias eslemeleri</p>
            </div>
            <div className="action-row">
              {terminalStatusAliasPresets.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  className={activeStatusAliasPreset === preset.key ? 'active-chip' : 'secondary'}
                  onClick={() => applyStatusAliasPreset(preset.key)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="hint-box">
              Aktif preset: <code>{activeStatusAliasPreset || 'Ozel'}</code>
              <br />
              Onerilen hedef: <code>{getAliasLabelForTarget(settings.terminalRegistration.registrationStatus)}</code>
            </div>
            <div className="alias-target-grid">
              {aliasTargetOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`alias-target-card ${aliasSuggestionTarget === option.key ? 'selected' : ''}`}
                  onClick={() => setAliasSuggestionTarget(option.key)}
                >
                  <strong>{option.label}</strong>
                  <span>{option.copy}</span>
                  <small>
                    {getAliasValuesForTarget(option.key).length} alias
                    {' · '}
                    {lastRemoteAliasCandidates.filter((candidate) => getAliasValuesForTarget(option.key).includes(candidate)).length}
                    {' '}
                    eslesme
                  </small>
                </button>
              ))}
            </div>
            <div className="alias-preview-panel">
              <div className="alias-preview-header">
                <strong>{getAliasLabelForTarget(aliasSuggestionTarget)} listesi onizleme</strong>
                <span
                  className={`pill ${
                    aliasSuggestionTarget === settings.terminalRegistration.registrationStatus ? 'success' : 'neutral'
                  }`}
                >
                  {aliasSuggestionTarget === settings.terminalRegistration.registrationStatus ? 'Onerilen hedef' : 'Manuel hedef'}
                </span>
              </div>
              <div className="meta-row">
                <span className="pill neutral">Mevcut: {selectedAliasValues.length}</span>
                <span className={`pill ${newAliasCandidateCount > 0 ? 'success' : 'ignored'}`}>Yeni: {newAliasCandidateCount}</span>
                <span className="pill neutral">Uygulaninca: {aliasPreviewMergedCount}</span>
              </div>
              <div className="alias-chip-list">
                {pendingAliasCandidatesForTarget.length > 0 ? (
                  pendingAliasCandidatesForTarget.map((candidate) => (
                    <span key={candidate} className="pill neutral">
                      {candidate}
                    </span>
                  ))
                ) : (
                  <span className="pill ignored">Secili hedef icin yeni aday yok</span>
                )}
              </div>
            </div>
            {lastAliasChange ? (
              <div className="alias-history-panel">
                <div className="alias-preview-header">
                  <strong>Son Degisiklik</strong>
                  <button type="button" className="secondary" onClick={undoLastAliasChange}>
                    Geri Al
                  </button>
                </div>
                <div className="hint-box">
                  <code>{lastAliasChange.label}</code>
                </div>
                <div className="meta-row">
                  <span className="pill neutral">
                    Once: R {parseAliasValues(lastAliasChange.before.registered).length} / P {parseAliasValues(lastAliasChange.before.pairing).length} / U {parseAliasValues(lastAliasChange.before.unregistered).length}
                  </span>
                  <span className="pill success">
                    Simdi: R {parseAliasValues(lastAliasChange.after.registered).length} / P {parseAliasValues(lastAliasChange.after.pairing).length} / U {parseAliasValues(lastAliasChange.after.unregistered).length}
                  </span>
                </div>
              </div>
            ) : null}
            <div className="alias-current-panel">
              <div className="settings-subcard-header">
                <h4 className="settings-subcard-title">Mevcut Aliaslar</h4>
                <p className="settings-subcard-copy">Secili listedeki alias'lari tekil veya toplu sekilde yonet</p>
              </div>
              {selectedAliasValues.length > 0 ? (
                <div className="alias-current-list">
                  <div className="alias-bulk-toolbar">
                    <div className="meta-row">
                      <span className="pill neutral">Toplam: {selectedAliasValues.length}</span>
                      <span className={`pill ${selectedCurrentAliasCount > 0 ? 'success' : 'ignored'}`}>
                        Secili: {selectedCurrentAliasCount}
                      </span>
                    </div>
                    <div className="alias-bulk-actions">
                      <button type="button" className="secondary" onClick={toggleAllCurrentAliases}>
                        {selectedCurrentAliasCount === selectedAliasValues.length ? 'Secimi Temizle' : 'Tumunu Sec'}
                      </button>
                      {aliasTargetOptions
                        .filter((option) => option.key !== aliasSuggestionTarget)
                        .map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            className={selectedCurrentAliasCount > 0 ? 'active-chip' : 'secondary'}
                            disabled={selectedCurrentAliasCount === 0}
                            onClick={() => moveSelectedAliases(option.key)}
                          >
                            {option.label}'a Tasi
                          </button>
                        ))}
                      <button
                        type="button"
                        className={selectedCurrentAliasCount > 0 ? 'active-chip' : 'secondary'}
                        disabled={selectedCurrentAliasCount === 0}
                        onClick={removeSelectedAliases}
                      >
                        Secileni Kaldir
                      </button>
                    </div>
                  </div>
                  {selectedAliasValues.map((alias) => (
                    <div
                      key={alias}
                      className={`alias-current-chip ${selectedCurrentAliasSet.has(alias) ? 'selected' : ''}`}
                    >
                      <div className="alias-current-topline">
                        <label className="alias-select-toggle">
                          <input
                            type="checkbox"
                            checked={selectedCurrentAliasSet.has(alias)}
                            onChange={() => toggleCurrentAliasSelection(alias)}
                          />
                          <strong>{alias}</strong>
                        </label>
                        <span className={`pill ${selectedCurrentAliasSet.has(alias) ? 'success' : 'neutral'}`}>
                          {selectedCurrentAliasSet.has(alias) ? 'Secili' : 'Tekil'}
                        </span>
                      </div>
                      <div className="alias-chip-actions">
                        {aliasTargetOptions
                          .filter((option) => option.key !== aliasSuggestionTarget)
                          .map((option) => (
                            <button
                              key={option.key}
                              type="button"
                              className="secondary"
                              onClick={() => moveSingleAlias(alias, aliasSuggestionTarget, option.key)}
                            >
                              {option.label}
                            </button>
                          ))}
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => removeSingleAlias(alias, aliasSuggestionTarget)}
                        >
                          Kaldir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="hint-box">
                  Secili hedef listesinde alias yok. Aday kartlarindan veya `Son Durumu Ekle` ile hizlica doldurabilirsin.
                </div>
              )}
            </div>
            <div className="action-row">
              <button type="button" className="secondary" onClick={() => void copyStatusAliasConfig()}>
                Kopyala
              </button>
              <button type="button" className="secondary" onClick={resetStatusAliasPreset}>
                Sifirla
              </button>
              <button
                type="button"
                className={newAliasCandidateCount > 0 ? 'active-chip' : 'secondary'}
                onClick={addLastRemoteStatusToAliases}
                disabled={newAliasCandidateCount === 0}
              >
                Son Durumu Ekle
              </button>
            </div>
            <div className="hint-box">
              `Son Durumu Ekle`, son uzak mesaj veya hata icindeki anlamli kelimeleri secili hedef listeye ekler.
              <br />
              Secili hedef icin yeni aday: <code>{newAliasCandidateCount}</code>
            </div>
            {lastRemoteAliasCandidates.length > 0 ? (
              <div className="alias-suggestion-panel">
                <div className="settings-subcard-header">
                  <h4 className="settings-subcard-title">Aday Aliaslar</h4>
                  <p className="settings-subcard-copy">Kart icinden farkli hedefe tek tek gonder veya secili hedefe toplu aktar</p>
                </div>
                <div className="alias-suggestion-grid">
                  {lastRemoteAliasCandidates.map((candidate) => {
                    const presenceTargets = getAliasPresenceTargets(candidate)

                    return (
                      <div key={candidate} className="alias-suggestion-card">
                        <div className="alias-suggestion-topline">
                          <strong>{candidate}</strong>
                          <span className={`pill ${presenceTargets.includes(aliasSuggestionTarget) ? 'ignored' : 'neutral'}`}>
                            {presenceTargets.includes(aliasSuggestionTarget) ? 'Mevcut' : 'Yeni'}
                          </span>
                        </div>
                        <div className="meta-row">
                          {presenceTargets.length > 0 ? (
                            presenceTargets.map((target) => (
                              <span key={target} className="pill neutral">
                                {getAliasLabelForTarget(target)}
                              </span>
                            ))
                          ) : (
                            <span className="pill neutral">Henuz yok</span>
                          )}
                        </div>
                        <div className="alias-action-grid">
                          {aliasTargetOptions.map((option) => {
                            const alreadyInTarget = presenceTargets.includes(option.key)

                            return (
                              <button
                                key={option.key}
                                type="button"
                                className={
                                  alreadyInTarget ? 'secondary' : aliasSuggestionTarget === option.key ? 'active-chip' : 'secondary'
                                }
                                disabled={alreadyInTarget}
                                onClick={() => addSingleAliasCandidate(candidate, option.key)}
                              >
                                {alreadyInTarget ? `${option.label} icinde` : option.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
            <label>
              <span>Registered alias listesi</span>
              <textarea
                rows={2}
                value={settings.terminalRegistration.remoteRegisteredAliases}
                onChange={(event) => updateTerminalRegistration('remoteRegisteredAliases', event.target.value)}
                placeholder="registered, active, approved"
              />
            </label>
            <label>
              <span>Pairing alias listesi</span>
              <textarea
                rows={2}
                value={settings.terminalRegistration.remotePairingAliases}
                onChange={(event) => updateTerminalRegistration('remotePairingAliases', event.target.value)}
                placeholder="pairing, pending, awaiting_code"
              />
            </label>
            <label>
              <span>Unregistered alias listesi</span>
              <textarea
                rows={2}
                value={settings.terminalRegistration.remoteUnregisteredAliases}
                onChange={(event) => updateTerminalRegistration('remoteUnregisteredAliases', event.target.value)}
                placeholder="unregistered, revoked, disabled"
              />
            </label>
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Kayit Bilgisi</h3>
              <p className="settings-subcard-copy">Organizasyon, lokasyon ve terminal kimligi</p>
            </div>
            <div className="two-col">
              <label>
                <span>Organizasyon ID</span>
                <input
                  value={settings.terminalRegistration.organizationId}
                  onChange={(event) => updateTerminalRegistration('organizationId', event.target.value)}
                  placeholder="org_001"
                />
              </label>
              <label>
                <span>Lokasyon ID</span>
                <input
                  value={settings.terminalRegistration.locationId}
                  onChange={(event) => updateTerminalRegistration('locationId', event.target.value)}
                  placeholder="loc_merkez"
                />
              </label>
            </div>
            <div className="two-col">
              <label>
                <span>Terminal ID</span>
                <input
                  value={settings.terminalRegistration.terminalId}
                  onChange={(event) => updateTerminalRegistration('terminalId', event.target.value)}
                  placeholder="terminal_kasa_01"
                />
              </label>
              <label>
                <span>Pairing kodu</span>
                <input
                  value={settings.terminalRegistration.pairingCode}
                  onChange={(event) => updateTerminalRegistration('pairingCode', event.target.value.toUpperCase())}
                  placeholder="MRKZ-KASA-01"
                />
              </label>
            </div>
            <div className="two-col">
              <label>
                <span>Pairing token</span>
                <input
                  value={settings.terminalRegistration.pairingToken}
                  onChange={(event) => updateTerminalRegistration('pairingToken', event.target.value)}
                  placeholder="pair-..."
                />
              </label>
              <label>
                <span>Device secret</span>
                <input
                  value={settings.terminalRegistration.deviceSecret}
                  onChange={(event) => updateTerminalRegistration('deviceSecret', event.target.value)}
                  placeholder="secret-..."
                />
              </label>
            </div>
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Son Uzak Cevap</h3>
              <p className="settings-subcard-copy">Register, heartbeat ve pairing donuslerinin son durumu</p>
            </div>
            <div className="meta-row">
              <span className={`pill ${remoteFeedbackTone}`}>Durum: {registrationStatusLabel}</span>
              <span className="pill neutral">Op: {lastRemoteOperationLabel}</span>
              <span className="pill neutral">HTTP: {settings.terminalRegistration.lastRemoteStatusCode || '-'}</span>
              <span className="pill neutral">Attempt: {settings.terminalRegistration.lastRemoteAttemptAt || '-'}</span>
            </div>
            {settings.terminalRegistration.lastRemoteSummary
              || settings.terminalRegistration.lastRemoteMessage
              || settings.terminalRegistration.lastRemoteError ? (
                <div className="remote-feedback-stack">
                  {settings.terminalRegistration.lastRemoteSummary ? (
                    <div className="remote-feedback-card">
                      <span>Ozet</span>
                      <code>{settings.terminalRegistration.lastRemoteSummary}</code>
                    </div>
                  ) : null}
                  {settings.terminalRegistration.lastRemoteMessage ? (
                    <div className="remote-feedback-card">
                      <span>Mesaj</span>
                      <code>{settings.terminalRegistration.lastRemoteMessage}</code>
                    </div>
                  ) : null}
                  {settings.terminalRegistration.lastRemoteError ? (
                    <div className="remote-feedback-card error">
                      <span>Hata</span>
                      <code>{settings.terminalRegistration.lastRemoteError}</code>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="hint-box">
                  Henuz uzak register, heartbeat veya pairing donusu alinmadi.
                </div>
              )}
            <div className="hint-box">
              Endpoint: <code>{settings.terminalRegistration.lastRemoteEndpoint || '-'}</code>
              <br />
              Son sync: <code>{settings.terminalRegistration.lastSyncAt || '-'}</code>
            </div>
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Operasyon</h3>
              <p className="settings-subcard-copy">Notlar, durum ve manuel aksiyonlar</p>
            </div>
            <label>
              <span>Kayit notlari</span>
              <textarea
                rows={3}
                value={settings.terminalRegistration.notes}
                onChange={(event) => updateTerminalRegistration('notes', event.target.value)}
                placeholder="Kurulum veya esleme notlari"
              />
            </label>
            <div className="action-row">
              <button type="button" onClick={markRegistrationPairing}>Pairing Hazirla</button>
              <button type="button" className="secondary" onClick={markRegistrationCompleted}>Kaydi Tamamla</button>
              <button type="button" className="secondary" onClick={syncTerminalHeartbeat}>Heartbeat Gonder</button>
              <button type="button" className="secondary" onClick={resetTerminalRegistration}>Kaydi Sifirla</button>
            </div>
          </section>
        </div>
        <div className="meta-row">
          <span className="pill neutral">Op: {lastRemoteOperationLabel}</span>
          <span className="pill neutral">Pairing: {settings.terminalRegistration.lastPairingAt || '-'}</span>
          <span className="pill neutral">Sync: {settings.terminalRegistration.lastSyncAt || '-'}</span>
          <span className="pill neutral">Attempt: {settings.terminalRegistration.lastRemoteAttemptAt || '-'}</span>
          <span className="pill neutral">HTTP: {settings.terminalRegistration.lastRemoteStatusCode || '-'}</span>
          <span className="pill neutral">Timeout: {settings.terminalRegistration.remoteRequestTimeoutMs} ms</span>
          <span className={`pill ${settings.terminalRegistration.autoHeartbeatEnabled ? 'success' : 'ignored'}`}>
            Auto HB: {settings.terminalRegistration.autoHeartbeatEnabled ? `${settings.terminalRegistration.heartbeatIntervalSec} sn` : 'Kapali'}
          </span>
        </div>
        <div className="hint-box">
          Bu katman su an merkezi admin panel baglantisinin yerel iskeleti olarak calisir.
          <br />
          Pairing ve heartbeat istekleri burada tanimli URL'ye gider; token varsa `Authorization: Bearer ...` basligi eklenir.
          <br />
          Ozel header tanimlanirsa ayni istege eklenir; timeout suresi asilirsa istek hata sayilip retry kurali devreye girer.
          Retry ayarlari 5xx veya baglanti kopmalarinda artan gecikmeyle tekrar denemek icin kullanilir.
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Genel Ayarlar</h2>
          <span className="pill neutral">{settings.general.encoding.toUpperCase()}</span>
        </div>
        <section className="settings-subcard readiness-subcard">
          <div className="settings-subcard-header">
            <h3 className="settings-subcard-title">Canliya Hazirlik</h3>
            <p className="settings-subcard-copy">Kurulum oncesi kritik ayarlari tek bakista kontrol et</p>
          </div>
          <div className="meta-row">
            <span className={`pill ${liveReadinessMissingCount === 0 ? 'success' : 'ignored'}`}>
              Hazirlik: {liveReadinessCompletedCount}/{liveReadinessChecks.length}
            </span>
            <span className={`pill ${liveReadinessMissingCount === 0 ? 'success' : 'ignored'}`}>
              Eksik: {liveReadinessMissingCount}
            </span>
          </div>
          <div className="readiness-grid">
            {liveReadinessChecks.map((item) => (
              <div key={item.label} className={`readiness-item ${item.ok ? 'ok' : 'warn'}`}>
                <div className="readiness-topline">
                  <strong>{item.label}</strong>
                  <span className={`pill ${item.ok ? 'success' : 'ignored'}`}>{item.ok ? 'Hazir' : 'Kontrol Et'}</span>
                </div>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
        <div className="settings-surface-grid">
          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Klasorler</h3>
              <p className="settings-subcard-copy">Izleme ve arsiv yol ayarlari</p>
            </div>
            <label>
              <span>Izlenecek klasor</span>
              <input
                value={settings.general.watchDirectory}
                onChange={(event) => updateGeneral('watchDirectory', event.target.value)}
                placeholder="C:/FastRest/Printer"
              />
            </label>
            <div className="action-row">
              <button onClick={chooseWatchDirectory}>Klasor Sec</button>
            </div>
            <label>
              <span>Basarili arsiv klasoru</span>
              <input
                value={settings.general.successArchiveDirectory}
                onChange={(event) => updateGeneral('successArchiveDirectory', event.target.value)}
                placeholder="Bos birakilirsa IzlenecekKlasor/_arsiv/Basarili kullanilir"
              />
            </label>
            <div className="action-row">
              <button onClick={() => chooseArchiveDirectory('successArchiveDirectory', 'Basarili Arsiv Klasorunu Sec')}>
                Basarili Klasoru Sec
              </button>
            </div>
            <label>
              <span>Hatali arsiv klasoru</span>
              <input
                value={settings.general.errorArchiveDirectory}
                onChange={(event) => updateGeneral('errorArchiveDirectory', event.target.value)}
                placeholder="Bos birakilirsa IzlenecekKlasor/_arsiv/Hatali kullanilir"
              />
            </label>
            <div className="action-row">
              <button className="secondary" onClick={() => chooseArchiveDirectory('errorArchiveDirectory', 'Hatali Arsiv Klasorunu Sec')}>
                Hatali Klasoru Sec
              </button>
            </div>
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Calisma</h3>
              <p className="settings-subcard-copy">Tarama ve yazdirma davranisi</p>
            </div>
            <label>
              <span>Kontrol araligi (sn)</span>
              <input
                type="number"
                min={1}
                value={settings.general.pollIntervalSec}
                onChange={(event) => updateGeneral('pollIntervalSec', Number(event.target.value))}
              />
            </label>
            <label>
              <span>Kodlama</span>
              <select
                value={settings.general.encoding}
                onChange={(event) => updateGeneral('encoding', event.target.value as AppSettings['general']['encoding'])}
              >
                <option value="cp857">CP857 (Turkce ESC/POS)</option>
                <option value="utf8">UTF-8</option>
              </select>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.general.cutPaper}
                onChange={(event) => updateGeneral('cutPaper', event.target.checked)}
              />
              <span>ESC/POS sonunda kesme komutu gonder</span>
            </label>
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Otomasyon</h3>
              <p className="settings-subcard-copy">Baslangic ve pencere davranislari</p>
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.general.autoStart}
                onChange={(event) => updateGeneral('autoStart', event.target.checked)}
              />
              <span>Program acilinca izle</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.general.launchOnWindowsStartup}
                onChange={(event) => updateGeneral('launchOnWindowsStartup', event.target.checked)}
              />
              <span>Windows acilisinda otomatik baslat</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.general.closeToTray}
                onChange={(event) => updateGeneral('closeToTray', event.target.checked)}
              />
              <span>Kapatinca tepsiye gizle</span>
            </label>
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Yedek ve Kurulum</h3>
              <p className="settings-subcard-copy">Canliya cikmadan once ayarlari yedekle ve settings klasorune hizli eris</p>
            </div>
            <div className="action-row">
              <button type="button" onClick={exportSettingsBackup}>Ayarlari Yedekle</button>
              <button type="button" className="secondary" onClick={importSettingsBackup}>Yedegi Geri Yukle</button>
              <button type="button" className="secondary" onClick={openSettingsDirectory}>Ayar Klasorunu Ac</button>
            </div>
            <div className="hint-box">
              Canli makinede ayarlar kullanici profilindeki `settings.json` dosyasinda tutulur.
              <br />
              Yeni kurulum veya cihaz degisiminde once yedek alman onerilir.
            </div>
          </section>
        </div>
      </section>

      <section className="card status-card">
        <h2>Calisma Durumu</h2>
        <div className={`status-badge ${runtimeState.watcherRunning ? 'active' : 'idle'}`}>
          {runtimeState.watcherRunning ? 'Izleme aktif' : 'Izleme pasif'}
        </div>
        <p>{statusMessage}</p>
        <div className="meta-row">
          <span className="pill neutral">{terminalDisplayLabel}</span>
          <span className="pill neutral">{terminalCodeLabel}</span>
          <span className="pill neutral">{registrationStatusLabel}</span>
        </div>
        <div className="action-row">
          <button onClick={saveSettings}>Ayarlari Kaydet</button>
          <button onClick={startWatcher}>Izlemeyi Baslat</button>
          <button className="secondary" onClick={stopWatcher}>Izlemeyi Durdur</button>
        </div>
        <div className="hint-box">
          Dosya adi ornegi: <code>MASA-20260418-001.3</code>
          <br />
          Sondaki <code>.3</code> degeri yazici numarasi olarak eslestirilir.
        </div>
      </section>

    </div>
  )

  const renderBridgeSettingsCard = () => (
    <section className="card">
      <div className="card-header">
        <h2>Bridge API</h2>
        <span className={`pill ${settings.bridge.enabled ? 'success' : 'ignored'}`}>
          {settings.bridge.enabled ? 'Acik' : 'Kapali'}
        </span>
      </div>
      <div className="settings-surface-grid">
        <section className="settings-subcard">
          <div className="settings-subcard-header">
            <h3 className="settings-subcard-title">Yayin</h3>
            <p className="settings-subcard-copy">Yerel HTTP servis ve adres ayarlari</p>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={settings.bridge.enabled}
              onChange={(event) => updateBridge('enabled', event.target.checked)}
            />
            <span>Yerel HTTP bridge aktif</span>
          </label>
          <div className="two-col">
            <label>
              <span>Host</span>
              <input
                value={settings.bridge.host}
                onChange={(event) => updateBridge('host', event.target.value)}
                placeholder="127.0.0.1"
              />
            </label>
            <label>
              <span>Port</span>
              <input
                type="number"
                min={1}
                max={65535}
                value={settings.bridge.port}
                onChange={(event) => updateBridge('port', Number(event.target.value))}
              />
            </label>
          </div>
          <div className="device-inline-meta">
            <span>Adres: http://{settings.bridge.host}:{settings.bridge.port}</span>
            <span>Endpoint: /health</span>
          </div>
        </section>

        <section className="settings-subcard">
          <div className="settings-subcard-header">
            <h3 className="settings-subcard-title">Guvenlik</h3>
            <p className="settings-subcard-copy">Token korumasi ve log davranisi</p>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={settings.bridge.authRequired}
              onChange={(event) => updateBridge('authRequired', event.target.checked)}
            />
            <span>Token korumasi aktif</span>
          </label>
          <label>
            <span>Bridge token</span>
            <input
              value={settings.bridge.authToken}
              onChange={(event) => updateBridge('authToken', event.target.value)}
              placeholder="Bos ise auth kapali kalmali"
            />
          </label>
          <label>
            <span>Log limiti</span>
            <input
              type="number"
              min={10}
              max={500}
              value={settings.bridge.requestLogLimit}
              onChange={(event) => updateBridge('requestLogLimit', Number(event.target.value))}
            />
          </label>
          <div className="device-inline-meta">
            <span>Header: Authorization</span>
            <span>Alternatif: X-Bridge-Token</span>
          </div>
        </section>
      </div>
      <div className="hint-box">
        Bridge adresi: <code>http://{settings.bridge.host}:{settings.bridge.port}</code>
        <br />
        Terminal: <code>{settings.terminalIdentity.branchCode}/{settings.terminalIdentity.terminalCode}</code>
        <br />
        Kayit durumu: <code>{registrationStatusLabel}</code>
        <br />
        Korumali endpointler icin <code>Authorization: Bearer TOKEN</code> veya <code>X-Bridge-Token</code> kullan.
      </div>
    </section>
  )

  const renderPrintersTab = () => (
    <div className="stack">
      <div className="action-row">
        <button onClick={addPrinter}>Yeni Yazici Ekle</button>
        <button className="secondary" onClick={refreshSystemPrinters}>Windows Yazicilarini Yenile</button>
        <button onClick={saveSettings}>Yazicilari Kaydet</button>
      </div>
      {desktopReady && systemPrinters.length === 0 ? (
        <div className="hint-box">
          Windows yazici listesi bos geldi. `Windows Yazicilarini Yenile` ile tekrar deneyin. Hala bos ise uygulamayi exe veya
          `npm run dev` ile acin.
        </div>
      ) : null}
      <div className="printer-grid">
        {settings.printers.map((printer) => (
          <section key={printer.id} className={`card printer-card ${selectedPrinterId === printer.id ? 'selected' : ''}`}>
            <div className="card-header">
              <h2>{printer.name}</h2>
              <button className="secondary" onClick={() => removePrinter(printer.id)}>Sil</button>
            </div>
            <div className="settings-surface-grid">
              <section className="settings-subcard">
                <div className="settings-subcard-header">
                  <h3 className="settings-subcard-title">Kimlik</h3>
                  <p className="settings-subcard-copy">Yazici numarasi ve gorunen ad</p>
                </div>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={printer.enabled}
                    onChange={(event) => updatePrinter(printer.id, { enabled: event.target.checked })}
                  />
                  <span>Aktif</span>
                </label>
                <div className="two-col">
                  <label>
                    <span>Yazici No</span>
                    <input
                      type="number"
                      min={1}
                      value={printer.printerNo}
                      onChange={(event) => updatePrinter(printer.id, { printerNo: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    <span>Gorunen ad</span>
                    <input
                      value={printer.name}
                      onChange={(event) => updatePrinter(printer.id, { name: event.target.value })}
                    />
                  </label>
                </div>
              </section>

              <section className="settings-subcard">
                <div className="settings-subcard-header">
                  <h3 className="settings-subcard-title">Baglanti</h3>
                  <p className="settings-subcard-copy">Windows veya ESC/POS baglantisi</p>
                </div>
                <label>
                  <span>Baglanti tipi</span>
                  <select
                    value={printer.type}
                    onChange={(event) => updatePrinter(printer.id, { type: event.target.value as PrinterConfig['type'] })}
                  >
                    <option value="windows">Windows yazicisi</option>
                    <option value="escpos">ESC/POS TCP</option>
                  </select>
                </label>
                {printer.type === 'windows' ? (
                  <label>
                    <span>Windows yazicisi</span>
                    <select
                      value={printer.windowsPrinterName}
                      onChange={(event) => updatePrinter(printer.id, { windowsPrinterName: event.target.value })}
                    >
                      <option value="">Seciniz</option>
                      {systemPrinters.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <div className="two-col">
                    <label>
                      <span>IP / Host</span>
                      <input
                        value={printer.host}
                        onChange={(event) => updatePrinter(printer.id, { host: event.target.value })}
                        placeholder="192.168.1.50"
                      />
                    </label>
                    <label>
                      <span>Port</span>
                      <input
                        type="number"
                        value={printer.port}
                        onChange={(event) => updatePrinter(printer.id, { port: Number(event.target.value) })}
                      />
                    </label>
                  </div>
                )}
              </section>

              <section className="settings-subcard">
                <div className="settings-subcard-header">
                  <h3 className="settings-subcard-title">Baski</h3>
                  <p className="settings-subcard-copy">Kopya, kagit ve font olcegi</p>
                </div>
                <div className="two-col">
                  <label>
                    <span>Kopya</span>
                    <input
                      type="number"
                      min={1}
                      value={printer.copies}
                      onChange={(event) => updatePrinter(printer.id, { copies: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    <span>Kagit genisligi</span>
                    <input
                      type="number"
                      min={58}
                      value={printer.paperWidth}
                      onChange={(event) => updatePrinter(printer.id, { paperWidth: Number(event.target.value) })}
                    />
                  </label>
                </div>
                <label>
                  <span>Font carpani</span>
                  <input
                    type="number"
                    min={0.5}
                    step={0.1}
                    value={printer.fontScale}
                    onChange={(event) => updatePrinter(printer.id, { fontScale: Number(event.target.value) })}
                  />
                </label>
                <div className="action-row">
                  <button className="secondary" onClick={() => setSelectedPrinterId(printer.id)}>Onizleme icin sec</button>
                </div>
              </section>
            </div>
          </section>
        ))}
      </div>
    </div>
  )

  const renderReceiptSettingsTab = () => (
    <div className="panel-grid">
      <section className="card">
        <div className="card-header">
          <h2>Fis Tasarimi</h2>
          <span className="pill neutral">{settings.general.previewStylePreset}</span>
        </div>
        <div className="settings-surface-grid">
          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Metinler</h3>
              <p className="settings-subcard-copy">Hazir stil ve temel fis etiketleri</p>
            </div>
            <label>
              <span>Hazir stil</span>
              <select
                value={settings.general.previewStylePreset}
                onChange={(event) => applyReceiptStylePreset(event.target.value as (typeof receiptStylePresets)[number]['key'])}
              >
                {receiptStylePresets.map((preset) => (
                  <option key={preset.key} value={preset.key}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Fis ust basligi</span>
              <input
                value={settings.general.receiptHeaderText}
                onChange={(event) => updateGeneral('receiptHeaderText', event.target.value)}
                placeholder="German Doner"
              />
            </label>
            <label>
              <span>Fis alt durumu</span>
              <input
                value={settings.general.receiptFooterText}
                onChange={(event) => updateGeneral('receiptFooterText', event.target.value)}
                placeholder="*** HAZIRLANIYOR ***"
              />
            </label>
            <div className="two-col">
              <label>
                <span>Extra etiketi</span>
                <input
                  value={settings.general.receiptExtraLabel}
                  onChange={(event) => updateGeneral('receiptExtraLabel', event.target.value)}
                  placeholder="Extra"
                />
              </label>
              <label>
                <span>Cikar etiketi</span>
                <input
                  value={settings.general.receiptRemoveLabel}
                  onChange={(event) => updateGeneral('receiptRemoveLabel', event.target.value)}
                  placeholder="Cikar"
                />
              </label>
            </div>
            <label>
              <span>Not etiketi</span>
              <input
                value={settings.general.receiptCustomNoteLabel}
                onChange={(event) => updateGeneral('receiptCustomNoteLabel', event.target.value)}
                placeholder="Not"
              />
            </label>
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Siparis Gorunumu</h3>
              <p className="settings-subcard-copy">Siparis no ve not davranislari</p>
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.general.moveStarredNotesToFooter}
                onChange={(event) => updateGeneral('moveStarredNotesToFooter', event.target.checked)}
              />
              <span>`***` ile baslayan notlari altta tek kez goster</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.general.showOrderSequenceBadge}
                onChange={(event) => updateGeneral('showOrderSequenceBadge', event.target.checked)}
              />
              <span>Siparisleri daire icinde sira numarasi ile goster</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.general.thermalPrinterMode}
                onChange={(event) => updateGeneral('thermalPrinterMode', event.target.checked)}
              />
              <span>Termal yazici modu kullan</span>
            </label>
            <div className="hint-box">
              Bu alan fiste siparis sirasi, not yerlesimi ve termal cikti hissini belirler.
            </div>
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Dinamik Secimler</h3>
              <p className="settings-subcard-copy">Alt seceneklerin grup ve etiket gorunumu</p>
            </div>
            <label>
              <span>`*`li menu alt secenek gorunumu</span>
              <select
                value={settings.general.dynamicOptionDisplayMode}
                onChange={(event) => updateGeneral('dynamicOptionDisplayMode', event.target.value as 'classic' | 'grouped' | 'compact')}
              >
                <option value="grouped">Alt blok</option>
                <option value="classic">Klasik liste</option>
                <option value="compact">Kategorili ozet</option>
              </select>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.general.showDynamicSelectionLabel}
                onChange={(event) => updateGeneral('showDynamicSelectionLabel', event.target.checked)}
              />
              <span>`Secim:` etiketini goster</span>
            </label>
            <div className="three-col settings-compact-grid">
              <label>
                <span>Icecek etiketi</span>
                <input
                  value={settings.general.dynamicDrinkLabel}
                  onChange={(event) => updateGeneral('dynamicDrinkLabel', event.target.value)}
                  placeholder="Icecek"
                />
              </label>
              <label>
                <span>Sos etiketi</span>
                <input
                  value={settings.general.dynamicSauceLabel}
                  onChange={(event) => updateGeneral('dynamicSauceLabel', event.target.value)}
                  placeholder="Sos"
                />
              </label>
              <label>
                <span>Diger etiketi</span>
                <input
                  value={settings.general.dynamicOtherLabel}
                  onChange={(event) => updateGeneral('dynamicOtherLabel', event.target.value)}
                  placeholder="Diger"
                />
              </label>
            </div>
            <div className="two-col">
              <label>
                <span>Yazi boyutu</span>
                <input
                  type="number"
                  min={0.7}
                  max={1.4}
                  step={0.05}
                  value={settings.general.dynamicOptionFontScale}
                  onChange={(event) => updateGeneral('dynamicOptionFontScale', Number(event.target.value))}
                />
              </label>
              <label>
                <span>Satir araligi</span>
                <input
                  type="number"
                  min={1}
                  max={2.2}
                  step={0.05}
                  value={settings.general.dynamicOptionLineHeight}
                  onChange={(event) => updateGeneral('dynamicOptionLineHeight', Number(event.target.value))}
                />
              </label>
            </div>
            <div className="two-col">
              <label>
                <span>Sol bosluk</span>
                <input
                  type="number"
                  min={24}
                  max={120}
                  step={2}
                  value={settings.general.dynamicOptionIndent}
                  onChange={(event) => updateGeneral('dynamicOptionIndent', Number(event.target.value))}
                />
              </label>
              <label>
                <span>Koyuluk</span>
                <input
                  type="number"
                  min={0.45}
                  max={1}
                  step={0.05}
                  value={settings.general.dynamicOptionOpacity}
                  onChange={(event) => updateGeneral('dynamicOptionOpacity', Number(event.target.value))}
                />
              </label>
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                updateGeneral('dynamicOptionFontScale', defaultSettings.general.dynamicOptionFontScale)
                updateGeneral('dynamicOptionLineHeight', defaultSettings.general.dynamicOptionLineHeight)
                updateGeneral('dynamicOptionIndent', defaultSettings.general.dynamicOptionIndent)
                updateGeneral('dynamicOptionOpacity', defaultSettings.general.dynamicOptionOpacity)
              }}
            >
              Dinamik alt blok ayarlarini varsayilana dondur
            </button>
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Yonlendirme</h3>
              <p className="settings-subcard-copy">Ek anahtar kelimeler ve ikinci yazici davranisi</p>
            </div>
            <label>
              <span>Ext anahtar kelimesi</span>
              <input
                value={settings.general.extPrefixKeyword}
                onChange={(event) => updateGeneral('extPrefixKeyword', event.target.value)}
                placeholder="EXT"
              />
            </label>
            <label>
              <span>2. yazici yonlendirme anahtari</span>
              <input
                value={settings.general.printer2MirrorKeyword}
                onChange={(event) => updateGeneral('printer2MirrorKeyword', event.target.value)}
                placeholder="P2"
              />
            </label>
          </section>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Font ve Yerlesim</h2>
          <span className="pill neutral">{settings.general.previewPaperWidth} mm</span>
        </div>
        <div className="settings-surface-grid">
          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Tipografi</h3>
              <p className="settings-subcard-copy">Onizleme fontu ve satir yapisi</p>
            </div>
            <label>
              <span>Font stili</span>
              <select
                value={settings.general.previewFontFamily}
                onChange={(event) => updateGeneral('previewFontFamily', event.target.value)}
              >
                {fontPresets.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="two-col">
              <label>
                <span>Font boyutu</span>
                <input
                  type="number"
                  min={8}
                  value={settings.general.previewFontSize}
                  onChange={(event) => updateGeneral('previewFontSize', Number(event.target.value))}
                />
              </label>
              <label>
                <span>Satir yuksekligi</span>
                <input
                  type="number"
                  min={1}
                  step={0.05}
                  value={settings.general.previewLineHeight}
                  onChange={(event) => updateGeneral('previewLineHeight', Number(event.target.value))}
                />
              </label>
            </div>
            <div className="two-col">
              <label>
                <span>Harf araligi</span>
                <input
                  type="number"
                  min={-0.5}
                  max={3}
                  step={0.1}
                  value={settings.general.previewLetterSpacing}
                  onChange={(event) => updateGeneral('previewLetterSpacing', Number(event.target.value))}
                />
              </label>
              <label>
                <span>Varsayilan kagit genisligi (mm)</span>
                <input
                  type="number"
                  min={58}
                  value={settings.general.previewPaperWidth}
                  onChange={(event) => updateGeneral('previewPaperWidth', Number(event.target.value))}
                />
              </label>
            </div>
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Kaydet</h3>
              <p className="settings-subcard-copy">Bu ayarlari fis onizleme ve ciktiya uygula</p>
            </div>
            <div className="hint-box">
              Font, satir ve kagit ayarlari onizleme ekraninda dogrudan gorunur ve secili yaziciya gore etkilenir.
            </div>
            <div className="action-row">
              <button onClick={saveSettings}>Fis Ayarlarini Kaydet</button>
            </div>
          </section>
        </div>
      </section>
    </div>
  )

  const renderPreviewTab = () => (
    <div className="preview-layout">
      <section className="card preview-editor">
        <div className="card-header">
          <h2>Dosya ve Yazici Onizleme</h2>
          <span className="pill neutral">{previewSource === 'file' ? 'Dosya' : 'Manuel'}</span>
        </div>
        <div className="settings-surface-grid">
          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Kaynak</h3>
              <p className="settings-subcard-copy">Manuel metin veya dosya ile calisma</p>
            </div>
            <div className="segmented-row preview-source-switch">
              <button
                className={previewSource === 'manual' ? 'preview-mode-chip active' : 'preview-mode-chip'}
                onClick={() => setPreviewSource('manual')}
                type="button"
              >
                <span className="preview-mode-chip-title">Manuel Metin</span>
                <span className="preview-mode-chip-meta">Elle test siparisi</span>
              </button>
              <button
                className={previewSource === 'file' ? 'preview-mode-chip active' : 'preview-mode-chip'}
                onClick={() => setPreviewSource('file')}
                type="button"
              >
                <span className="preview-mode-chip-title">Dosya Onizleme</span>
                <span className="preview-mode-chip-meta">Gercek cikti dosyasi</span>
              </button>
            </div>
            <label>
              <span>Onizleme yazicisi</span>
              <select value={selectedPrinter?.id ?? ''} onChange={(event) => setSelectedPrinterId(event.target.value)}>
                {settings.printers.map((printer) => (
                  <option key={printer.id} value={printer.id}>
                    {printer.printerNo} - {printer.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="device-inline-meta">
              <span>Kagit: {selectedPrinter?.paperWidth ?? settings.general.previewPaperWidth} mm</span>
              <span>Windows: {selectedPrinter?.windowsPrinterName || '-'}</span>
            </div>
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Hazir Stiller</h3>
              <p className="settings-subcard-copy">Hizli stil secimi ve onizleme varyasyonlari</p>
            </div>
            <div className="preset-grid">
              {receiptStylePresets.map((preset) => (
                <button
                  key={preset.key}
                  className="secondary preset-button"
                  onClick={() => applyReceiptStylePreset(preset.key)}
                  type="button"
                >
                  <strong>{preset.label}</strong>
                  <span>{preset.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Yazici ve Tipografi</h3>
              <p className="settings-subcard-copy">Font, olcek ve yaziciya gore onizleme</p>
            </div>
            <div className="two-col">
              <label>
                <span>Font boyutu</span>
                <input
                  type="number"
                  min={8}
                  value={settings.general.previewFontSize}
                  onChange={(event) => updateGeneral('previewFontSize', Number(event.target.value))}
                />
              </label>
              <label>
                <span>Font carpani</span>
                <input
                  type="number"
                  min={0.5}
                  step={0.1}
                  value={selectedPrinter?.fontScale ?? 1}
                  onChange={(event) => selectedPrinter && updatePrinter(selectedPrinter.id, { fontScale: Number(event.target.value) })}
                />
              </label>
            </div>
            <div className="two-col">
              <label>
                <span>Font stili</span>
                <select
                  value={settings.general.previewFontFamily}
                  onChange={(event) => updateGeneral('previewFontFamily', event.target.value)}
                >
                  {fontPresets.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Satir yuksekligi</span>
                <input
                  type="number"
                  min={1}
                  step={0.05}
                  value={settings.general.previewLineHeight}
                  onChange={(event) => updateGeneral('previewLineHeight', Number(event.target.value))}
                />
              </label>
            </div>
            <div className="two-col">
              <label>
                <span>Harf araligi</span>
                <input
                  type="number"
                  min={-0.5}
                  max={3}
                  step={0.1}
                  value={settings.general.previewLetterSpacing}
                  onChange={(event) => updateGeneral('previewLetterSpacing', Number(event.target.value))}
                />
              </label>
              <label>
                <span>Kagit genisligi</span>
                <input
                  type="number"
                  min={58}
                  value={selectedPrinter?.paperWidth ?? settings.general.previewPaperWidth}
                  onChange={(event) => selectedPrinter && updatePrinter(selectedPrinter.id, { paperWidth: Number(event.target.value) })}
                />
              </label>
            </div>
            <div className="two-col">
              <label>
                <span>Windows yazicisi</span>
                <select
                  value={selectedPrinter?.windowsPrinterName ?? ''}
                  onChange={(event) => selectedPrinter && updatePrinter(selectedPrinter.id, { windowsPrinterName: event.target.value })}
                >
                  <option value="">Seciniz</option>
                  {systemPrinters.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Stil aciklamasi</span>
                <input value="Basliklar buyuk, urunler kalin, extra satirlari girintili gorunur" readOnly />
              </label>
            </div>
          </section>

          {previewSource === 'file' ? (
            <section className="settings-subcard">
              <div className="settings-subcard-header">
                <h3 className="settings-subcard-title">Dosya Akisi</h3>
                <p className="settings-subcard-copy">Onizleme dosyasi ve ham icerik</p>
              </div>
              <label>
                <span>Onizleme dosyasi</span>
                <input value={previewFilePath} onChange={(event) => setPreviewFilePath(event.target.value)} placeholder="C:/FastRest/Printer/SIPARIS.3" />
              </label>
              <div className="action-row">
                <button onClick={choosePreviewFile}>Dosya Sec</button>
                <button onClick={loadPreviewFile}>Dosyayi Yukle</button>
                <button onClick={saveSettings}>Ayarlari Kaydet</button>
                <button
                  className="secondary"
                  onClick={() => {
                    setPreviewSource('manual')
                    setFilePreview(null)
                  }}
                >
                  Manuel Moda Don
                </button>
              </div>
              <label>
                <span>Ham dosya icerigi</span>
                <textarea value={filePreview?.rawContent ?? ''} readOnly rows={10} />
              </label>
            </section>
          ) : (
            <section className="settings-subcard">
              <div className="settings-subcard-header">
                <h3 className="settings-subcard-title">Manuel Test</h3>
                <p className="settings-subcard-copy">Yazdirmadan once metin ve duzen kontrolu</p>
              </div>
              <label>
                <span>Test Siparisi Metni</span>
                <textarea value={previewText} onChange={(event) => setPreviewText(event.target.value)} rows={18} />
              </label>
              <div className="hint-box">
                Bu alan, font boyutu ve kagit genisligi gibi ayarlari yazdirmadan once kontrol etmek icindir.
              </div>
            </section>
          )}
        </div>
      </section>

      <section className="card preview-stage">
        <div className="card-header">
          <h2>Fis Onizleme</h2>
          <span className="pill neutral">{selectedPrinter?.name ?? 'Yazici secilmedi'}</span>
        </div>
        <div className="meta-row preview-meta">
          <span>Kaynak: {previewSource === 'file' ? 'Dosya' : 'Manuel Metin'}</span>
          <span>Yazici: {selectedPrinter?.name ?? '-'}</span>
          <span>Dosya: {previewData.sourceFile}</span>
        </div>
        <div
          className={`receipt-frame style-${settings.general.previewStylePreset || 'fastrest'}`}
          style={{
            width: `${selectedPrinter?.paperWidth ?? settings.general.previewPaperWidth}mm`,
            fontFamily: settings.general.previewFontFamily,
            ['--dynamic-option-scale' as string]: String(settings.general.dynamicOptionFontScale),
            ['--dynamic-option-line-height' as string]: String(settings.general.dynamicOptionLineHeight),
            ['--dynamic-option-indent' as string]: String(settings.general.dynamicOptionIndent),
            ['--dynamic-option-opacity' as string]: String(settings.general.dynamicOptionOpacity),
          }}
        >
          <div
            className="receipt-lines"
            style={{
              fontSize: `${settings.general.previewFontSize * (selectedPrinter?.fontScale ?? 1)}px`,
              lineHeight: settings.general.previewLineHeight,
              letterSpacing: `${settings.general.previewLetterSpacing}px`,
            }}
          >
            {styledPreviewLines.map((line, index) => (
              <div
                key={`${index}-${line.text}`}
                className={`receipt-line receipt-line-${line.kind}${line.modifierMode ? ` receipt-line-modifier-${line.modifierMode}` : ''}`}
              >
                {line.orderSequence ? <span className="receipt-line-number-badge">{line.orderSequence}</span> : null}
                <span className={`receipt-line-text${line.kind === 'itemLine' ? ' receipt-line-main-text' : ''}`}>
                  {line.displayText || line.text || '\u00A0'}
                </span>
                {line.kind === 'itemLine' && line.trailingText ? (
                  <span className="receipt-line-trailing-text">{line.trailingText}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )

  const renderIngenicoTab = () => (
    <div className="panel-grid">
      <section className="card">
        <div className="card-header">
          <h2>Ingenico Ayarlari</h2>
          <span className={`pill ${settings.ingenico.enabled ? 'success' : 'ignored'}`}>
            {settings.ingenico.enabled ? 'Etkin' : 'Kapali'}
          </span>
        </div>
        <div className="settings-surface-grid">
          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Runtime</h3>
              <p className="settings-subcard-copy">Worker ve GMP runtime klasorleri</p>
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.ingenico.enabled}
                onChange={(event) => updateIngenico('enabled', event.target.checked)}
              />
              <span>Ingenico entegrasyonunu etkinlestir</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.ingenico.allowMockFallback}
                onChange={(event) => updateIngenico('allowMockFallback', event.target.checked)}
              />
              <span>Cihaz yoksa mock fallback izni ver</span>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.ingenico.autoConfigureRuntime}
                onChange={(event) => updateIngenico('autoConfigureRuntime', event.target.checked)}
              />
              <span>GMP.XML ayarlarini worker tarafinda otomatik guncelle</span>
            </label>
            <label>
              <span>Worker exe yolu</span>
              <input
                value={settings.ingenico.workerExecutablePath}
                onChange={(event) => updateIngenico('workerExecutablePath', event.target.value)}
                placeholder="C:/PrintServer/ingenico-worker/IngenicoWorker.exe"
              />
            </label>
            <label>
              <span>Runtime klasoru</span>
              <input
                value={settings.ingenico.runtimeDirectory}
                onChange={(event) => updateIngenico('runtimeDirectory', event.target.value)}
                placeholder="C:/PrintServer/ingenico-runtime"
              />
            </label>
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Baglanti</h3>
              <p className="settings-subcard-copy">Terminal baglanti modu ve adres bilgileri</p>
            </div>
            <div className="two-col">
              <label>
                <span>Baglanti modu</span>
                <select
                  value={settings.ingenico.connectionMode}
                  onChange={(event) => updateIngenico('connectionMode', event.target.value as AppSettings['ingenico']['connectionMode'])}
                >
                  <option value="tcp">TCP/IP</option>
                  <option value="serial">Serial / COM</option>
                </select>
              </label>
              <label>
                <span>Interface ID</span>
                <input
                  value={settings.ingenico.interfaceId}
                  onChange={(event) => updateIngenico('interfaceId', event.target.value)}
                  placeholder="PRINTSERVER01"
                />
              </label>
            </div>
            {settings.ingenico.connectionMode === 'tcp' ? (
              <div className="two-col">
                <label>
                  <span>IP adresi</span>
                  <input
                    value={settings.ingenico.ipAddress}
                    onChange={(event) => updateIngenico('ipAddress', event.target.value)}
                    placeholder="192.168.1.10"
                  />
                </label>
                <label>
                  <span>Port</span>
                  <input
                    type="number"
                    value={settings.ingenico.port}
                    onChange={(event) => updateIngenico('port', Number(event.target.value))}
                  />
                </label>
              </div>
            ) : (
              <div className="two-col">
                <label>
                  <span>COM Port</span>
                  <input
                    value={settings.ingenico.portName}
                    onChange={(event) => updateIngenico('portName', event.target.value)}
                    placeholder="\\\\.\\COM5"
                  />
                </label>
                <label>
                  <span>Baud rate</span>
                  <input
                    type="number"
                    value={settings.ingenico.baudRate}
                    onChange={(event) => updateIngenico('baudRate', Number(event.target.value))}
                  />
                </label>
              </div>
            )}
            <div className="two-col">
              <label>
                <span>Default timeout</span>
                <input
                  type="number"
                  value={settings.ingenico.defaultTimeoutMs}
                  onChange={(event) => updateIngenico('defaultTimeoutMs', Number(event.target.value))}
                />
              </label>
              <label>
                <span>Kart timeout</span>
                <input
                  type="number"
                  value={settings.ingenico.cardTimeoutMs}
                  onChange={(event) => updateIngenico('cardTimeoutMs', Number(event.target.value))}
                />
              </label>
            </div>
          </section>
        </div>
        <div className="action-row">
          <button onClick={saveSettings}>Ingenico Ayarlarini Kaydet</button>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Ingenico Islem Ekrani</h2>
          <span className={`pill ${ingenicoResult?.isSuccess ? 'success' : ingenicoResult ? 'error' : 'ignored'}`}>
            {ingenicoResult ? (ingenicoResult.isMock ? 'Mock' : ingenicoResult.isSuccess ? 'Basarili' : 'Hatali') : 'Bos'}
          </span>
        </div>
        <div className="settings-surface-grid">
          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Kontroller</h3>
              <p className="settings-subcard-copy">Baglanti, precheck ve pairing operasyonlari</p>
            </div>
            <div className="action-row">
              <button onClick={testIngenicoConnection}>Baglanti Testi</button>
              <button onClick={runIngenicoPrecheck}>Precheck</button>
              <button onClick={startIngenicoPairing}>Pairing</button>
              <button className="secondary" onClick={cancelIngenicoPayment}>Iptal</button>
            </div>
            <div className="hint-box">
              Kiosk projesindeki modele gore bu ekran once worker, runtime ve GMP.XML dogrulamasini yapar.
            </div>
            {settings.ingenico.allowMockFallback ? (
              <div className="hint-box">
                Mock fallback acik. Windows, worker veya runtime eksiginde sistem test amacli sahte Ingenico sonucu dondurebilir.
              </div>
            ) : null}
          </section>

          <section className="settings-subcard">
            <div className="settings-subcard-header">
              <h3 className="settings-subcard-title">Test Odemesi</h3>
              <p className="settings-subcard-copy">Manuel odeme tetikleme ve referans bilgisi</p>
            </div>
            <label>
              <span>Test odeme tutari</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={ingenicoPaymentAmount}
                onChange={(event) => setIngenicoPaymentAmount(Number(event.target.value))}
              />
            </label>
            <label>
              <span>Musteri referansi</span>
              <input
                value={ingenicoCustomerReference}
                onChange={(event) => setIngenicoCustomerReference(event.target.value)}
                placeholder="RDA-001"
              />
            </label>
            <div className="action-row">
              <button onClick={sendIngenicoPayment}>Ornek Odeme Gonder</button>
            </div>
          </section>
        </div>
        <section className="result-box settings-subcard">
          <div className="card-header">
            <h2>Sonuc</h2>
            <span className={`pill ${ingenicoResult?.isSuccess ? 'success' : ingenicoResult ? 'error' : 'ignored'}`}>
              {ingenicoResult ? (ingenicoResult.isMock ? 'Mock' : ingenicoResult.isSuccess ? 'Basarili' : 'Hatali') : 'Bos'}
            </span>
          </div>
          <p>{ingenicoResult?.message ?? 'Henuz Ingenico islemi calistirilmadi.'}</p>
          <div className="meta-row">
            <span>Operasyon: {ingenicoResult?.operation ?? '-'}</span>
            <span>Hazir: {ingenicoResult?.isReady ? 'Evet' : ingenicoResult ? 'Hayir' : '-'}</span>
            <span>Sure: {ingenicoResult?.durationMs ? `${ingenicoResult.durationMs} ms` : '-'}</span>
          </div>
          {ingenicoResult ? (
            <div className="meta-row">
              <span>Mod: {ingenicoResult.isMock ? 'Mock' : 'Native'}</span>
              <span>Referans: {ingenicoResult.customerReference ?? '-'}</span>
              <span>Fis/Order: {ingenicoResult.orderNumber ?? '-'}</span>
            </div>
          ) : null}
          {ingenicoResult?.details ? <div className="code-block">{ingenicoResult.details}</div> : null}
        </section>
      </section>
    </div>
  )

  const renderDevicesTab = () => (
    <div className="stack">
      <section className="card">
        <h2>Cihazlar</h2>
        <p className="muted">
          Bu alan, satis programi icindeki <code>Ayarlar &gt; Cihazlar</code> bolumune uygun olacak sekilde yazici,
          Ingenico ve lokal bridge ayarlarini tek yerde toplar.
        </p>
        <div className="action-row">
          <button onClick={saveSettings}>Cihaz Ayarlarini Kaydet</button>
          <button className="secondary" onClick={refreshSystemPrinters}>Windows Yazicilarini Yenile</button>
          <button className="secondary" onClick={testIngenicoConnection}>Ingenico Testi</button>
        </div>
      </section>
      <section className="device-overview-grid">
        <button
          type="button"
          className={deviceSection === 'yazicilar' ? 'card device-summary-card active-summary' : 'card device-summary-card'}
          onClick={() => setDeviceSection('yazicilar')}
        >
          <div className="device-summary-top">
            <div className="device-summary-title-row">
              <span className="device-summary-kicker">Cihaz</span>
              <span className={`pill ${activePrinterCount > 0 ? 'success' : 'error'}`}>
                {activePrinterCount}/{settings.printers.length}
              </span>
            </div>
            <h2 className="device-summary-name">Yazicilar</h2>
            <p className="device-summary-copy">{activePrinterCount > 0 ? 'Aktif yazici tanimli.' : 'Aktif yazici bulunmuyor.'}</p>
          </div>
          <div className="device-summary-stats">
            <div className="device-stat-block">
              <span>Secili</span>
              <strong>{selectedPrinter?.name ?? '-'}</strong>
            </div>
            <div className="device-stat-block">
              <span>Windows liste</span>
              <strong>{systemPrinters.length}</strong>
            </div>
          </div>
          <div className="device-summary-footer">Yazici listesi, secili cihaz ve durumlar</div>
        </button>

        <button
          type="button"
          className={deviceSection === 'ingenico' ? 'card device-summary-card active-summary' : 'card device-summary-card'}
          onClick={() => setDeviceSection('ingenico')}
        >
          <div className="device-summary-top">
            <div className="device-summary-title-row">
              <span className="device-summary-kicker">Odeme</span>
              <span className={`pill ${settings.ingenico.enabled ? 'success' : 'ignored'}`}>
                {settings.ingenico.enabled ? 'Acik' : 'Kapali'}
              </span>
            </div>
            <h2 className="device-summary-name">Ingenico</h2>
            <p className="device-summary-copy">
              {settings.ingenico.enabled ? 'Odeme cihazi entegrasyonu hazir.' : 'Ingenico entegrasyonu devre disi.'}
            </p>
          </div>
          <div className="device-summary-stats">
            <div className="device-stat-block">
              <span>Baglanti</span>
              <strong>{settings.ingenico.connectionMode.toUpperCase()}</strong>
            </div>
            <div className="device-stat-block">
              <span>Hedef</span>
              <strong>{ingenicoConnectionLabel}</strong>
            </div>
          </div>
          <div className="device-summary-footer">Pairing, test ve odeme operasyonlari</div>
        </button>

        <button
          type="button"
          className={deviceSection === 'bridge' ? 'card device-summary-card active-summary' : 'card device-summary-card'}
          onClick={() => setDeviceSection('bridge')}
        >
          <div className="device-summary-top">
            <div className="device-summary-title-row">
              <span className="device-summary-kicker">Servis</span>
              <span className={`pill ${settings.bridge.enabled ? 'success' : 'ignored'}`}>
                {settings.bridge.enabled ? 'Acik' : 'Kapali'}
              </span>
            </div>
            <h2 className="device-summary-name">Bridge</h2>
            <p className="device-summary-copy">
              {settings.bridge.enabled ? 'Yerel API yayinda olacak sekilde hazir.' : 'Bridge katmani kapali.'}
            </p>
          </div>
          <div className="device-summary-stats">
            <div className="device-stat-block">
              <span>Adres</span>
              <strong>{bridgeAddressLabel}</strong>
            </div>
            <div className="device-stat-block">
              <span>Guvenlik</span>
              <strong>{settings.bridge.authRequired ? 'Token' : 'Acik'}</strong>
            </div>
            <div className="device-stat-block">
              <span>Auto HB</span>
              <strong>{bridgeRuntime?.autoHeartbeatScheduled ? 'Planli' : 'Yok'}</strong>
            </div>
            <div className="device-stat-block">
              <span>Kayit</span>
              <strong>{bridgeRuntime?.terminalRegistration.registrationStatus ?? settings.terminalRegistration.registrationStatus}</strong>
            </div>
          </div>
          <div className="device-summary-footer">HTTP bridge, token ve heartbeat scheduler</div>
        </button>

        <button
          type="button"
          className={deviceSection === 'tani' ? 'card device-summary-card active-summary' : 'card device-summary-card'}
          onClick={() => setDeviceSection('tani')}
        >
          <div className="device-summary-top">
            <div className="device-summary-title-row">
              <span className="device-summary-kicker">Kontrol</span>
              <span className={`pill ${printerDiagnostics ? 'success' : 'ignored'}`}>
                {printerDiagnostics ? 'Hazir' : 'Bos'}
              </span>
            </div>
            <h2 className="device-summary-name">Tani</h2>
            <p className="device-summary-copy">Yazici tespiti ve bridge durumu ayni panelden kontrol edilir.</p>
          </div>
          <div className="device-summary-stats">
            <div className="device-stat-block">
              <span>Yontem</span>
              <strong>{printerDiagnostics?.results.length ?? 0}</strong>
            </div>
            <div className="device-stat-block">
              <span>Bridge kayit</span>
              <strong>{bridgeRuntime?.requestCount ?? 0}</strong>
            </div>
          </div>
          <div className="device-summary-footer">Hata ayiklama ve cihaz tespiti ekranlari</div>
        </button>

        <button
          type="button"
          className={deviceSection === 'loglar' ? 'card device-summary-card active-summary' : 'card device-summary-card'}
          onClick={() => setDeviceSection('loglar')}
        >
          <div className="device-summary-top">
            <div className="device-summary-title-row">
              <span className="device-summary-kicker">Kayit</span>
              <span className={`pill ${runtimeState.recentJobs.length > 0 || (bridgeRuntime?.recentRequests.length ?? 0) > 0 ? 'success' : 'ignored'}`}>
                {runtimeState.recentJobs.length + (bridgeRuntime?.recentRequests.length ?? 0)}
              </span>
            </div>
            <h2 className="device-summary-name">Loglar</h2>
            <p className="device-summary-copy">Yazdirma islemleri ve bridge request hareketi birlikte izlenir.</p>
          </div>
          <div className="device-summary-stats">
            <div className="device-stat-block">
              <span>Fis logu</span>
              <strong>{runtimeState.recentJobs.length}</strong>
            </div>
            <div className="device-stat-block">
              <span>Bridge logu</span>
              <strong>{bridgeRuntime?.recentRequests.length ?? 0}</strong>
            </div>
          </div>
          <div className="device-summary-footer">Son hareketler ve request izleme kayitlari</div>
        </button>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Cihaz Bolumleri</h2>
          <button type="button" className="secondary" onClick={() => setDeviceSection('ozet')}>
            Ozete Don
          </button>
        </div>
        <div className="segmented-row device-section-switcher">
          <button
            type="button"
            className={deviceSection === 'ozet' ? 'device-section-chip active' : 'device-section-chip'}
            onClick={() => setDeviceSection('ozet')}
          >
            <span className="device-section-chip-title">Ozet</span>
            <span className="device-section-chip-meta">Tum cihaz durumu</span>
          </button>
          <button
            type="button"
            className={deviceSection === 'yazicilar' ? 'device-section-chip active' : 'device-section-chip'}
            onClick={() => setDeviceSection('yazicilar')}
          >
            <span className="device-section-chip-title">Yazicilar</span>
            <span className="device-section-chip-meta">Baski cihazlari</span>
          </button>
          <button
            type="button"
            className={deviceSection === 'ingenico' ? 'device-section-chip active' : 'device-section-chip'}
            onClick={() => setDeviceSection('ingenico')}
          >
            <span className="device-section-chip-title">Ingenico</span>
            <span className="device-section-chip-meta">Odeme terminali</span>
          </button>
          <button
            type="button"
            className={deviceSection === 'bridge' ? 'device-section-chip active' : 'device-section-chip'}
            onClick={() => setDeviceSection('bridge')}
          >
            <span className="device-section-chip-title">Bridge</span>
            <span className="device-section-chip-meta">Lokal API</span>
          </button>
          <button
            type="button"
            className={deviceSection === 'tani' ? 'device-section-chip active' : 'device-section-chip'}
            onClick={() => {
              void loadPrinterDiagnostics()
              void loadBridgeRuntime()
              setDeviceSection('tani')
            }}
          >
            <span className="device-section-chip-title">Tani</span>
            <span className="device-section-chip-meta">Kontrol paneli</span>
          </button>
          <button
            type="button"
            className={deviceSection === 'loglar' ? 'device-section-chip active' : 'device-section-chip'}
            onClick={() => {
              void loadBridgeRuntime()
              setDeviceSection('loglar')
            }}
          >
            <span className="device-section-chip-title">Loglar</span>
            <span className="device-section-chip-meta">Hareket kaydi</span>
          </button>
        </div>

        {deviceSection === 'ozet' ? (
          <div className="device-detail-stack">
            <div className="hint-box">
              Bu alan satis programindaki <code>Ayarlar &gt; Cihazlar</code> panelinin gomulu versiyonu gibi davranir.
              Yazici, odeme ve lokal bridge ayarlari ayni akista tutulur.
            </div>
            <div className="panel-grid">
              <section className="card">
                <h2>Yazici Ozeti</h2>
                <p>Toplam cihaz: {settings.printers.length}</p>
                <p>Aktif cihaz: {activePrinterCount}</p>
                <p>Onizleme yazicisi: {selectedPrinter?.name ?? '-'}</p>
                <button type="button" className="secondary" onClick={() => setDeviceSection('yazicilar')}>
                  Yazici Detaylarini Ac
                </button>
              </section>
              <section className="card">
                <h2>Ingenico Ozeti</h2>
                <p>Durum: {settings.ingenico.enabled ? 'Etkin' : 'Pasif'}</p>
                <p>Baglanti: {settings.ingenico.connectionMode.toUpperCase()}</p>
                <p>Hedef: {ingenicoConnectionLabel}</p>
                <button type="button" className="secondary" onClick={() => setDeviceSection('ingenico')}>
                  Ingenico Detaylarini Ac
                </button>
              </section>
              <section className="card">
                <h2>Bridge Ozeti</h2>
                <p>Durum: {settings.bridge.enabled ? 'Etkin' : 'Pasif'}</p>
                <p>Adres: {bridgeAddressLabel}</p>
                <p>Guvenlik: {settings.bridge.authRequired ? 'Token korumali' : 'Acik erisim'}</p>
                <p>Terminal: {bridgeRuntime?.terminalIdentity.terminalName ?? settings.terminalIdentity.terminalName}</p>
                <p>Kayit: {bridgeRuntime?.terminalRegistration.registrationStatus ?? settings.terminalRegistration.registrationStatus}</p>
                <button type="button" className="secondary" onClick={() => setDeviceSection('bridge')}>
                  Bridge Detaylarini Ac
                </button>
              </section>
              <section className="card">
                <h2>Tani ve Log</h2>
                <p>Yazici tani sonucu: {printerDiagnostics ? `${printerDiagnostics.results.length} yontem` : 'Henuz alinmadi'}</p>
                <p>Bridge request sayisi: {bridgeRuntime?.requestCount ?? 0}</p>
                <p>Fis log sayisi: {runtimeState.recentJobs.length}</p>
                <div className="action-row">
                  <button type="button" className="secondary" onClick={() => {
                    void loadPrinterDiagnostics()
                    void loadBridgeRuntime()
                    setDeviceSection('tani')
                  }}>
                    Tani Panelini Ac
                  </button>
                  <button type="button" className="secondary" onClick={() => {
                    void loadBridgeRuntime()
                    setDeviceSection('loglar')
                  }}>
                    Loglari Ac
                  </button>
                </div>
              </section>
            </div>
          </div>
        ) : null}

        {deviceSection === 'yazicilar' ? <div className="device-detail-stack">{renderPrintersTab()}</div> : null}
        {deviceSection === 'ingenico' ? <div className="device-detail-stack">{renderIngenicoTab()}</div> : null}
        {deviceSection === 'bridge' ? <div className="device-detail-stack">{renderBridgeSettingsCard()}</div> : null}
        {deviceSection === 'tani' ? <div className="device-detail-stack">{renderDiagnosticsTab()}</div> : null}
        {deviceSection === 'loglar' ? <div className="device-detail-stack">{renderLogsTab()}</div> : null}
      </section>
    </div>
  )

  const renderLogsTab = () => (
    <div className="stack">
      <section className="card">
        <div className="card-header">
          <h2>Bridge Hareketi</h2>
          <button onClick={() => void loadBridgeRuntime()}>Bridge Loglarini Yenile</button>
        </div>
        {bridgeRuntime?.recentRequests.length ? (
          bridgeRuntime.recentRequests.map((item: BridgeRequestLogItem) => (
            <div key={item.id} className="code-block">
              {`${item.method} ${item.path}  [${item.statusCode}]  ${item.authMode}  ${item.clientIp}\n${new Date(item.createdAt).toLocaleString('tr-TR')}`}
            </div>
          ))
        ) : (
          <p>Henuz bridge istegi kaydi yok.</p>
        )}
      </section>

      {runtimeState.recentJobs.length === 0 ? (
        <section className="card">
          <h2>Islem Kaydi</h2>
          <p>Henuz bir dosya islenmedi.</p>
        </section>
      ) : (
        runtimeState.recentJobs.map((job: PrintJobLog) => (
          <section key={job.id} className="card log-card">
            <div className="card-header">
              <h2>{job.fileName}</h2>
              <span className={`pill ${job.status}`}>{job.status}</span>
            </div>
            <p>{job.message}</p>
            <div className="meta-row">
              <span>Yazici No: {job.printerNo ?? '-'}</span>
              <span>Yazici: {job.printerName ?? '-'}</span>
              <span>{new Date(job.createdAt).toLocaleString('tr-TR')}</span>
            </div>
          </section>
        ))
      )}
    </div>
  )

  const renderDiagnosticsTab = () => (
    <div className="stack">
      <section className="card">
        <div className="card-header">
          <h2>Yazici Tani Ekrani</h2>
          <button onClick={() => {
            void loadPrinterDiagnostics()
            void loadBridgeRuntime()
          }}>Taniyi Yenile</button>
        </div>
        <p className="muted">
          Burada Windows yazicilarinin hangi yontemle bulunabildigini gorebilirsiniz.
        </p>
        <p>Platform: {printerDiagnostics?.platform ?? '-'}</p>
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Bridge Durumu</h2>
          <button onClick={() => void loadBridgeRuntime()}>Bridge Durumunu Yenile</button>
        </div>
        <p>Durum: {settings.bridge.enabled ? 'Etkin' : 'Pasif'}</p>
        <p>Adres: {bridgeAddressLabel}</p>
        <p>Auth: {bridgeRuntime?.authRequired ? 'Token korumali' : 'Acik'}</p>
        <p>Request limiti: {bridgeRuntime?.requestLogLimit ?? settings.bridge.requestLogLimit}</p>
        <p>Log sayisi: {bridgeRuntime?.requestCount ?? 0}</p>
        <p>Auto heartbeat: {bridgeRuntime?.autoHeartbeatScheduled ? 'Planli' : 'Planli degil'}</p>
        <p>Heartbeat islem durumu: {bridgeRuntime?.autoHeartbeatRunning ? 'Calisiyor' : 'Bos'}</p>
        <p>Sube: {bridgeRuntime?.terminalIdentity.branchName ?? settings.terminalIdentity.branchName}</p>
        <p>Terminal: {bridgeRuntime?.terminalIdentity.terminalName ?? settings.terminalIdentity.terminalName}</p>
        <p>Kayit: {bridgeRuntime?.terminalRegistration.registrationStatus ?? settings.terminalRegistration.registrationStatus}</p>
      </section>

      {printerDiagnostics?.results.map((result) => (
        <section key={result.method} className="card">
          <div className="card-header">
            <h2>{result.method}</h2>
            <span className={`pill ${result.printers.length > 0 ? 'success' : result.success ? 'ignored' : 'error'}`}>
              {result.printers.length > 0 ? `${result.printers.length} yazici` : result.success ? 'Bos sonuc' : 'Hata'}
            </span>
          </div>
          {result.error ? <p>{result.error}</p> : null}
          {result.printers.length > 0 ? (
            <div className="code-block">
              {result.printers.join('\n')}
            </div>
          ) : (
            <div className="code-block">Yazici donmedi.</div>
          )}
        </section>
      ))}

      {!printerDiagnostics ? (
        <section className="card">
          <p>Henuz tani verisi alinmadi. `Taniyi Yenile` butonuna basin.</p>
        </section>
      ) : null}
    </div>
  )

  return (
    <div className="app-root">
      {!startupUnlocked ? (
        <div className="startup-lock">
          <section className="startup-lock-card">
            <p className="eyebrow">Gunluk Giris</p>
            <h1>Cihaz Servisi</h1>
            <p className="muted">Programi acmak icin gunluk sifreyi girin.</p>
            <label>
              <span>Gunluk sifre</span>
              <input
                type="password"
                value={startupPassword}
                onChange={(event) => {
                  setStartupPassword(event.target.value)
                  if (startupPasswordError) {
                    setStartupPasswordError('')
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    unlockStartupScreen()
                  }
                }}
                autoFocus
              />
            </label>
            {startupPasswordError ? <p className="startup-lock-error">{startupPasswordError}</p> : null}
            <button type="button" onClick={unlockStartupScreen}>Giris Yap</button>
          </section>
        </div>
      ) : (
        <div className="app-shell">
          <aside className="sidebar">
            <div className="sidebar-top">
              <div className="sidebar-toolbar">
                <span className="sidebar-tool-pill">PS</span>
                <span className="sidebar-tool-text">#{settings.terminalIdentity.terminalCode}</span>
                <span className="sidebar-tool-text">{sidebarSessionLabel}</span>
                <span className="sidebar-tool-pill">TR</span>
              </div>

              <section className="sidebar-panel sidebar-brand-panel">
                <p className="eyebrow">FASTREST POS</p>
                <h1>Cihazlar</h1>
                <p className="sidebar-panel-copy">Yazdirma, bridge ve odeme ayarlari</p>
                <div className="sidebar-chip-row">
                  <span className={`sidebar-chip ${desktopReady ? 'is-live' : ''}`}>
                    {desktopReady ? 'Desktop Hazir' : 'Tarayici Modu'}
                  </span>
                  <span className="sidebar-chip">{registrationStatusLabel}</span>
                </div>
              </section>

              <section className="sidebar-panel sidebar-ticket-panel">
                <div className="sidebar-panel-heading">
                  <span>Aktif Bolum</span>
                  <strong>{activeTabLabel}</strong>
                </div>
                <div className="sidebar-metric-row">
                  <span>Terminal</span>
                  <strong>{terminalCodeLabel}</strong>
                </div>
                <div className="sidebar-metric-row">
                  <span>Aktif Yazici</span>
                  <strong>{activePrinterCount}</strong>
                </div>
                <div className="sidebar-metric-row">
                  <span>Bridge</span>
                  <strong>{settings.bridge.enabled ? 'Acik' : 'Kapali'}</strong>
                </div>
                <div className="sidebar-metric-row">
                  <span>Watcher</span>
                  <strong>{runtimeState.watcherRunning ? 'Aktif' : 'Bos'}</strong>
                </div>
              </section>

              <nav className="tab-list tab-list-pos">
                <button className={tab === 'genel' ? 'tab active' : 'tab'} onClick={() => setTab('genel')}>
                  <span className="tab-title">Genel</span>
                  <span className="tab-meta">Terminal ve kayit</span>
                </button>
                <button className={tab === 'fis' ? 'tab active' : 'tab'} onClick={() => setTab('fis')}>
                  <span className="tab-title">Fis</span>
                  <span className="tab-meta">Stil ve baski</span>
                </button>
                <button className={tab === 'cihazlar' ? 'tab active' : 'tab'} onClick={() => setTab('cihazlar')}>
                  <span className="tab-title">Cihazlar</span>
                  <span className="tab-meta">Yazici, bridge, Ingenico</span>
                </button>
                <button className={tab === 'onizleme' ? 'tab active' : 'tab'} onClick={() => setTab('onizleme')}>
                  <span className="tab-title">Onizleme</span>
                  <span className="tab-meta">Test ve gorunum</span>
                </button>
              </nav>
            </div>

            <section className="sidebar-panel sidebar-footer-panel">
              <div className="sidebar-total-row">
                <span>Toplam Durum</span>
                <strong>{statusMessage}</strong>
              </div>
              <div className="sidebar-action-grid">
                <button type="button" className="sidebar-cta sidebar-cta-light" onClick={() => setTab('genel')}>
                  Genel
                </button>
                <button type="button" className="sidebar-cta sidebar-cta-light" onClick={() => setTab('onizleme')}>
                  Test
                </button>
                <button type="button" className="sidebar-cta sidebar-cta-success" onClick={() => setTab('cihazlar')}>
                  Cihazlar
                </button>
                <button type="button" className="sidebar-cta sidebar-cta-warm" onClick={saveSettings}>
                  Kaydet
                </button>
              </div>
            </section>
          </aside>

          <main className="content">
            <div className="content-shell">
              <header className="content-topbar">
                <div className="content-hero">
                  <p className="content-kicker">{terminalDisplayLabel}</p>
                  <div className="content-hero-row">
                    <h2>{contentHeroTitle}</h2>
                    <span className="content-hero-highlight">{activeTabLabel}</span>
                  </div>
                  <p className="content-hero-copy">{contentHeroDescription}</p>
                  <div className="content-hero-meta">
                    <span className="content-meta-pill">Terminal: {terminalCodeLabel}</span>
                    <span className="content-meta-pill">Kayit: {registrationStatusLabel}</span>
                    <span className="content-meta-pill">Yazici: {activePrinterCount}</span>
                    <span className="content-meta-pill">
                      Alt bolum: {tab === 'cihazlar' ? activeDeviceSectionLabel : activeTabLabel}
                    </span>
                  </div>
                </div>

                <div className="content-toolbar">
                  <div className="content-search-shell">
                    <span className="content-search-label">Arama</span>
                    <strong>{tab === 'cihazlar' ? 'Yazici, bridge, terminal ara' : `${activeTabLabel} icinde hizli gecis`}</strong>
                  </div>
                  <button type="button" className="content-toolbar-button content-toolbar-ghost" onClick={refreshWorkspace}>
                    Yenile
                  </button>
                  <button type="button" className="content-toolbar-button content-toolbar-primary" onClick={saveSettings}>
                    Kaydet
                  </button>
                </div>
              </header>

              <div className="content-section-strip">
                {contentSectionItems.map((item) => {
                  const normalizedItem = item.toLowerCase()
                  const isActive =
                    tab === 'cihazlar'
                      ? (normalizedItem === 'ozet' && deviceSection === 'ozet') ||
                        (normalizedItem === 'yazicilar' && deviceSection === 'yazicilar') ||
                        (normalizedItem === 'ingenico' && deviceSection === 'ingenico') ||
                        (normalizedItem === 'bridge' && deviceSection === 'bridge') ||
                        (normalizedItem === 'tani' && deviceSection === 'tani') ||
                        (normalizedItem === 'loglar' && deviceSection === 'loglar')
                      : item === contentSectionItems[0]

                  const handleClick = () => {
                    if (tab !== 'cihazlar') {
                      return
                    }
                    if (normalizedItem === 'ozet') setDeviceSection('ozet')
                    if (normalizedItem === 'yazicilar') setDeviceSection('yazicilar')
                    if (normalizedItem === 'ingenico') setDeviceSection('ingenico')
                    if (normalizedItem === 'bridge') setDeviceSection('bridge')
                    if (normalizedItem === 'tani') setDeviceSection('tani')
                    if (normalizedItem === 'loglar') setDeviceSection('loglar')
                  }

                  return (
                    <button
                      key={item}
                      type="button"
                      className={isActive ? 'content-section-chip active' : 'content-section-chip'}
                      onClick={handleClick}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>

              <div className="content-body">
                {tab === 'genel' && renderGeneralTab()}
                {tab === 'fis' && renderReceiptSettingsTab()}
                {tab === 'cihazlar' && renderDevicesTab()}
                {tab === 'onizleme' && renderPreviewTab()}
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  )
}

export default App
