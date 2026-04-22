import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ReceiptFormat, ReceiptPreviewData } from '../shared/types.js'

function flattenValue(value: unknown, prefix = ''): string[] {
  if (value == null) {
    return []
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return [prefix ? `${prefix}: ${String(value)}` : String(value)]
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenValue(item, prefix ? `${prefix}[${index}]` : `Satir ${index + 1}`))
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
      flattenValue(nested, prefix ? `${prefix}.${key}` : key),
    )
  }

  return []
}

function detectPrinterNo(filePath: string): number | null {
  const match = path.basename(filePath).match(/\.(\d+)$/)
  return match ? Number(match[1]) : null
}

function normalizeTextContent(rawContent: string): string[] {
  return rawContent
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\t/g, '    ').trimEnd())
}

function buildJsonPreview(rawContent: string, filePath: string, printerNo: number): ReceiptPreviewData {
  const parsed = JSON.parse(rawContent) as Record<string, unknown>
  const title = typeof parsed.title === 'string' ? parsed.title : path.basename(filePath)
  const metadata: Record<string, string> = {
    Format: 'JSON',
  }

  const lines = Array.isArray(parsed.lines)
    ? parsed.lines.map((line) => String(line))
    : flattenValue(parsed)

  return {
    title,
    lines,
    metadata,
    sourceFile: filePath,
    printerNo,
    detectedFormat: 'json',
    rawContent,
  }
}

function buildTextPreview(rawContent: string, filePath: string, printerNo: number): ReceiptPreviewData {
  return {
    title: path.basename(filePath),
    lines: normalizeTextContent(rawContent),
    metadata: {
      Format: 'TEXT',
    },
    sourceFile: filePath,
    printerNo,
    detectedFormat: 'text',
    rawContent,
  }
}

export async function parseOrderFile(filePath: string): Promise<ReceiptPreviewData> {
  const printerNo = detectPrinterNo(filePath)
  if (!printerNo) {
    throw new Error('Dosya adinin sonunda yazici numarasi bulunamadi.')
  }

  const rawContent = await readFile(filePath, 'utf8')
  const trimmed = rawContent.trim()
  const format: ReceiptFormat = trimmed.startsWith('{') || trimmed.startsWith('[') ? 'json' : 'text'

  if (format === 'json') {
    try {
      return buildJsonPreview(rawContent, filePath, printerNo)
    } catch {
      return buildTextPreview(rawContent, filePath, printerNo)
    }
  }

  return buildTextPreview(rawContent, filePath, printerNo)
}

export function getPrinterNoFromPath(filePath: string): number | null {
  return detectPrinterNo(filePath)
}
