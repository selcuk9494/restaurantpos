import http, { type IncomingMessage, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { printReceipt } from './printer.js'
import type {
  AppSettings,
  BridgeRequestLogItem,
  BridgeRuntimeInfo,
  IngenicoOperationResult,
  IngenicoPaymentRequest,
  ReceiptPreviewData,
  RuntimeState,
  TerminalHeartbeatRequest,
  TerminalOperationResult,
  TerminalPairingConfirmRequest,
  TerminalRegisterRequest,
} from '../shared/types.js'

interface BridgeServerDependencies {
  getSettings: () => Promise<AppSettings>
  getRuntimeState: () => RuntimeState
  registerTerminal: (request: TerminalRegisterRequest) => Promise<TerminalOperationResult>
  heartbeatTerminal: (request: TerminalHeartbeatRequest) => Promise<TerminalOperationResult>
  confirmTerminalPairing: (request: TerminalPairingConfirmRequest) => Promise<TerminalOperationResult>
  runIngenicoOperation: (
    operation: 'test' | 'precheck' | 'pairing' | 'payment' | 'cancel',
    paymentRequest?: IngenicoPaymentRequest,
  ) => Promise<IngenicoOperationResult>
}

export class BridgeHttpServer {
  private server: http.Server | null = null
  private bindHost = '127.0.0.1'
  private bindPort = 18990
  private readonly requestLogs: BridgeRequestLogItem[] = []

  constructor(private readonly dependencies: BridgeServerDependencies) {}

  async start(): Promise<void> {
    if (this.server) {
      return
    }

    const settings = await this.dependencies.getSettings()
    this.bindHost = settings.bridge.host
    this.bindPort = settings.bridge.port

    this.server = http.createServer((request, response) => {
      void this.handleRequest(request, response)
    })

    await new Promise<void>((resolve, reject) => {
      this.server?.once('error', reject)
      this.server?.listen(this.bindPort, this.bindHost, () => {
        this.server?.off('error', reject)
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return
    }

    const currentServer = this.server
    this.server = null

    await new Promise<void>((resolve, reject) => {
      currentServer.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }

  getAddress(): string {
    if (!this.server) {
      return `${this.bindHost}:${this.bindPort}`
    }

    const address = this.server.address() as AddressInfo | null
    if (!address) {
      return `${this.bindHost}:${this.bindPort}`
    }

    return `${address.address}:${address.port}`
  }

  getRuntimeInfo(settings: AppSettings): BridgeRuntimeInfo {
    return {
      enabled: settings.bridge.enabled,
      address: this.getAddress(),
      authRequired: settings.bridge.authRequired,
      requestLogLimit: settings.bridge.requestLogLimit,
      requestCount: this.requestLogs.length,
      autoHeartbeatScheduled: false,
      autoHeartbeatRunning: false,
      terminalIdentity: settings.terminalIdentity,
      terminalRegistration: settings.terminalRegistration,
      recentRequests: [...this.requestLogs],
    }
  }

  getRequestLogs(): BridgeRequestLogItem[] {
    return [...this.requestLogs]
  }

  private async handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const settings = await this.dependencies.getSettings()
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Bridge-Token')
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')

    if (request.method === 'OPTIONS') {
      response.statusCode = 204
      response.end()
      return
    }

    const method = request.method ?? 'GET'
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    const authMode = settings.bridge.authRequired ? 'protected' : 'open'

    try {
      if (method === 'GET' && url.pathname === '/health') {
        await this.sendJson(response, 200, {
          ok: true,
          service: 'resto-device-agent-bridge',
          address: this.getAddress(),
          authRequired: settings.bridge.authRequired,
          terminalIdentity: settings.terminalIdentity,
          terminalRegistration: settings.terminalRegistration,
        })
        this.appendRequestLog(request, url.pathname, 200, authMode, settings.bridge.requestLogLimit)
        return
      }

      if (!this.isAuthorized(request, settings)) {
        await this.sendJson(response, 401, {
          ok: false,
          message: 'Yetkisiz bridge istegi.',
        })
        this.appendRequestLog(request, url.pathname, 401, authMode, settings.bridge.requestLogLimit)
        return
      }

      if (method === 'GET' && url.pathname === '/runtime') {
        await this.sendJson(response, 200, {
          ok: true,
          runtime: this.dependencies.getRuntimeState(),
          terminalIdentity: settings.terminalIdentity,
          terminalRegistration: settings.terminalRegistration,
          printers: settings.printers,
          ingenicoEnabled: settings.ingenico.enabled,
          bridgeAddress: this.getAddress(),
          bridge: {
            enabled: settings.bridge.enabled,
            host: settings.bridge.host,
            port: settings.bridge.port,
            authRequired: settings.bridge.authRequired,
            requestLogLimit: settings.bridge.requestLogLimit,
          },
        })
        this.appendRequestLog(request, url.pathname, 200, authMode, settings.bridge.requestLogLimit)
        return
      }

      if (method === 'GET' && url.pathname === '/logs') {
        await this.sendJson(response, 200, {
          ok: true,
          items: this.requestLogs,
        })
        this.appendRequestLog(request, url.pathname, 200, authMode, settings.bridge.requestLogLimit)
        return
      }

      if (method === 'POST' && url.pathname === '/ingenico/test') {
        await this.sendJson(response, 200, await this.dependencies.runIngenicoOperation('test'))
        this.appendRequestLog(request, url.pathname, 200, authMode, settings.bridge.requestLogLimit)
        return
      }

      if (method === 'POST' && url.pathname === '/ingenico/precheck') {
        await this.sendJson(response, 200, await this.dependencies.runIngenicoOperation('precheck'))
        this.appendRequestLog(request, url.pathname, 200, authMode, settings.bridge.requestLogLimit)
        return
      }

      if (method === 'POST' && url.pathname === '/ingenico/pairing') {
        await this.sendJson(response, 200, await this.dependencies.runIngenicoOperation('pairing'))
        this.appendRequestLog(request, url.pathname, 200, authMode, settings.bridge.requestLogLimit)
        return
      }

      if (method === 'POST' && url.pathname === '/ingenico/cancel') {
        await this.sendJson(response, 200, await this.dependencies.runIngenicoOperation('cancel'))
        this.appendRequestLog(request, url.pathname, 200, authMode, settings.bridge.requestLogLimit)
        return
      }

      if (method === 'POST' && url.pathname === '/ingenico/payment') {
        const body = await this.readJsonBody(request)
        const paymentRequest = this.parsePaymentRequest(body)
        await this.sendJson(response, 200, await this.dependencies.runIngenicoOperation('payment', paymentRequest))
        this.appendRequestLog(request, url.pathname, 200, authMode, settings.bridge.requestLogLimit)
        return
      }

      if (method === 'POST' && url.pathname === '/print/receipt') {
        const body = await this.readJsonBody(request)
        await this.handlePrintReceipt(body, response)
        this.appendRequestLog(request, url.pathname, 200, authMode, settings.bridge.requestLogLimit)
        return
      }

      if (method === 'POST' && url.pathname === '/terminal/register') {
        const body = await this.readJsonBody(request)
        await this.sendJson(response, 200, await this.dependencies.registerTerminal(this.parseTerminalRegisterRequest(body)))
        this.appendRequestLog(request, url.pathname, 200, authMode, settings.bridge.requestLogLimit)
        return
      }

      if (method === 'POST' && url.pathname === '/terminal/heartbeat') {
        const body = await this.readJsonBody(request)
        await this.sendJson(response, 200, await this.dependencies.heartbeatTerminal(this.parseTerminalHeartbeatRequest(body)))
        this.appendRequestLog(request, url.pathname, 200, authMode, settings.bridge.requestLogLimit)
        return
      }

      if (method === 'POST' && url.pathname === '/terminal/pairing/confirm') {
        const body = await this.readJsonBody(request)
        await this.sendJson(response, 200, await this.dependencies.confirmTerminalPairing(this.parseTerminalPairingConfirmRequest(body)))
        this.appendRequestLog(request, url.pathname, 200, authMode, settings.bridge.requestLogLimit)
        return
      }

      await this.sendJson(response, 404, {
        ok: false,
        message: 'Endpoint bulunamadi.',
      })
      this.appendRequestLog(request, url.pathname, 404, authMode, settings.bridge.requestLogLimit)
    } catch (error) {
      await this.sendJson(response, 500, {
        ok: false,
        message: error instanceof Error ? error.message : 'Bilinmeyen bridge hatasi.',
      })
      this.appendRequestLog(request, url.pathname, 500, authMode, settings.bridge.requestLogLimit)
    }
  }

  private isAuthorized(request: IncomingMessage, settings: AppSettings): boolean {
    if (!settings.bridge.authRequired) {
      return true
    }

    const expectedToken = settings.bridge.authToken.trim()
    if (!expectedToken) {
      return false
    }

    const authorizationHeader = request.headers.authorization?.trim() ?? ''
    const bearerToken = authorizationHeader.toLowerCase().startsWith('bearer ')
      ? authorizationHeader.slice(7).trim()
      : ''
    const bridgeTokenHeader = String(request.headers['x-bridge-token'] ?? '').trim()

    return bearerToken === expectedToken || bridgeTokenHeader === expectedToken
  }

  private appendRequestLog(
    request: IncomingMessage,
    requestPath: string,
    statusCode: number,
    authMode: 'open' | 'protected',
    requestLogLimit: number,
  ): void {
    const clientIp = request.socket.remoteAddress ?? 'unknown'
    this.requestLogs.unshift({
      id: `${Date.now()}-${Math.random()}`,
      method: request.method ?? 'GET',
      path: requestPath,
      statusCode,
      createdAt: new Date().toISOString(),
      clientIp,
      authMode,
    })

    if (this.requestLogs.length > requestLogLimit) {
      this.requestLogs.splice(requestLogLimit)
    }
  }

  private async handlePrintReceipt(body: unknown, response: ServerResponse): Promise<void> {
    const settings = await this.dependencies.getSettings()
    const payload = this.parsePrintReceiptRequest(body)
    const printer = settings.printers.find((item) => item.enabled && item.printerNo === payload.printerNo)

    if (!printer) {
      await this.sendJson(response, 404, {
        ok: false,
        message: `PrinterNo ${payload.printerNo} icin etkin yazici bulunamadi.`,
      })
      return
    }

    const preview: ReceiptPreviewData = {
      title: payload.title,
      lines: payload.lines,
      metadata: payload.metadata,
      sourceFile: payload.sourceFile,
      printerNo: payload.printerNo,
      detectedFormat: 'text',
      rawContent: payload.rawContent || payload.lines.join('\n'),
    }

    await printReceipt(preview, settings, printer)
    await this.sendJson(response, 200, {
      ok: true,
      printerNo: payload.printerNo,
      printerName: printer.name,
      message: 'Yazdirma istegi gonderildi.',
    })
  }

  private parsePaymentRequest(body: unknown): IngenicoPaymentRequest {
    const record = this.asRecord(body)
    const itemsValue = Array.isArray(record.items) ? record.items : []
    const items = itemsValue.map((item, index) => {
      const itemRecord = this.asRecord(item)
      return {
        name: String(itemRecord.name ?? `Kalem ${index + 1}`),
        unitPrice: Number(itemRecord.unitPrice ?? 0),
        quantity: Math.max(1, Number(itemRecord.quantity ?? 1)),
      }
    })

    return {
      amount: Number(record.amount ?? 0),
      customerReference: String(record.customerReference ?? 'RDA-001'),
      items,
    }
  }

  private parsePrintReceiptRequest(body: unknown): {
    title: string
    lines: string[]
    metadata: Record<string, string>
    sourceFile: string
    rawContent: string
    printerNo: number
  } {
    const record = this.asRecord(body)
    const lines = Array.isArray(record.lines) ? record.lines.map((line) => String(line)) : []
    const metadataRecord = this.asRecord(record.metadata)
    const metadata = Object.fromEntries(
      Object.entries(metadataRecord).map(([key, value]) => [key, String(value)]),
    )

    return {
      title: String(record.title ?? 'API Print Request'),
      lines,
      metadata,
      sourceFile: String(record.sourceFile ?? 'bridge-api'),
      rawContent: String(record.rawContent ?? lines.join('\n')),
      printerNo: Number(record.printerNo ?? 1),
    }
  }

  private parseTerminalRegisterRequest(body: unknown): TerminalRegisterRequest {
    const record = this.asRecord(body)
    return {
      adminPanelUrl: String(record.adminPanelUrl ?? ''),
      organizationId: String(record.organizationId ?? ''),
      locationId: String(record.locationId ?? ''),
      terminalId: String(record.terminalId ?? ''),
      pairingCode: String(record.pairingCode ?? ''),
      pairingToken: String(record.pairingToken ?? ''),
      notes: String(record.notes ?? ''),
    }
  }

  private parseTerminalHeartbeatRequest(body: unknown): TerminalHeartbeatRequest {
    const record = this.asRecord(body)
    return {
      statusMessage: String(record.statusMessage ?? ''),
      notes: String(record.notes ?? ''),
    }
  }

  private parseTerminalPairingConfirmRequest(body: unknown): TerminalPairingConfirmRequest {
    const record = this.asRecord(body)
    return {
      terminalId: String(record.terminalId ?? ''),
      organizationId: String(record.organizationId ?? ''),
      locationId: String(record.locationId ?? ''),
      pairingToken: String(record.pairingToken ?? ''),
      deviceSecret: String(record.deviceSecret ?? ''),
      notes: String(record.notes ?? ''),
    }
  }

  private async readJsonBody(request: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = []

    for await (const chunk of request) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }

    const text = Buffer.concat(chunks).toString('utf8').trim()
    if (!text) {
      return {}
    }

    return JSON.parse(text)
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {}
    }

    return value as Record<string, unknown>
  }

  private async sendJson(response: ServerResponse, statusCode: number, payload: unknown): Promise<void> {
    response.statusCode = statusCode
    response.end(JSON.stringify(payload, null, 2))
  }
}
