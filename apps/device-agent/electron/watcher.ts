import { mkdir, readdir, rename, stat } from 'node:fs/promises'
import { statSync } from 'node:fs'
import path from 'node:path'
import chokidar, { type FSWatcher } from 'chokidar'
import type { AppSettings, PrintJobLog, PrinterConfig } from '../shared/types.js'
import { getPrinterNoFromPath, parseOrderFile } from './parser.js'
import { printReceipt } from './printer.js'

interface WatcherDependencies {
  onJob: (job: PrintJobLog) => void
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function shouldMirrorWholeOrderToPrinterTwo(rawLines: string[], keyword: string): boolean {
  const normalizedKeyword = keyword.trim()
  if (!normalizedKeyword) {
    return false
  }

  const pattern = new RegExp(`^${escapeRegExp(normalizedKeyword)}(?:\\b|\\s|[:.-])`, 'i')
  return rawLines.some((line) => pattern.test(line.trim()))
}

function stripMirrorKeyword(value: string, keyword: string): string {
  const normalizedKeyword = keyword.trim()
  if (!normalizedKeyword) {
    return value
  }

  const pattern = new RegExp(`^(\\s*)${escapeRegExp(normalizedKeyword)}(?:\\b|\\s|[:.-])*`, 'i')
  return value.replace(pattern, '$1')
}

function buildPrintablePreview(preview: ReturnType<typeof parseOrderFile> extends Promise<infer T> ? T : never, keyword: string) {
  return {
    ...preview,
    lines: preview.lines.map((line) => stripMirrorKeyword(line, keyword)),
    rawContent: preview.rawContent
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => stripMirrorKeyword(line, keyword))
      .join('\n'),
  }
}

export class PrintWatcher {
  private watcher: FSWatcher | null = null
  private readonly timers = new Map<string, NodeJS.Timeout>()
  private readonly handledFiles = new Map<string, number>()

  constructor(
    private readonly settings: AppSettings,
    private readonly dependencies: WatcherDependencies,
  ) {}

  async start(): Promise<void> {
    const watchDirectory = this.settings.general.watchDirectory.trim()
    const archiveRoot = this.getArchiveRootDirectory()

    if (!watchDirectory) {
      throw new Error('Izlenecek klasor belirtilmedi.')
    }

    try {
      const watchStat = statSync(watchDirectory)
      if (!watchStat.isDirectory()) {
        throw new Error(`Izlenecek yol klasor degil: ${watchDirectory}`)
      }
    } catch {
      throw new Error(`Izlenecek klasor bulunamadi: ${watchDirectory}`)
    }

    this.watcher = chokidar.watch(watchDirectory, {
      ignoreInitial: true,
      ignored: (candidatePath) => this.isInArchiveDirectory(candidatePath, archiveRoot),
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 250,
      },
      usePolling: true,
      interval: this.settings.general.pollIntervalSec * 1000,
      depth: 2,
    })

    this.watcher.on('add', (filePath) => this.schedule(filePath))
    this.watcher.on('change', (filePath) => this.schedule(filePath))

