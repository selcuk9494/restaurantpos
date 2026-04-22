import type {
  AppSettings,
  BridgeSettings,
  IngenicoSettings,
  PrinterConfig,
  TerminalIdentitySettings,
  TerminalRegistrationSettings,
} from './types.js'

export const defaultIngenicoSettings: IngenicoSettings = {
  enabled: false,
  allowMockFallback: false,
  interfaceId: 'PRINTSERVER01',
  connectionMode: 'tcp',
  ipAddress: '127.0.0.1',
  port: 7500,
  portName: '\\\\.\\COM5',
  baudRate: 115200,
  byteSize: 8,
  parity: 0,
  stopBit: 0,
  retryCounter: 1,
  ipRetryCount: 1,
  ackTimeoutMs: 700,
  commTimeoutMs: 4000,
  interCharacterTimeoutMs: 100,
  isTcpKeepAlive: true,
  logThreadOpen: true,
  logFileSizeBytes: 5_000_000,
  defaultDepartmentIndex: 1,
  defaultCurrencyCode: 949,
  echoTimeoutMs: 700,
  defaultTimeoutMs: 5000,
  cardTimeoutMs: 100000,
  useEchoHealthCheck: false,
  enableDigitalMerchantCopy: true,
  blockManualPanEntry: true,
  workerExecutablePath: '',
  runtimeDirectory: '',
  autoConfigureRuntime: true,
}

export const defaultBridgeSettings: BridgeSettings = {
  enabled: true,
  host: '127.0.0.1',
  port: 18990,
  authRequired: false,
  authToken: '',
  requestLogLimit: 100,
}

export const defaultTerminalIdentitySettings: TerminalIdentitySettings = {
  businessName: 'FastRest',
  brandName: 'FastRest POS',
  branchName: 'Merkez Sube',
  branchCode: 'MRKZ',
  terminalName: 'Kasa 1',
  terminalCode: 'KASA-01',
  deviceGroup: 'Salon',
  cashierLabel: 'Kasiyer',
}

export const defaultTerminalRegistrationSettings: TerminalRegistrationSettings = {
  adminPanelUrl: '',
  remoteAuthToken: '',
  remoteHeaderName: '',
  remoteHeaderValue: '',
  remoteRegisteredAliases: 'registered, active, approved, confirmed, paired, connected, online, enabled, ready, completed, success',
  remotePairingAliases: 'pairing, pending, awaiting, waiting, verification, verify, code, awaiting_code, pending_pair, pair_required, pair-requested, challenge',
  remoteUnregisteredAliases: 'unregistered, revoked, deleted, disabled, rejected, inactive, blocked, cancelled, canceled, expired, removed',
  remoteRequestTimeoutMs: 7000,
  autoHeartbeatEnabled: false,
  heartbeatIntervalSec: 60,
  remoteRetryCount: 1,
  remoteRetryDelayMs: 1500,
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
  notes: '',
}

export const defaultSettings: AppSettings = {
  general: {
    watchDirectory: '',
    successArchiveDirectory: '',
    errorArchiveDirectory: '',
    pollIntervalSec: 2,
    previewStylePreset: 'german-doner',
    receiptHeaderText: 'German Doner',
    receiptFooterText: '*** HAZIRLANIYOR ***',
    receiptExtraLabel: 'Extra',
    receiptRemoveLabel: 'Cikar',
    receiptCustomNoteLabel: 'Not',
    moveStarredNotesToFooter: true,
    showOrderSequenceBadge: true,
    dynamicOptionDisplayMode: 'compact',
    showDynamicSelectionLabel: true,
    dynamicDrinkLabel: 'Icecek',
    dynamicSauceLabel: 'Sos',
    dynamicOtherLabel: 'Diger',
    extPrefixKeyword: 'EXT',
    printer2MirrorKeyword: 'P2',
    dynamicOptionFontScale: 0.92,
    dynamicOptionLineHeight: 1.45,
    dynamicOptionIndent: 40,
    dynamicOptionOpacity: 1,
    previewFontSize: 18,
    previewPaperWidth: 80,
    previewFontFamily: "'Courier New', Courier, monospace",
    previewLineHeight: 1.6,
    previewLetterSpacing: 0.7,
    thermalPrinterMode: true,
    autoStart: true,
    launchOnWindowsStartup: true,
    closeToTray: true,
    cutPaper: true,
    encoding: 'cp857',
  },
  terminalIdentity: defaultTerminalIdentitySettings,
  terminalRegistration: defaultTerminalRegistrationSettings,
  printers: [
    {
      id: 'printer-1',
      printerNo: 1,
      name: 'Ornek Yazici 1',
      enabled: true,
      type: 'windows',
      copies: 1,
      paperWidth: 80,
      fontScale: 1,
      windowsPrinterName: '',
      host: '',
      port: 9100,
    },
  ],
  ingenico: defaultIngenicoSettings,
  bridge: defaultBridgeSettings,
}

