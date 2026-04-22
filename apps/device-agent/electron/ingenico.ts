import { execFile } from 'node:child_process'
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import type { App } from 'electron'
import type {
  AppSettings,
  IngenicoOperation,
  IngenicoOperationResult,
  IngenicoPaymentRequest,
  IngenicoSettings,
} from '../shared/types.js'

const execFileAsync = promisify(execFile)

type WorkerRequest = {
  operation: IngenicoOperation
  settings: IngenicoSettings
  paymentRequest?: IngenicoPaymentRequest
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function getCandidateWorkerPaths(app: App, settings: IngenicoSettings): string[] {
  const configuredPath = settings.workerExecutablePath.trim()
  const appRoot = app.getAppPath()

  return [
    configuredPath,
    path.join(process.resourcesPath, 'ingenico-worker', 'IngenicoWorker.exe'),
    path.join(process.resourcesPath, 'IngenicoWorker.exe'),
    path.join(process.resourcesPath, 'ingenico-worker', 'build', 'win-x64', 'IngenicoWorker.exe'),
    path.join(process.resourcesPath, 'ingenico-worker', 'build', 'win-arm64', 'IngenicoWorker.exe'),
    path.join(appRoot, 'ingenico-worker', 'build', 'win-x64', 'IngenicoWorker.exe'),
    path.join(appRoot, 'ingenico-worker', 'build', 'win-arm64', 'IngenicoWorker.exe'),
    path.join(appRoot, 'ingenico-worker', 'bin', 'Release', 'net8.0-windows', 'IngenicoWorker.exe'),
    path.join(appRoot, 'ingenico-worker', 'bin', 'Debug', 'net8.0-windows', 'IngenicoWorker.exe'),
    path.join(appRoot, 'ingenico-worker', 'bin', 'Release', 'net8.0', 'IngenicoWorker.exe'),
    path.join(appRoot, 'ingenico-worker', 'bin', 'Debug', 'net8.0', 'IngenicoWorker.exe'),
  ].filter(Boolean)
}

function getResolvedRuntimeDirectory(app: App, settings: IngenicoSettings): string {
  const configuredPath = settings.runtimeDirectory.trim()
  if (configuredPath) {
    return configuredPath
  }

  if (process.resourcesPath) {
    return path.join(process.resourcesPath, 'ingenico-runtime')
  }

  return path.join(app.getAppPath(), 'ingenico-runtime')
}

async function findExistingWorkerPath(app: App, settings: IngenicoSettings): Promise<string | null> {
  const candidates = getCandidateWorkerPaths(app, settings)
  for (const candidate of candidates) {
    if (await pathExists(candidate)) {
      return candidate
    }
  }

  return null
}

async function hasRequiredRuntimeFiles(runtimeDirectory: string): Promise<boolean> {
  const requiredFiles = [
    path.join(runtimeDirectory, 'GMPSmartDLL.dll'),
    path.join(runtimeDirectory, 'GMP.XML'),
  ]

  for (const filePath of requiredFiles) {
    if (!(await pathExists(filePath))) {
      return false
    }
  }

  return true
}

function createMockResult(
  operation: IngenicoOperation,
  reason: string,
  paymentRequest?: IngenicoPaymentRequest,
): IngenicoOperationResult {
  const baseDetails = `Mock fallback aktif.\nNeden: ${reason}`

  if (operation === 'payment') {
    return {
      isSuccess: true,
      isMock: true,
      isReady: true,
      operation,
      message: 'Mock Ingenico odemesi basarili.',
      details: `${baseDetails}\nReferans: ${paymentRequest?.customerReference ?? 'RDA-001'}`,
      orderNumber: `MOCK-${new Date().getTime()}`,
      receiptAmount: paymentRequest?.amount ?? 0,
      customerReference: paymentRequest?.customerReference ?? 'RDA-001',
    }
  }

  if (operation === 'cancel') {
    return {
      isSuccess: true,
      isMock: true,
      isReady: true,
      operation,
      message: 'Mock Ingenico iptal islemi basarili.',
      details: baseDetails,
    }
  }

  if (operation === 'pairing') {
    return {
      isSuccess: true,
      isMock: true,
      isReady: true,
      operation,
      message: 'Mock pairing tamamlandi.',
      details: baseDetails,
    }
  }

  return {
    isSuccess: true,
    isMock: true,
    isReady: true,
    isPairingRequired: false,
    operation,
    message: 'Mock Ingenico kontrolu basarili.',
    details: baseDetails,
  }
}

function createFailureResult(
  operation: IngenicoOperation,
  message: string,
  details?: string,
): IngenicoOperationResult {
  return {
    isSuccess: false,
    operation,
    message,
    details,
  }
}

async function readWorkerResult(responsePath: string): Promise<IngenicoOperationResult | null> {
  try {
    const raw = await readFile(responsePath, 'utf8')
    return JSON.parse(raw) as IngenicoOperationResult
  } catch {
    return null
  }
}

export async function runIngenicoOperation(
  app: App,
  settings: AppSettings,
  operation: IngenicoOperation,
  paymentRequest?: IngenicoPaymentRequest,
): Promise<IngenicoOperationResult> {
  const startedAt = Date.now()
  const runtimeDirectory = getResolvedRuntimeDirectory(app, settings.ingenico)

  if (process.platform !== 'win32') {
    const result = settings.ingenico.allowMockFallback
      ? createMockResult(operation, 'Windows disi ortam algilandi.', paymentRequest)
      : createFailureResult(operation, 'Ingenico entegrasyonu yalnizca Windows ortaminda calisir.')

    return {
      ...result,
      durationMs: Date.now() - startedAt,
    }
  }

  const workerPath = await findExistingWorkerPath(app, settings.ingenico)
  if (!workerPath) {
    const result = settings.ingenico.allowMockFallback
      ? createMockResult(operation, 'Ingenico worker bulunamadi.', paymentRequest)
      : createFailureResult(operation, 'Ingenico worker yolu bulunamadi.')

    return {
      ...result,
      durationMs: Date.now() - startedAt,
    }
  }

  const requestSettings: IngenicoSettings = {
    ...settings.ingenico,
    runtimeDirectory,
  }

  if (!(await hasRequiredRuntimeFiles(runtimeDirectory))) {
    const details = `Runtime: ${runtimeDirectory}`
    const result = settings.ingenico.allowMockFallback
      ? createMockResult(operation, 'Ingenico runtime dosyalari eksik.', paymentRequest)
      : createFailureResult(operation, 'Ingenico runtime dosyalari eksik.', details)

    return {
      ...result,
      details: result.details ?? details,
      durationMs: Date.now() - startedAt,
    }
  }

  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'resto-device-agent-ingenico-'))
  const requestPath = path.join(tempDirectory, 'request.json')
  const responsePath = path.join(tempDirectory, 'response.json')
  const requestBody: WorkerRequest = {
    operation,
    settings: requestSettings,
    paymentRequest,
  }

  try {
    await writeFile(requestPath, JSON.stringify(requestBody, null, 2), 'utf8')

    try {
      await execFileAsync(workerPath, ['--ingenico-worker', requestPath, responsePath], {
        windowsHide: true,
      })
    } catch (error) {
      const response = await readWorkerResult(responsePath)
      if (response) {
        return {
          ...response,
          operation,
          durationMs: Date.now() - startedAt,
        }
      }

      return {
        isSuccess: false,
        operation,
        message: error instanceof Error ? error.message : 'Ingenico worker calistirilamadi.',
        details: `Worker: ${workerPath}\nRuntime: ${requestSettings.runtimeDirectory}`,
        durationMs: Date.now() - startedAt,
      }
    }

    const response = await readWorkerResult(responsePath)
    if (!response) {
      return {
        isSuccess: false,
        operation,
        message: 'Ingenico worker gecersiz veya bos yanit dondurdu.',
        details: `Worker: ${workerPath}\nRuntime: ${requestSettings.runtimeDirectory}`,
        durationMs: Date.now() - startedAt,
      }
    }

    return {
      ...response,
      operation,
      durationMs: Date.now() - startedAt,
    }
  } finally {
    await rm(tempDirectory, { recursive: true, force: true })
  }
}
