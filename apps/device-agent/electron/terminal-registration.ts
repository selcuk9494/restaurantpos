import type {
  AppSettings,
  RuntimeState,
  TerminalHeartbeatRequest,
  TerminalOperation,
  TerminalPairingConfirmRequest,
  TerminalRegisterRequest,
  TerminalRegistrationSettings,
} from '../shared/types.js'

type TerminalOperationPayload =
  | TerminalRegisterRequest
  | TerminalHeartbeatRequest
  | TerminalPairingConfirmRequest

export interface TerminalRemoteSyncResult {
  remoteOk: boolean
  message: string
  syncedAt: string
  registrationPatch: Partial<TerminalRegistrationSettings>
}

export async function syncTerminalRegistrationOperation(
  settings: AppSettings,
  runtimeState: RuntimeState,
  operation: TerminalOperation,
  payload: TerminalOperationPayload,
): Promise<TerminalRemoteSyncResult> {
  const adminPanelUrl = settings.terminalRegistration.adminPanelUrl.trim()
  const remoteAuthToken = settings.terminalRegistration.remoteAuthToken.trim()
  const remoteHeaderName = settings.terminalRegistration.remoteHeaderName.trim()
  const remoteHeaderValue = settings.terminalRegistration.remoteHeaderValue.trim()
  const syncedAt = new Date().toISOString()
  const attemptedAt = syncedAt

  if (!adminPanelUrl) {
    return {
      remoteOk: true,
      message: 'Admin panel URL tanimli degil, islem yerel modda kaydedildi.',
      syncedAt,
      registrationPatch: {
        lastRemoteAttemptAt: attemptedAt,
        lastRemoteOperation: operation,
        lastRemoteEndpoint: '',
        lastRemoteSummary: 'Yerel mod, uzak istek gonderilmedi.',
        lastRemoteStatusCode: 0,
        lastRemoteMessage: 'Yerel mod',
        lastRemoteError: '',
      },
    }
  }

  const endpointUrl = buildTerminalEndpointUrl(adminPanelUrl, getTerminalEndpointPath(operation))

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (remoteAuthToken) {
      headers.Authorization = `Bearer ${remoteAuthToken}`
    }
    if (remoteHeaderName && remoteHeaderValue) {
      headers[remoteHeaderName] = remoteHeaderValue
    }

    const maxAttempts = Math.max(1, settings.terminalRegistration.remoteRetryCount + 1)
    let lastStatusCode = 0
    let lastErrorMessage = ''
    let lastResponseRecord: Record<string, unknown> = {}

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), settings.terminalRegistration.remoteRequestTimeoutMs)
        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            operation,
            terminalIdentity: settings.terminalIdentity,
            terminalRegistration: settings.terminalRegistration,
            runtime: {
              watcherRunning: runtimeState.watcherRunning,
              recentJobCount: runtimeState.recentJobs.length,
              activePrinterCount: settings.printers.filter((printer) => printer.enabled).length,
            },
            payload,
          }),
        }).finally(() => {
          clearTimeout(timeoutId)
        })

        const responseBody = await readJsonSafely(response)
        const responseRecord = asRecord(responseBody)
        lastResponseRecord = responseRecord
        lastStatusCode = response.status

        const remoteMessage =
          String(responseRecord.message ?? '').trim() ||
          `Uzak ${operation} istegi basarili.`

        if (response.ok) {
          const extractedPatch = extractRegistrationPatch(responseRecord)
          const remoteSummary = buildRemoteSummary(operation, endpointUrl, responseRecord, extractedPatch)
          return {
            remoteOk: true,
            message: remoteMessage,
            syncedAt: String(responseRecord.syncedAt ?? syncedAt),
            registrationPatch: {
              ...extractedPatch,
              lastRemoteAttemptAt: attemptedAt,
              lastRemoteOperation: operation,
              lastRemoteEndpoint: endpointUrl,
              lastRemoteSummary: remoteSummary,
              lastRemoteStatusCode: response.status,
              lastRemoteMessage: remoteMessage,
              lastRemoteError: '',
            },
          }
        }

        lastErrorMessage = remoteMessage
        if (attempt < maxAttempts && shouldRetryStatusCode(response.status)) {
          await waitBeforeRetry(settings, attempt)
          continue
        }

        return {
          remoteOk: false,
          message: `Yerel kayit yapildi, uzak servis hatasi: ${remoteMessage}`,
          syncedAt,
          registrationPatch: {
            lastRemoteAttemptAt: attemptedAt,
            lastRemoteOperation: operation,
            lastRemoteEndpoint: endpointUrl,
            lastRemoteSummary: buildRemoteFailureSummary(operation, endpointUrl, response.status, remoteMessage),
            lastRemoteStatusCode: response.status,
            lastRemoteMessage: '',
            lastRemoteError: remoteMessage,
          },
        }
      } catch (error) {
        lastErrorMessage = buildRemoteErrorMessage(error, settings.terminalRegistration.remoteRequestTimeoutMs)
        if (attempt < maxAttempts) {
          await waitBeforeRetry(settings, attempt)
          continue
        }
      }
    }

    return {
      remoteOk: false,
      message: `Yerel kayit yapildi, uzak servis hatasi: ${lastErrorMessage || buildFallbackErrorMessage(lastStatusCode, lastResponseRecord)}`,
      syncedAt,
      registrationPatch: {
        lastRemoteAttemptAt: attemptedAt,
        lastRemoteOperation: operation,
        lastRemoteEndpoint: endpointUrl,
        lastRemoteSummary: buildRemoteFailureSummary(
          operation,
          endpointUrl,
          lastStatusCode,
          lastErrorMessage || buildFallbackErrorMessage(lastStatusCode, lastResponseRecord),
        ),
        lastRemoteStatusCode: lastStatusCode,
        lastRemoteMessage: '',
        lastRemoteError: lastErrorMessage || buildFallbackErrorMessage(lastStatusCode, lastResponseRecord),
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Uzak terminal servisine baglanilamadi.'
    return {
      remoteOk: false,
      message: `Yerel kayit yapildi, uzak servis hatasi: ${message}`,
      syncedAt,
      registrationPatch: {
        lastRemoteAttemptAt: attemptedAt,
        lastRemoteOperation: operation,
        lastRemoteEndpoint: endpointUrl,
        lastRemoteSummary: buildRemoteFailureSummary(operation, endpointUrl, 0, message),
        lastRemoteStatusCode: 0,
        lastRemoteMessage: '',
        lastRemoteError: message,
      },
    }
  }
}