    await this.processExistingFiles(watchDirectory)
  }

  async stop(): Promise<void> {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()

    if (this.watcher) {
      await this.watcher.close()
      this.watcher = null
    }
  }

  private schedule(filePath: string): void {
    const existing = this.timers.get(filePath)
    if (existing) {
      clearTimeout(existing)
    }

    const timer = setTimeout(() => {
      void this.handleFile(filePath)
      this.timers.delete(filePath)
    }, 750)

    this.timers.set(filePath, timer)
  }

  private getArchiveRootDirectory(): string {
    return path.join(this.settings.general.watchDirectory.trim(), '_arsiv')
  }

  private getSuccessArchiveDirectory(): string {
    return this.settings.general.successArchiveDirectory.trim() || path.join(this.getArchiveRootDirectory(), 'Basarili')
  }

  private getErrorArchiveDirectory(): string {
    return this.settings.general.errorArchiveDirectory.trim() || path.join(this.getArchiveRootDirectory(), 'Hatali')
  }

  private isInArchiveDirectory(candidatePath: string, archiveRoot: string): boolean {
    const normalizedCandidate = path.resolve(candidatePath)
    const normalizedArchiveRoot = path.resolve(archiveRoot)
    return normalizedCandidate === normalizedArchiveRoot || normalizedCandidate.startsWith(`${normalizedArchiveRoot}${path.sep}`)
  }

  private async moveToArchive(filePath: string, status: 'success' | 'error' | 'ignored'): Promise<string> {
    const targetDirectory = status === 'success' ? this.getSuccessArchiveDirectory() : this.getErrorArchiveDirectory()
    const parsedPath = path.parse(filePath)
    let targetPath = path.join(targetDirectory, parsedPath.base)

    await mkdir(targetDirectory, { recursive: true })

    for (let index = 1; ; index += 1) {
      try {
        await rename(filePath, targetPath)
        this.handledFiles.delete(filePath)
        return targetPath
      } catch (error) {
        const errorCode = (error as NodeJS.ErrnoException).code
        if (errorCode === 'EEXIST') {
          targetPath = path.join(targetDirectory, `${parsedPath.name}-${Date.now()}-${index}${parsedPath.ext}`)
          continue
        }
        throw error
      }
    }
  }

  private async processExistingFiles(directoryPath: string, depth = 0): Promise<void> {
    const entries = await readdir(directoryPath, { withFileTypes: true })
    const archiveRoot = this.getArchiveRootDirectory()

    for (const entry of entries) {
      const entryPath = path.join(directoryPath, entry.name)

      if (this.isInArchiveDirectory(entryPath, archiveRoot)) {
        continue
      }

      if (entry.isDirectory()) {
        if (depth < 2) {
          await this.processExistingFiles(entryPath, depth + 1)
        }
        continue
      }

      if (entry.isFile()) {
        await this.handleFile(entryPath)
      }
    }
  }

  private async handleFile(filePath: string): Promise<void> {
    try {
      const fileStat = await stat(filePath)
      const knownMtime = this.handledFiles.get(filePath)

      if (knownMtime === fileStat.mtimeMs) {
        return
      }

      this.handledFiles.set(filePath, fileStat.mtimeMs)

      const printerNo = getPrinterNoFromPath(filePath)
      if (!printerNo) {
        const archivedPath = await this.moveToArchive(filePath, 'ignored')
        this.dependencies.onJob({
          id: `${Date.now()}-${Math.random()}`,
          filePath: archivedPath,
          fileName: path.basename(filePath),
          printerNo: null,
          printerName: null,
          status: 'ignored',
          message: 'Dosya sonundaki yazici numarasi okunamadi. Dosya Hatali klasorune tasindi.',
          createdAt: new Date().toISOString(),
        })
        return
      }

      const printer = this.settings.printers.find(
        (item: PrinterConfig) => item.enabled && item.printerNo === printerNo,
      )
      if (!printer) {
        const archivedPath = await this.moveToArchive(filePath, 'ignored')
        this.dependencies.onJob({
          id: `${Date.now()}-${Math.random()}`,
          filePath: archivedPath,
          fileName: path.basename(filePath),
          printerNo,
          printerName: null,
          status: 'ignored',
          message: `Yazici ${printerNo} icin eslesen aktif ayar bulunamadi. Dosya Hatali klasorune tasindi.`,
          createdAt: new Date().toISOString(),
        })
        return
      }

      const preview = await parseOrderFile(filePath)
      const printablePreview = buildPrintablePreview(preview, this.settings.general.printer2MirrorKeyword)
      const targetPrinters: PrinterConfig[] = [printer]
      const shouldMirrorToPrinterTwo =
        printer.printerNo !== 2 &&
        shouldMirrorWholeOrderToPrinterTwo(preview.lines, this.settings.general.printer2MirrorKeyword)

      if (shouldMirrorToPrinterTwo) {
        const printerTwo = this.settings.printers.find((item: PrinterConfig) => item.enabled && item.printerNo === 2)
        if (printerTwo && printerTwo.id !== printer.id) {
          targetPrinters.push(printerTwo)
        }
      }

      for (const targetPrinter of targetPrinters) {
        await printReceipt(printablePreview, this.settings, targetPrinter)
      }
      const archivedPath = await this.moveToArchive(filePath, 'success')

      this.dependencies.onJob({
        id: `${Date.now()}-${Math.random()}`,
        filePath: archivedPath,
        fileName: path.basename(filePath),
        printerNo,
        printerName: targetPrinters.map((item) => item.name).join(', '),
        status: 'success',
        message: `${targetPrinters.map((item) => item.name).join(', ')} yazicisina gonderildi ve dosya Basarili klasorune tasindi.`,
        createdAt: new Date().toISOString(),
        preview: printablePreview,
      })
    } catch (error) {
      const printerNo = getPrinterNoFromPath(filePath)
      let archivedPath = filePath
      try {
        archivedPath = await this.moveToArchive(filePath, 'error')
      } catch {
        archivedPath = filePath
      }
      this.dependencies.onJob({
        id: `${Date.now()}-${Math.random()}`,
        filePath: archivedPath,
        fileName: path.basename(filePath),
        printerNo,
        printerName: null,
        status: 'error',
        message: error instanceof Error ? `${error.message} Dosya Hatali klasorune tasindi.` : 'Bilinmeyen yazdirma hatasi. Dosya Hatali klasorune tasindi.',
        createdAt: new Date().toISOString(),
      })
    }
  }
}