export function createPrinterConfig(printerNo: number): PrinterConfig {
  return {
    id: `printer-${printerNo}-${Date.now()}`,
    printerNo,
    name: `Yazici ${printerNo}`,
    enabled: true,
    type: 'windows',
    copies: 1,
    paperWidth: 80,
    fontScale: 1,
    windowsPrinterName: '',
    host: '',
    port: 9100,
  }
}

export function sanitizeSettings(input: unknown): AppSettings {
  const source = (input ?? {}) as Partial<AppSettings>
  const rawPrinters = Array.isArray(source.printers) ? (source.printers as Array<Partial<PrinterConfig>>) : []
  const ingenico = {
    ...defaultIngenicoSettings,
    ...(source.ingenico ?? {}),
  }
  const bridge = {
    ...defaultBridgeSettings,
    ...(source.bridge ?? {}),
  }
  const terminalIdentity = {
    ...defaultTerminalIdentitySettings,
    ...((source as Partial<AppSettings>).terminalIdentity ?? {}),
  }
  const terminalRegistration = {
    ...defaultTerminalRegistrationSettings,
    ...((source as Partial<AppSettings>).terminalRegistration ?? {}),
  }
  const general = {
    ...defaultSettings.general,
    ...(source.general ?? {}),
  }
  const shouldMigrateOriginalPreset =
    general.previewStylePreset === 'orijinal-fis' &&
    String(general.previewFontFamily ?? '') === "'Courier New', Courier, monospace" &&
    Number(general.previewFontSize ?? 0) === 15 &&
    Number(general.previewLineHeight ?? 0) === 1.42 &&
    Number(general.previewLetterSpacing ?? 0) === 0.15

  if (shouldMigrateOriginalPreset) {
    general.previewStylePreset = defaultSettings.general.previewStylePreset
    general.previewFontSize = defaultSettings.general.previewFontSize
    general.previewLineHeight = defaultSettings.general.previewLineHeight
    general.previewLetterSpacing = defaultSettings.general.previewLetterSpacing
  }

  const printers = rawPrinters.length > 0
    ? rawPrinters.map((printer: Partial<PrinterConfig>, index: number) => ({
        ...createPrinterConfig(index + 1),
        ...printer,
        printerNo: Number(printer?.printerNo ?? index + 1),
        copies: Math.max(1, Number(printer?.copies ?? 1)),
        paperWidth: Number(printer?.paperWidth ?? general.previewPaperWidth),
        fontScale: Number(printer?.fontScale ?? 1),
        port: Number(printer?.port ?? 9100),
      }))
    : defaultSettings.printers

  return {
    general: {
      ...general,
      pollIntervalSec: Math.max(1, Number(general.pollIntervalSec ?? 2)),
      previewStylePreset: String(general.previewStylePreset ?? defaultSettings.general.previewStylePreset),
      receiptHeaderText: String(general.receiptHeaderText ?? defaultSettings.general.receiptHeaderText),
      receiptFooterText: String(general.receiptFooterText ?? defaultSettings.general.receiptFooterText),
      receiptExtraLabel: String(general.receiptExtraLabel ?? defaultSettings.general.receiptExtraLabel),
      receiptRemoveLabel: String(general.receiptRemoveLabel ?? defaultSettings.general.receiptRemoveLabel),
      receiptCustomNoteLabel: String(general.receiptCustomNoteLabel ?? defaultSettings.general.receiptCustomNoteLabel),
      moveStarredNotesToFooter: Boolean(general.moveStarredNotesToFooter ?? defaultSettings.general.moveStarredNotesToFooter),
      showOrderSequenceBadge: Boolean(general.showOrderSequenceBadge ?? defaultSettings.general.showOrderSequenceBadge),
      dynamicOptionDisplayMode:
        general.dynamicOptionDisplayMode === 'classic'
          ? 'classic'
          : general.dynamicOptionDisplayMode === 'grouped'
            ? 'grouped'
            : general.dynamicOptionDisplayMode === 'compact'
              ? 'compact'
              : defaultSettings.general.dynamicOptionDisplayMode,
      showDynamicSelectionLabel: Boolean(general.showDynamicSelectionLabel ?? defaultSettings.general.showDynamicSelectionLabel),
      dynamicDrinkLabel: String(general.dynamicDrinkLabel ?? defaultSettings.general.dynamicDrinkLabel),
      dynamicSauceLabel: String(general.dynamicSauceLabel ?? defaultSettings.general.dynamicSauceLabel),
      dynamicOtherLabel: String(general.dynamicOtherLabel ?? defaultSettings.general.dynamicOtherLabel),
      extPrefixKeyword: String(general.extPrefixKeyword ?? defaultSettings.general.extPrefixKeyword),
      printer2MirrorKeyword: String(general.printer2MirrorKeyword ?? defaultSettings.general.printer2MirrorKeyword),
      dynamicOptionFontScale: Math.max(0.7, Math.min(1.4, Number(general.dynamicOptionFontScale ?? defaultSettings.general.dynamicOptionFontScale))),
      dynamicOptionLineHeight: Math.max(1, Math.min(2.2, Number(general.dynamicOptionLineHeight ?? defaultSettings.general.dynamicOptionLineHeight))),
      dynamicOptionIndent: Math.max(24, Math.min(120, Number(general.dynamicOptionIndent ?? defaultSettings.general.dynamicOptionIndent))),
      dynamicOptionOpacity: Math.max(0.45, Math.min(1, Number(general.dynamicOptionOpacity ?? defaultSettings.general.dynamicOptionOpacity))),
      previewFontSize: Math.max(8, Number(general.previewFontSize ?? 14)),
      previewPaperWidth: Math.max(58, Number(general.previewPaperWidth ?? 80)),
      previewFontFamily: String(general.previewFontFamily ?? defaultSettings.general.previewFontFamily),
      previewLineHeight: Math.max(1, Number(general.previewLineHeight ?? defaultSettings.general.previewLineHeight)),
      previewLetterSpacing: Number(general.previewLetterSpacing ?? defaultSettings.general.previewLetterSpacing),
      thermalPrinterMode: Boolean(general.thermalPrinterMode ?? defaultSettings.general.thermalPrinterMode),
    },
    terminalIdentity: {
      businessName: String(terminalIdentity.businessName ?? defaultTerminalIdentitySettings.businessName),
      brandName: String(terminalIdentity.brandName ?? defaultTerminalIdentitySettings.brandName),
      branchName: String(terminalIdentity.branchName ?? defaultTerminalIdentitySettings.branchName),
      branchCode: String(terminalIdentity.branchCode ?? defaultTerminalIdentitySettings.branchCode),
      terminalName: String(terminalIdentity.terminalName ?? defaultTerminalIdentitySettings.terminalName),
      terminalCode: String(terminalIdentity.terminalCode ?? defaultTerminalIdentitySettings.terminalCode),
      deviceGroup: String(terminalIdentity.deviceGroup ?? defaultTerminalIdentitySettings.deviceGroup),
      cashierLabel: String(terminalIdentity.cashierLabel ?? defaultTerminalIdentitySettings.cashierLabel),
    },
    terminalRegistration: {
      adminPanelUrl: String(terminalRegistration.adminPanelUrl ?? defaultTerminalRegistrationSettings.adminPanelUrl),
      remoteAuthToken: String(terminalRegistration.remoteAuthToken ?? defaultTerminalRegistrationSettings.remoteAuthToken),
      remoteHeaderName: String(terminalRegistration.remoteHeaderName ?? defaultTerminalRegistrationSettings.remoteHeaderName),
      remoteHeaderValue: String(terminalRegistration.remoteHeaderValue ?? defaultTerminalRegistrationSettings.remoteHeaderValue),
      remoteRegisteredAliases: String(
        terminalRegistration.remoteRegisteredAliases ?? defaultTerminalRegistrationSettings.remoteRegisteredAliases,
      ),
      remotePairingAliases: String(
        terminalRegistration.remotePairingAliases ?? defaultTerminalRegistrationSettings.remotePairingAliases,
      ),
      remoteUnregisteredAliases: String(
        terminalRegistration.remoteUnregisteredAliases ?? defaultTerminalRegistrationSettings.remoteUnregisteredAliases,
      ),
      remoteRequestTimeoutMs: Math.max(
        1000,
        Math.min(60_000, Number(terminalRegistration.remoteRequestTimeoutMs ?? defaultTerminalRegistrationSettings.remoteRequestTimeoutMs)),
      ),
      autoHeartbeatEnabled: Boolean(terminalRegistration.autoHeartbeatEnabled ?? defaultTerminalRegistrationSettings.autoHeartbeatEnabled),
      heartbeatIntervalSec: Math.max(
        15,
        Number(terminalRegistration.heartbeatIntervalSec ?? defaultTerminalRegistrationSettings.heartbeatIntervalSec),
      ),
      remoteRetryCount: Math.max(
        0,
        Math.min(5, Number(terminalRegistration.remoteRetryCount ?? defaultTerminalRegistrationSettings.remoteRetryCount)),
      ),
      remoteRetryDelayMs: Math.max(
        250,
        Math.min(10_000, Number(terminalRegistration.remoteRetryDelayMs ?? defaultTerminalRegistrationSettings.remoteRetryDelayMs)),
      ),
      organizationId: String(terminalRegistration.organizationId ?? defaultTerminalRegistrationSettings.organizationId),
      locationId: String(terminalRegistration.locationId ?? defaultTerminalRegistrationSettings.locationId),
      terminalId: String(terminalRegistration.terminalId ?? defaultTerminalRegistrationSettings.terminalId),
      registrationStatus:
        terminalRegistration.registrationStatus === 'registered'
          ? 'registered'
          : terminalRegistration.registrationStatus === 'pairing'
            ? 'pairing'
            : 'unregistered',
      pairingCode: String(terminalRegistration.pairingCode ?? defaultTerminalRegistrationSettings.pairingCode),
      pairingToken: String(terminalRegistration.pairingToken ?? defaultTerminalRegistrationSettings.pairingToken),
      deviceSecret: String(terminalRegistration.deviceSecret ?? defaultTerminalRegistrationSettings.deviceSecret),
      lastPairingAt: String(terminalRegistration.lastPairingAt ?? defaultTerminalRegistrationSettings.lastPairingAt),
      lastSyncAt: String(terminalRegistration.lastSyncAt ?? defaultTerminalRegistrationSettings.lastSyncAt),
      lastRemoteAttemptAt: String(terminalRegistration.lastRemoteAttemptAt ?? defaultTerminalRegistrationSettings.lastRemoteAttemptAt),
      lastRemoteOperation:
        terminalRegistration.lastRemoteOperation === 'register'
          ? 'register'
          : terminalRegistration.lastRemoteOperation === 'heartbeat'
            ? 'heartbeat'
            : terminalRegistration.lastRemoteOperation === 'pairing-confirm'
              ? 'pairing-confirm'
              : '',
      lastRemoteEndpoint: String(terminalRegistration.lastRemoteEndpoint ?? defaultTerminalRegistrationSettings.lastRemoteEndpoint),
      lastRemoteSummary: String(terminalRegistration.lastRemoteSummary ?? defaultTerminalRegistrationSettings.lastRemoteSummary),
      lastRemoteStatusCode: Math.max(0, Number(terminalRegistration.lastRemoteStatusCode ?? defaultTerminalRegistrationSettings.lastRemoteStatusCode)),
      lastRemoteMessage: String(terminalRegistration.lastRemoteMessage ?? defaultTerminalRegistrationSettings.lastRemoteMessage),
      lastRemoteError: String(terminalRegistration.lastRemoteError ?? defaultTerminalRegistrationSettings.lastRemoteError),
      notes: String(terminalRegistration.notes ?? defaultTerminalRegistrationSettings.notes),
    },
    printers,
    ingenico: {
      ...ingenico,
      enabled: Boolean(ingenico.enabled ?? defaultIngenicoSettings.enabled),
      allowMockFallback: Boolean(ingenico.allowMockFallback ?? defaultIngenicoSettings.allowMockFallback),
      interfaceId: String(ingenico.interfaceId ?? defaultIngenicoSettings.interfaceId),
      connectionMode: ingenico.connectionMode === 'serial' ? 'serial' : 'tcp',
      ipAddress: String(ingenico.ipAddress ?? defaultIngenicoSettings.ipAddress),
      port: Math.max(1, Number(ingenico.port ?? defaultIngenicoSettings.port)),
      portName: String(ingenico.portName ?? defaultIngenicoSettings.portName),
      baudRate: Math.max(1, Number(ingenico.baudRate ?? defaultIngenicoSettings.baudRate)),
      byteSize: Math.max(5, Number(ingenico.byteSize ?? defaultIngenicoSettings.byteSize)),
      parity: Number(ingenico.parity ?? defaultIngenicoSettings.parity),
      stopBit: Number(ingenico.stopBit ?? defaultIngenicoSettings.stopBit),
      retryCounter: Math.max(0, Number(ingenico.retryCounter ?? defaultIngenicoSettings.retryCounter)),
      ipRetryCount: Math.max(0, Number(ingenico.ipRetryCount ?? defaultIngenicoSettings.ipRetryCount)),
      ackTimeoutMs: Math.max(100, Number(ingenico.ackTimeoutMs ?? defaultIngenicoSettings.ackTimeoutMs)),
      commTimeoutMs: Math.max(1000, Number(ingenico.commTimeoutMs ?? defaultIngenicoSettings.commTimeoutMs)),
      interCharacterTimeoutMs: Math.max(0, Number(ingenico.interCharacterTimeoutMs ?? defaultIngenicoSettings.interCharacterTimeoutMs)),
      isTcpKeepAlive: Boolean(ingenico.isTcpKeepAlive ?? defaultIngenicoSettings.isTcpKeepAlive),
      logThreadOpen: Boolean(ingenico.logThreadOpen ?? defaultIngenicoSettings.logThreadOpen),
      logFileSizeBytes: Math.max(100_000, Number(ingenico.logFileSizeBytes ?? defaultIngenicoSettings.logFileSizeBytes)),
      defaultDepartmentIndex: Math.max(1, Number(ingenico.defaultDepartmentIndex ?? defaultIngenicoSettings.defaultDepartmentIndex)),
      defaultCurrencyCode: Math.max(1, Number(ingenico.defaultCurrencyCode ?? defaultIngenicoSettings.defaultCurrencyCode)),
      echoTimeoutMs: Math.max(100, Number(ingenico.echoTimeoutMs ?? defaultIngenicoSettings.echoTimeoutMs)),
      defaultTimeoutMs: Math.max(1000, Number(ingenico.defaultTimeoutMs ?? defaultIngenicoSettings.defaultTimeoutMs)),
      cardTimeoutMs: Math.max(1000, Number(ingenico.cardTimeoutMs ?? defaultIngenicoSettings.cardTimeoutMs)),
      useEchoHealthCheck: Boolean(ingenico.useEchoHealthCheck ?? defaultIngenicoSettings.useEchoHealthCheck),
      enableDigitalMerchantCopy: Boolean(ingenico.enableDigitalMerchantCopy ?? defaultIngenicoSettings.enableDigitalMerchantCopy),
      blockManualPanEntry: Boolean(ingenico.blockManualPanEntry ?? defaultIngenicoSettings.blockManualPanEntry),
      workerExecutablePath: String(ingenico.workerExecutablePath ?? defaultIngenicoSettings.workerExecutablePath),
      runtimeDirectory: String(ingenico.runtimeDirectory ?? defaultIngenicoSettings.runtimeDirectory),
      autoConfigureRuntime: Boolean(ingenico.autoConfigureRuntime ?? defaultIngenicoSettings.autoConfigureRuntime),
    },
    bridge: {
      ...bridge,
      enabled: Boolean(bridge.enabled ?? defaultBridgeSettings.enabled),
      host: String(bridge.host ?? defaultBridgeSettings.host).trim() || defaultBridgeSettings.host,
      port: Math.max(1, Number(bridge.port ?? defaultBridgeSettings.port)),
      authRequired: Boolean(bridge.authRequired ?? defaultBridgeSettings.authRequired),
      authToken: String(bridge.authToken ?? defaultBridgeSettings.authToken),
      requestLogLimit: Math.max(10, Math.min(500, Number(bridge.requestLogLimit ?? defaultBridgeSettings.requestLogLimit))),
    },
  }
}