function getTerminalEndpointPath(operation: TerminalOperation): string {
  if (operation === 'register') {
    return 'terminal/register'
  }
  if (operation === 'heartbeat') {
    return 'terminal/heartbeat'
  }
  return 'terminal/pairing/confirm'
}

function buildTerminalEndpointUrl(baseUrl: string, endpointPath: string): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return new URL(endpointPath, normalizedBase).toString()
}

function shouldRetryStatusCode(statusCode: number): boolean {
  return statusCode === 429 || statusCode >= 500
}

async function waitBeforeRetry(settings: AppSettings, attempt: number): Promise<void> {
  const baseDelayMs = Math.max(250, settings.terminalRegistration.remoteRetryDelayMs)
  const delayMs = baseDelayMs * attempt
  await sleep(delayMs)
}

async function sleep(delayMs: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs)
  })
}

function buildFallbackErrorMessage(statusCode: number, record: Record<string, unknown>): string {
  const message = String(record.message ?? '').trim()
  if (message) {
    return message
  }
  if (statusCode > 0) {
    return `Uzak servis ${statusCode} durum kodu ile cevap verdi.`
  }
  return 'Uzak terminal servisine baglanilamadi.'
}

function buildRemoteErrorMessage(error: unknown, timeoutMs: number): string {
  if (error instanceof Error && error.name === 'AbortError') {
    return `Uzak servis ${timeoutMs} ms icinde cevap vermedi.`
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Uzak terminal servisine baglanilamadi.'
}

async function readJsonSafely(response: Response): Promise<unknown> {
  const text = (await response.text()).trim()
  if (!text) {
    return {}
  }

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

function extractRegistrationPatch(record: Record<string, unknown>): Partial<TerminalRegistrationSettings> {
  const candidates = collectRegistrationCandidates(record)
  const status = findRegistrationStatus(candidates)

  return {
    adminPanelUrl: findFirstString(candidates, ['adminPanelUrl', 'panelUrl']),
    organizationId: findFirstString(candidates, ['organizationId', 'orgId']),
    locationId: findFirstString(candidates, ['locationId', 'branchId', 'storeId']),
    terminalId: findFirstString(candidates, ['terminalId', 'deviceId', 'id']),
    registrationStatus:
      status === 'registered'
        ? 'registered'
        : status === 'pairing'
          ? 'pairing'
          : status === 'unregistered'
            ? 'unregistered'
            : undefined,
    pairingCode: findFirstString(candidates, ['pairingCode', 'code']),
    pairingToken: findFirstString(candidates, ['pairingToken', 'token']),
    deviceSecret: findFirstString(candidates, ['deviceSecret', 'secret']),
    lastPairingAt: findFirstString(candidates, ['lastPairingAt', 'pairingAt', 'pairedAt']),
    lastSyncAt: findFirstString(candidates, ['lastSyncAt', 'syncedAt', 'updatedAt']),
    lastRemoteAttemptAt: findFirstString(candidates, ['lastRemoteAttemptAt', 'attemptedAt']),
    notes: findFirstString(candidates, ['notes', 'note', 'description']),
  }
}

function buildRemoteSummary(
  operation: TerminalOperation,
  endpointUrl: string,
  record: Record<string, unknown>,
  patch: Partial<TerminalRegistrationSettings>,
): string {
  const explicitSummary = findFirstString(collectRegistrationCandidates(record), ['summary', 'statusText', 'detail', 'description'])
  if (explicitSummary) {
    return explicitSummary
  }

  const parts = [
    formatOperationLabel(operation),
    patch.registrationStatus ? `durum ${patch.registrationStatus}` : '',
    patch.terminalId ? `terminal ${patch.terminalId}` : '',
    patch.pairingCode ? `pairing ${patch.pairingCode}` : '',
    shortEndpointLabel(endpointUrl),
  ].filter(Boolean)

  return parts.join(' | ') || `Uzak ${formatOperationLabel(operation).toLowerCase()} senkronu tamamlandi.`
}

function buildRemoteFailureSummary(
  operation: TerminalOperation,
  endpointUrl: string,
  statusCode: number,
  message: string,
): string {
  const statusLabel = statusCode > 0 ? `HTTP ${statusCode}` : 'baglanti hatasi'
  return `${formatOperationLabel(operation)} | ${statusLabel} | ${shortEndpointLabel(endpointUrl)} | ${message}`
}

function formatOperationLabel(operation: TerminalOperation): string {
  if (operation === 'register') {
    return 'Register'
  }
  if (operation === 'heartbeat') {
    return 'Heartbeat'
  }
  return 'Pairing Confirm'
}

function shortEndpointLabel(endpointUrl: string): string {
  try {
    const parsed = new URL(endpointUrl)
    return `${parsed.host}${parsed.pathname}`
  } catch {
    return endpointUrl
  }
}

function collectRegistrationCandidates(record: Record<string, unknown>): Record<string, unknown>[] {
  const candidates = [
    record,
    asRecord(record.data),
    asRecord(record.result),
    asRecord(record.payload),
    asRecord(record.response),
    asRecord(record.terminalRegistration),
    asRecord(record.registration),
    asRecord(asRecord(record.data).terminalRegistration),
    asRecord(asRecord(record.result).terminalRegistration),
    asRecord(asRecord(record.payload).terminalRegistration),
    asRecord(record.terminal),
    asRecord(record.device),
    asRecord(record.organization),
    asRecord(record.location),
    asRecord(record.branch),
  ]

  return candidates.filter((candidate, index) => Object.keys(candidate).length > 0 && candidates.indexOf(candidate) === index)
}

function findRegistrationStatus(candidates: Record<string, unknown>[]): TerminalRegistrationSettings['registrationStatus'] | undefined {
  for (const candidate of candidates) {
    const direct = candidate.registrationStatus
    if (direct === 'registered' || direct === 'pairing' || direct === 'unregistered') {
      return direct
    }

    const status = String(candidate.status ?? '').trim().toLowerCase()
    if (status === 'registered' || status === 'pairing' || status === 'unregistered') {
      return status
    }

    if (candidate.paired === true || candidate.isRegistered === true) {
      return 'registered'
    }
    if (candidate.pairingRequired === true || candidate.awaitingPairing === true) {
      return 'pairing'
    }
  }

  return undefined
}

function findFirstString(candidates: Record<string, unknown>[], keys: string[]): string | undefined {
  for (const candidate of candidates) {
    for (const key of keys) {
      const value = asOptionalString(candidate[key])
      if (value && value.trim()) {
        return value
      }
    }
  }

  return undefined
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }
  return value
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}
