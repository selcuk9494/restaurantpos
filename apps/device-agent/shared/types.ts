export type PrinterType = 'windows' | 'escpos'
export type ReceiptFormat = 'json' | 'text'
export type JobStatus = 'success' | 'error' | 'ignored'
export type ReceiptEncoding = 'utf8' | 'cp857'
export type DynamicOptionDisplayMode = 'classic' | 'grouped' | 'compact'
export type IngenicoConnectionMode = 'tcp' | 'serial'
export type IngenicoOperation = 'test' | 'precheck' | 'pairing' | 'payment' | 'cancel'

export interface BridgeSettings {
  enabled: boolean
  host: string
  port: number
  authRequired: boolean
  authToken: string
  requestLogLimit: number
}

export interface TerminalIdentitySettings {
  businessName: string
  brandName: string
  branchName: string
  branchCode: string
  terminalName: string
  terminalCode: string
  deviceGroup: string
  cashierLabel: string
}

export type TerminalRegistrationStatus = 'unregistered' | 'pairing' | 'registered'
export type TerminalOperation = 'register' | 'heartbeat' | 'pairing-confirm'

export interface TerminalRegistrationSettings {
  adminPanelUrl: string
  remoteAuthToken: string
  remoteHeaderName: string
  remoteHeaderValue: string
  remoteRegisteredAliases: string
  remotePairingAliases: string
  remoteUnregisteredAliases: string
  remoteRequestTimeoutMs: number
  autoHeartbeatEnabled: boolean
  heartbeatIntervalSec: number
  remoteRetryCount: number
  remoteRetryDelayMs: number
  organizationId: string
  locationId: string
  terminalId: string
  registrationStatus: TerminalRegistrationStatus
  pairingCode: string
  pairingToken: string
  deviceSecret: string
  lastPairingAt: string
  lastSyncAt: string
  lastRemoteAttemptAt: string
  lastRemoteOperation: '' | TerminalOperation
  lastRemoteEndpoint: string
  lastRemoteSummary: string
  lastRemoteStatusCode: number
  lastRemoteMessage: string
  lastRemoteError: string
  notes: string
}

export interface TerminalRegisterRequest {
  adminPanelUrl?: string
  organizationId?: string
  locationId?: string
  terminalId?: string
  pairingCode?: string
  pairingToken?: string
  notes?: string
}

export interface TerminalHeartbeatRequest {
  statusMessage?: string
  notes?: string
}

export interface TerminalPairingConfirmRequest {
  terminalId?: string
  organizationId?: string
  locationId?: string
  pairingToken?: string
  deviceSecret?: string
  notes?: string
}

export interface TerminalOperationResult {
  ok: boolean
  operation: TerminalOperation
  message: string
  syncedAt: string
  terminalIdentity: TerminalIdentitySettings
  terminalRegistration: TerminalRegistrationSettings
}

export interface BridgeRequestLogItem {
  id: string
  method: string
  path: string
  statusCode: number
  createdAt: string
  clientIp: string
  authMode: 'open' | 'protected'
}

export interface BridgeRuntimeInfo {
  enabled: boolean
  address: string
  authRequired: boolean
  requestLogLimit: number
  requestCount: number
  autoHeartbeatScheduled: boolean
  autoHeartbeatRunning: boolean
  terminalIdentity: TerminalIdentitySettings
  terminalRegistration: TerminalRegistrationSettings
  recentRequests: BridgeRequestLogItem[]
}

export interface GeneralSettings {
  watchDirectory: string
  successArchiveDirectory: string
  errorArchiveDirectory: string
  pollIntervalSec: number
  previewStylePreset: string
  receiptHeaderText: string
  receiptFooterText: string
  receiptExtraLabel: string
  receiptRemoveLabel: string
  receiptCustomNoteLabel: string
  moveStarredNotesToFooter: boolean
  showOrderSequenceBadge: boolean
  dynamicOptionDisplayMode: DynamicOptionDisplayMode
  showDynamicSelectionLabel: boolean
  dynamicDrinkLabel: string
  dynamicSauceLabel: string
  dynamicOtherLabel: string
  extPrefixKeyword: string
  printer2MirrorKeyword: string
  dynamicOptionFontScale: number
  dynamicOptionLineHeight: number
  dynamicOptionIndent: number
  dynamicOptionOpacity: number
  previewFontSize: number
  previewPaperWidth: number
  previewFontFamily: string
  previewLineHeight: number
  previewLetterSpacing: number
  thermalPrinterMode: boolean
  autoStart: boolean
  launchOnWindowsStartup: boolean
  closeToTray: boolean
  cutPaper: boolean
  encoding: ReceiptEncoding
}

export interface PrinterConfig {
  id: string
  printerNo: number
  name: string
  enabled: boolean
  type: PrinterType
  copies: number
  paperWidth: number
  fontScale: number
  windowsPrinterName: string
  host: string
  port: number
}

export interface IngenicoSettings {
  enabled: boolean
  allowMockFallback: boolean
  interfaceId: string
  connectionMode: IngenicoConnectionMode
  ipAddress: string
  port: number
  portName: string
  baudRate: number
  byteSize: number
  parity: number
  stopBit: number
  retryCounter: number
  ipRetryCount: number
  ackTimeoutMs: number
  commTimeoutMs: number
  interCharacterTimeoutMs: number
  isTcpKeepAlive: boolean
  logThreadOpen: boolean
  logFileSizeBytes: number
  defaultDepartmentIndex: number
  defaultCurrencyCode: number
  echoTimeoutMs: number
  defaultTimeoutMs: number
  cardTimeoutMs: number
  useEchoHealthCheck: boolean
  enableDigitalMerchantCopy: boolean
  blockManualPanEntry: boolean
  workerExecutablePath: string
  runtimeDirectory: string
  autoConfigureRuntime: boolean
}

export interface IngenicoPaymentItem {
  name: string
  unitPrice: number
  quantity: number
}

export interface IngenicoPaymentRequest {
  amount: number
  customerReference: string
  items: IngenicoPaymentItem[]
}

export interface IngenicoOperationResult {
  isSuccess: boolean
  operation: IngenicoOperation
  message: string
  isMock?: boolean
  details?: string
  orderNumber?: string
  receiptAmount?: number
  customerReference?: string
  isReady?: boolean
  isPairingRequired?: boolean
  durationMs?: number
}

export interface AppSettings {
  general: GeneralSettings
  terminalIdentity: TerminalIdentitySettings
  terminalRegistration: TerminalRegistrationSettings
  printers: PrinterConfig[]
  ingenico: IngenicoSettings
  bridge: BridgeSettings
}

export interface ReceiptPreviewData {
  title: string
  lines: string[]
  metadata: Record<string, string>
  sourceFile: string
  printerNo: number
  detectedFormat: ReceiptFormat
  rawContent: string
}

export interface PrintJobLog {
  id: string
  filePath: string
  fileName: string
  printerNo: number | null
  printerName: string | null
  status: JobStatus
  message: string
  createdAt: string
  preview?: ReceiptPreviewData
}

export interface RuntimeState {
  watcherRunning: boolean
  recentJobs: PrintJobLog[]
}

export interface PrinterDiagnosticItem {
  method: string
  success: boolean
  printers: string[]
  error?: string
}

export interface PrinterDiagnostics {
  platform: string
  results: PrinterDiagnosticItem[]
}
