import type { GeneralSettings, PrinterConfig, ReceiptPreviewData } from './types.js'

export type ReceiptLineKind =
  | 'empty'
  | 'separator'
  | 'title'
  | 'subtitle'
  | 'headerRow'
  | 'time'
  | 'heading'
  | 'orderNumber'
  | 'product'
  | 'dynamicMain'
  | 'dynamicOption'
  | 'dynamicSummary'
  | 'content'
  | 'itemLine'
  | 'modifier'
  | 'meta'
  | 'summary'
  | 'status'
  | 'normal'

export interface StyledReceiptLine {
  text: string
  kind: ReceiptLineKind
  modifierMode?: 'remove' | 'add' | 'custom'
  displayText?: string
  orderSequence?: number
  trailingText?: string
}

interface ReceiptBuildOptions {
  stylePreset?: string
  headerText?: string
  footerText?: string
  extraLabel?: string
  removeLabel?: string
  customNoteLabel?: string
  moveStarredNotesToFooter?: boolean
  showOrderSequenceBadge?: boolean
  dynamicOptionDisplayMode?: 'classic' | 'grouped' | 'compact'
  showDynamicSelectionLabel?: boolean
  dynamicDrinkLabel?: string
  dynamicSauceLabel?: string
  dynamicOtherLabel?: string
  extPrefixKeyword?: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildReceiptLines(preview: ReceiptPreviewData): string[] {
  const metadataLines = Object.entries(preview.metadata).map(([key, value]) => `${key}: ${value}`)
  return [preview.title, '', ...metadataLines, ...(metadataLines.length > 0 ? [''] : []), ...preview.lines]
}

export function buildDisplayReceiptLines(preview: ReceiptPreviewData): string[] {
  const isManualPreview = preview.sourceFile === 'manuel-onizleme.txt'

  if (!isManualPreview && preview.detectedFormat === 'text') {
    return preview.lines
  }

  return buildReceiptLines(preview)
}

function getDeviceCode(preview: ReceiptPreviewData): string {
  const fileName = preview.title || preview.sourceFile
  const baseName = fileName.replace(/\.[^.]+$/, '')
  const match = baseName.match(/^([A-Z0-9-]+)-20\d{6,}/i)
  if (match?.[1]) {
    return match[1]
  }

  const compact = baseName.split('-').slice(0, 2).join('-')
  return compact || ''
}

function getOrderNumberCandidate(lines: string[], preview: ReceiptPreviewData): string {
  const standalone = lines.find((line) => /^\d{2,6}$/.test(line.trim()))
  if (standalone) {
    return standalone.trim()
  }

  const fileName = preview.title || preview.sourceFile
  const match = fileName.match(/(\d{3,6})(?!.*\d)/)
  return match?.[1] ?? ''
}

export function buildReceiptText(preview: ReceiptPreviewData): string {
  return `${buildDisplayReceiptLines(preview).join('\n').trimEnd()}\n`
}

function isSeparatorLine(line: string): boolean {
  return /^[-=*_]{5,}$/.test(line.trim())
}

function isLikelyOrderNumber(line: string): boolean {
  return /^\d{2,6}$/.test(line.trim())
}

function isTimeLine(line: string): boolean {
  return /^\d{1,2}:\d{2}$/.test(line.trim())
}

function isModifierLine(line: string): boolean {
  return /^\s*[-+*]\s*/.test(line) || /^(extra|cikar|çıkar|ozellik|özellik|not)\s*:/i.test(line.trim())
}

function parseModifierLine(line: string): Pick<StyledReceiptLine, 'text' | 'displayText' | 'modifierMode'> {
  const trimmed = line.trim()

  if (/^\+/.test(trimmed)) {
    const modifierMode = 'custom'
    const displayText = trimmed.replace(/^\+\s*/, '').replace(/^\+\s*/, '').trim()
    return { text: line, displayText, modifierMode }
  }

  if (/^-\s*\+/.test(trimmed)) {
    return {
      text: line,
      displayText: trimmed.replace(/^-\s*\+\s*/, '').trim(),
      modifierMode: 'custom',
    }
  }

  if (/^-\s*-/.test(trimmed)) {
    return {
      text: line,
      displayText: trimmed.replace(/^-\s*-\s*/, '').trim(),
      modifierMode: 'remove',
    }
  }

  if (/^[-+]\s*[-+]/.test(trimmed)) {
    const withoutLead = trimmed.replace(/^-\s*/, '')
    const modifierMode = withoutLead.startsWith('-') ? 'remove' : withoutLead.startsWith('+') ? 'add' : undefined
    const displayText = withoutLead.replace(/^[-+]\s*/, '').trim()
    return { text: line, displayText, modifierMode }
  }

  if (/^-/.test(trimmed)) {
    const modifierMode = 'custom'
    const displayText = trimmed.replace(/^-\s*/, '').trim()
    return { text: line, displayText, modifierMode }
  }

  const normalized = trimmed
    .replace(/^çıkar\s*:/i, '')
    .replace(/^cikar\s*:/i, '')
    .replace(/^extra\s*:/i, '')
    .replace(/^ozellik\s*:/i, '')
    .replace(/^özellik\s*:/i, '')
    .replace(/^not\s*:/i, '')
    .trim()

  if (/^(çıkar|cikar)\s*:/i.test(trimmed)) {
    return { text: line, displayText: normalized, modifierMode: 'remove' }
  }
  if (/^(extra|ozellik|özellik)\s*:/i.test(trimmed)) {
    return { text: line, displayText: normalized, modifierMode: 'add' }
  }
  if (/^not\s*:/i.test(trimmed)) {
    return { text: line, displayText: normalized, modifierMode: 'custom' }
  }

  return { text: line, displayText: trimmed, modifierMode: 'custom' }
}

function hasMeaningfulModifierText(line: Pick<StyledReceiptLine, 'displayText'>): boolean {
  const value = (line.displayText ?? '').replace(/[|.,:*+-]/g, '').trim()
  return value.length > 0
}

function isProductLine(line: string): boolean {
  return /^\s*\d+\s*x\b/i.test(line) || /^\s*\d+x\b/i.test(line)
}

function isMetaLine(line: string): boolean {
  return /^(tarih|saat|masa|format|toplam|toplam urun|telefon|sube|şube|adres)\s*:/i.test(line.trim())
}

function isHeaderRowLine(line: string): boolean {
  const trimmed = line.trim()
  return (
    /\d{2}\.\d{2}\.\d{4}/.test(trimmed) ||
    (/^[A-ZÇĞİÖŞÜ0-9/\s-]+$/.test(trimmed) && /\//.test(trimmed)) ||
    (/^[A-ZÇĞİÖŞÜ-]+\s{2,}.+/.test(line) && trimmed.length <= 40)
  )
}

function isItemLine(line: string): boolean {
  const trimmed = line.trim()
  return /^NO:\s*\d+/i.test(trimmed) || (/^[A-ZÇĞİÖŞÜ0-9&/\s-]+$/.test(trimmed) && trimmed.length > 20)
}

function isOrderHeaderLine(line: string): boolean {
  const trimmed = line.trim()
  return (
    /^NO:\s*\d+/i.test(trimmed) ||
    (/^[A-ZÇĞİÖŞÜ0-9&/\s.*-]+$/.test(trimmed) &&
      /\*\s*\d+\s*$/i.test(trimmed))
  )
}

function isStandaloneQuantityLine(line: string): boolean {
  return /^\d+$/.test(line.trim())
}

function isInlineQuantityItemLine(line: string): boolean {
  const trimmed = line.trim()
  if (!/^\S.*\s+\d+$/.test(trimmed)) {
    return false
  }

  if (/çağrı|cagri/i.test(trimmed)) {
    return false
  }

  if (trimmed.includes(':')) {
    return false
  }

  if (isHeaderRowLine(trimmed) || isTimeLine(trimmed) || isSeparatorLine(trimmed) || isMetaLine(trimmed)) {
    return false
  }

  return /[A-ZÇĞİÖŞÜ]/.test(trimmed)
}

function splitTrailingQuantity(line: string): { label: string; quantity?: string } {
  const trimmed = line.trim()
  const match = trimmed.match(/^(.*\S)\s+(\d+)$/)
  if (!match) {
    return { label: trimmed }
  }

  return {
    label: match[1].trim(),
    quantity: match[2],
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isExtPrefixLine(line: string, keyword = 'EXT'): boolean {
  const normalizedKeyword = keyword.trim()
  if (!normalizedKeyword) {
    return false
  }

  const pattern = new RegExp(`^${escapeRegExp(normalizedKeyword)}(?:\\b|\\s|[:.-])`, 'i')
  return pattern.test(line.trim())
}

function parseExtPrefixLine(line: string, keyword = 'EXT'): string {
  const normalizedKeyword = keyword.trim()
  if (!normalizedKeyword) {
    return line.trim()
  }

  const pattern = new RegExp(`^${escapeRegExp(normalizedKeyword)}(?:\\b|\\s|[:.-])*`, 'i')
  const raw = line.trim().replace(pattern, '').trim()
  const split = splitTrailingQuantity(raw)
  if (split.quantity && split.quantity !== '1') {
    return `${split.label} x${split.quantity}`.trim()
  }
  return split.label.trim()
}

function isSubtitleLine(line: string): boolean {
  const trimmed = line.trim()
  return /^[A-Z0-9-]{6,}$/.test(trimmed) && /[A-Z]/.test(trimmed) && trimmed.length <= 28
}

function isSummaryLine(line: string): boolean {
  return /^toplam\s+urun\b/i.test(line.trim())
}

function isStatusLine(line: string): boolean {
  return /\*{1,}.*(hazirlaniyor|hazırlanıyor|tamamlandi|tamamlandı|iptal|satis|servis|gel-al|paket).*?\*{1,}/i.test(line.trim())
}

function isStarredNoteLine(line: string): boolean {
  return /^\*{1,}.+\*{1,}$/.test(line.trim())
}

function isHeadingLine(line: string): boolean {
  const trimmed = line.trim()
  return (
    trimmed.length > 0 &&
    (trimmed.includes('***') ||
      /sipariş no|siparis no|hazirlaniyor|hazırlanıyor/i.test(trimmed) ||
      (/^[A-Z0-9ÇĞİÖŞÜ\s]+$/.test(trimmed) && trimmed.length <= 32))
  )
}

function isUppercaseFoodLine(line: string): boolean {
  const trimmed = line.trim()
  return (
    trimmed.length > 0 &&
    trimmed.length <= 40 &&
    /[A-ZÇĞİÖŞÜ]/.test(trimmed) &&
    !/^NO:\s*\d+/i.test(trimmed) &&
    !isSeparatorLine(trimmed) &&
    !isStatusLine(trimmed) &&
    trimmed === trimmed.toLocaleUpperCase('tr-TR')
  )
}

function buildKitchenStyledReceiptLines(lines: string[], options: ReceiptBuildOptions = {}): StyledReceiptLine[] {
  const result: StyledReceiptLine[] = []
  let inItemsSection = false
  let itemContentIndex = 0
  let currentItemIsDynamic = false
  const extPrefixKeyword = options.extPrefixKeyword?.trim() || 'EXT'

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const trimmed = line.trim()
    let styledLine: StyledReceiptLine

    if (!trimmed) {
      styledLine = { text: line, kind: 'empty' }
      result.push(styledLine)
      continue
    }

    if (trimmed === '--') {
      styledLine = { text: line, kind: 'separator', displayText: '--------------------------------' }
      result.push(styledLine)
      continue
    }

    if (isSeparatorLine(line)) {
      inItemsSection = false
      itemContentIndex = 0
      currentItemIsDynamic = false
      styledLine = { text: line, kind: 'separator' }
      result.push(styledLine)
      continue
    }

    // Some dynamic-menu exports inject a status marker immediately after the
    // starred header, before the actual selected item/options. Keep that
    // marker for footer/status usage, but do not let it break the current
    // dynamic item parsing flow.
    if (inItemsSection && currentItemIsDynamic && itemContentIndex === 0 && (isStatusLine(line) || isStarredNoteLine(line))) {
      result.push({ text: line, kind: 'status' })
      continue
    }

    if (isStatusLine(line) || isStarredNoteLine(line)) {
      inItemsSection = false
      styledLine = { text: line, kind: 'status' }
      result.push(styledLine)
      continue
    }

    if (isHeaderRowLine(line)) {
      inItemsSection = false
      itemContentIndex = 0
      currentItemIsDynamic = false
      styledLine = { text: line, kind: 'headerRow' }
      result.push(styledLine)
      continue
    }

    if (isTimeLine(line)) {
      inItemsSection = false
      itemContentIndex = 0
      currentItemIsDynamic = false
      styledLine = { text: line, kind: 'time' }
      result.push(styledLine)
      continue
    }

    if (inItemsSection && isExtPrefixLine(line, extPrefixKeyword)) {
      const displayText = parseExtPrefixLine(line, extPrefixKeyword)
      if (displayText) {
        result.push({
          text: line,
          displayText,
          kind: 'modifier',
          modifierMode: 'add',
        })
      }
      if (index + 1 < lines.length && isStandaloneQuantityLine(lines[index + 1])) {
        index += 1
      }
      continue
    }

    if (isInlineQuantityItemLine(line)) {
      inItemsSection = true
      itemContentIndex = 0
      currentItemIsDynamic = trimmed.includes('*')
      const split = splitTrailingQuantity(line)
      styledLine = {
        text: line,
        displayText: split.label,
        trailingText: split.quantity,
        kind: 'itemLine',
      }
      result.push(styledLine)
      continue
    }

    if (
      isUppercaseFoodLine(line) &&
      index + 1 < lines.length &&
      isStandaloneQuantityLine(lines[index + 1])
    ) {
      inItemsSection = true
      itemContentIndex = 0
      currentItemIsDynamic = trimmed.includes('*')
      styledLine = {
        text: `${line} ${lines[index + 1].trim()}`,
        displayText: trimmed,
        trailingText: lines[index + 1].trim(),
        kind: 'itemLine',
      }
      result.push(styledLine)
      index += 1
      continue
    }

    if (isOrderHeaderLine(line)) {
      inItemsSection = true
      itemContentIndex = 0
      currentItemIsDynamic = trimmed.includes('*')
      const split = splitTrailingQuantity(line)
      styledLine = {
        text: line,
        displayText: split.label,
        trailingText: split.quantity,
        kind: 'itemLine',
      }
      result.push(styledLine)
      continue
    }

    if (inItemsSection && isModifierLine(line)) {
      styledLine = { kind: 'modifier', ...parseModifierLine(line) }
      if (!hasMeaningfulModifierText(styledLine)) {
        continue
      }
      result.push(styledLine)
      continue
    }

    if (inItemsSection && isUppercaseFoodLine(line)) {
      styledLine = {
        text: line,
        displayText: currentItemIsDynamic
          ? itemContentIndex === 0
            ? options.showDynamicSelectionLabel === false
              ? trimmed
              : `Secim: ${trimmed}`
            : `Ozellik: ${trimmed}`
          : trimmed.replace(/^-\s*/, ''),
        kind: currentItemIsDynamic
          ? itemContentIndex === 0
            ? 'dynamicMain'
            : 'dynamicOption'
          : 'content',
      }
      result.push(styledLine)
      itemContentIndex += 1
      continue
    }

    if (isModifierLine(line)) {
      styledLine = { kind: 'modifier', ...parseModifierLine(line) }
      if (!hasMeaningfulModifierText(styledLine)) {
        continue
      }
      result.push(styledLine)
      continue
    }

    if (isSummaryLine(line)) {
      styledLine = { text: line, kind: 'summary' }
      result.push(styledLine)
      continue
    }

    if (isMetaLine(line)) {
      styledLine = { text: line, kind: 'meta' }
      result.push(styledLine)
      continue
    }

    if (isHeadingLine(line)) {
      styledLine = { text: line, kind: 'heading' }
      result.push(styledLine)
      continue
    }

    if (isProductLine(line) || isItemLine(line)) {
      styledLine = { text: line, kind: 'product' }
      result.push(styledLine)
      continue
    }

    if (isLikelyOrderNumber(line)) {
      styledLine = { text: line, kind: 'orderNumber' }
      result.push(styledLine)
      continue
    }

    styledLine = { text: line, kind: 'normal' }
    result.push(styledLine)
  }

  return result
}

function mergeAdjacentModifierLines(lines: StyledReceiptLine[], options: ReceiptBuildOptions = {}): StyledReceiptLine[] {
  const merged: StyledReceiptLine[] = []
  let buffer: StyledReceiptLine[] = []

  const flush = () => {
    if (buffer.length === 0) {
      return
    }

    if (buffer.length === 1) {
      const single = buffer[0]
      if (single.modifierMode === 'add' && single.displayText?.trim()) {
        merged.push({
          ...single,
          displayText: `${options.extraLabel ?? 'Extra'}: ${single.displayText.trim()}`,
        })
      } else if (single.modifierMode === 'custom' && single.displayText?.trim()) {
        merged.push({
          ...single,
          displayText: `${options.customNoteLabel ?? 'Not'}: ${single.displayText.trim()}`,
        })
      } else {
        merged.push(single)
      }
      buffer = []
      return
    }

    const mode = buffer[0].modifierMode
    const allSameMode = buffer.every((item) => item.kind === 'modifier' && item.modifierMode === mode && item.displayText?.trim())

    if (!allSameMode || !mode) {
      merged.push(...buffer)
      buffer = []
      return
    }

    const label =
      mode === 'remove'
        ? `${options.removeLabel ?? 'Cikar'}: `
        : mode === 'add'
          ? `${options.extraLabel ?? 'Extra'}: `
          : `${options.customNoteLabel ?? 'Not'}: `

    merged.push({
      text: buffer.map((item) => item.text).join(' | '),
      displayText: `${label}${buffer.map((item) => item.displayText?.trim()).filter(Boolean).join(' | ')}`,
      kind: 'modifier',
      modifierMode: mode,
    })
    buffer = []
  }

  for (const line of lines) {
    if (line.kind === 'modifier' && line.modifierMode) {
      if (buffer.length === 0 || buffer[0].modifierMode === line.modifierMode) {
        buffer.push(line)
        continue
      }

      flush()
      buffer.push(line)
      continue
    }

    flush()
    merged.push(line)
  }

  flush()
  return merged
}

function mergeDynamicOptionBlocks(
  lines: StyledReceiptLine[],
  mode: 'grouped' | 'compact' = 'grouped',
): StyledReceiptLine[] {
  const merged: StyledReceiptLine[] = []
  let buffer: StyledReceiptLine[] = []

  const normalizeDynamicOption = (value: string): string =>
    value.replace(/^\s*[-•]\s*/, '').replace(/^Ozellik:\s*/i, '').replace(/^Secim:\s*/i, '').trim()

  const buildGroupedDynamicSummary = (values: string[]): string =>
    values
      .map((value) => normalizeDynamicOption(value))
      .filter(Boolean)
      .join(', ')

  const buildCompactDynamicSummary = (values: string[]): string =>
    values
      .map((value) => normalizeDynamicOption(value))
      .filter(Boolean)
      .join(', ')

  const flush = () => {
    if (buffer.length === 0) {
      return
    }

    merged.push({
      ...buffer[0],
      text: buffer.map((item) => item.text).join('\n'),
      displayText:
        mode === 'compact'
          ? buildCompactDynamicSummary(buffer.map((item) => item.displayText ?? item.text))
          : buildGroupedDynamicSummary(buffer.map((item) => item.displayText ?? item.text)),
      kind: mode === 'compact' ? 'dynamicOption' : 'content',
    })
    buffer = []
  }

  for (const line of lines) {
    if (line.kind === 'dynamicOption') {
      buffer.push(line)
      continue
    }

    flush()
    merged.push(line)
  }

  flush()
  return merged
}

function normalizeDynamicMenuBlocks(lines: StyledReceiptLine[], options: ReceiptBuildOptions = {}): StyledReceiptLine[] {
  const normalized: StyledReceiptLine[] = []
  let activeDynamic = false
  let seenDynamicMain = false

  const isBlockBoundary = (kind: ReceiptLineKind): boolean =>
    ['itemLine', 'separator', 'summary', 'status', 'meta', 'headerRow', 'time', 'heading', 'orderNumber', 'title', 'subtitle'].includes(kind)

  for (const line of lines) {
    const label = (line.displayText ?? line.text).trim()

    if (line.kind === 'itemLine') {
      activeDynamic = label.includes('*')
      seenDynamicMain = false
      normalized.push(line)
      continue
    }

    if (activeDynamic && isBlockBoundary(line.kind)) {
      activeDynamic = false
      seenDynamicMain = false
      normalized.push(line)
      continue
    }

    if (!activeDynamic) {
      normalized.push(line)
      continue
    }

    if (line.kind === 'modifier') {
      normalized.push(line)
      continue
    }

    if (line.kind === 'empty') {
      continue
    }

    const text = (line.displayText ?? line.text).trim()
    if (!text) {
      continue
    }

    if (!seenDynamicMain) {
      normalized.push({
        ...line,
        displayText: options.showDynamicSelectionLabel === false ? text : `Secim: ${text.replace(/^Secim:\s*/i, '')}`,
        kind: 'dynamicMain',
      })
      seenDynamicMain = true
      continue
    }

    normalized.push({
      ...line,
        displayText: `Ozellik: ${text.replace(/^\s*[-•]\s*/, '').replace(/^Ozellik:\s*/i, '')}`,
      kind: 'dynamicOption',
    })
  }

  return normalized
}

function collapseDynamicMenuSections(lines: StyledReceiptLine[], options: ReceiptBuildOptions = {}): StyledReceiptLine[] {
  const collapsed: StyledReceiptLine[] = []
  const dynamicMode = options.dynamicOptionDisplayMode ?? 'compact'

  const isBoundary = (kind: ReceiptLineKind): boolean =>
    ['itemLine', 'separator', 'summary', 'status', 'meta', 'headerRow', 'time', 'heading', 'orderNumber', 'title', 'subtitle'].includes(kind)

  const normalizeDynamicText = (value: string): string =>
    value
      .replace(/^\s*[-•]\s*/, '')
      .replace(/^Ozellik:\s*/i, '')
      .replace(/^Secim:\s*/i, '')
      .trim()

  const buildDynamicDetailSummary = (selection: string, values: string[]): string => {
    const parts = [selection, ...values.map(normalizeDynamicText)].filter(Boolean)
    return parts.join(', ')
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const label = (line.displayText ?? line.text).trim()

    if (line.kind !== 'itemLine' || !label.includes('*')) {
      collapsed.push(line)
      continue
    }

    collapsed.push(line)

    const section: StyledReceiptLine[] = []
    let cursor = index + 1
    while (cursor < lines.length && !isBoundary(lines[cursor].kind)) {
      section.push(lines[cursor])
      cursor += 1
    }

    const selection = section.find((entry) => entry.kind !== 'modifier' && (entry.displayText ?? entry.text).trim())
    const modifiers = section
      .filter((entry) => entry.kind === 'modifier')
      .map((entry) => {
        const raw = entry.text.trim()
        if (/^\+/.test(raw)) {
          return {
            ...entry,
            modifierMode: 'custom' as const,
            displayText: (entry.displayText ?? raw).replace(/^\+\s*/, '').trim(),
          }
        }
        return entry
      })
    const features = section
      .filter((entry) => entry !== selection && entry.kind !== 'modifier')
      .map((entry) => entry.displayText ?? entry.text)
      .filter((entry) => entry.trim().length > 0)

    const selectionText = selection ? normalizeDynamicText(selection.displayText ?? selection.text) : ''
    if (selectionText) {
      collapsed.push({
        text: selectionText,
        displayText:
          dynamicMode === 'grouped'
            ? selectionText
            : options.showDynamicSelectionLabel === false
              ? selectionText
              : `Secim: ${selectionText}`,
        kind: dynamicMode === 'grouped' ? 'dynamicMain' : 'product',
      })
    }

    if (dynamicMode === 'compact') {
      const detailSummary = buildDynamicDetailSummary('', features)
      if (detailSummary) {
        collapsed.push({
          text: detailSummary,
          displayText: detailSummary,
          kind: 'dynamicOption',
        })
      }
    } else if (dynamicMode === 'grouped') {
      const detailSummary = buildDynamicDetailSummary('', features)
      if (detailSummary) {
        collapsed.push({
          text: detailSummary,
          displayText: detailSummary,
          kind: 'content',
        })
      }
    } else {
      for (const feature of features) {
        const normalizedFeature = normalizeDynamicText(feature)
        if (!normalizedFeature) {
          continue
        }
        collapsed.push({
          text: normalizedFeature,
          displayText: `Ozellik: ${normalizedFeature}`,
          kind: 'dynamicOption',
        })
      }
    }

    collapsed.push(...modifiers)
    index = cursor - 1
  }

  return collapsed
}

function standardizeGroupedDynamicSections(lines: StyledReceiptLine[], options: ReceiptBuildOptions = {}): StyledReceiptLine[] {
  if (options.dynamicOptionDisplayMode !== 'grouped') {
    return lines
  }

  const standardized: StyledReceiptLine[] = []
  const isBoundary = (kind: ReceiptLineKind): boolean =>
    ['itemLine', 'separator', 'summary', 'status', 'meta', 'headerRow', 'time', 'heading', 'orderNumber', 'title', 'subtitle'].includes(kind)

  const normalizeSectionText = (value: string): string =>
    value
      .replace(/^Secim:\s*/i, '')
      .replace(/^Ozellik:\s*/i, '')
      .replace(/^Ozellikler:\s*/i, '')
      .replace(/\b(Icecek|İcecek|Sos|Diger)\s*:\s*/gi, '')
      .replace(/\s*\|\s*/g, ', ')
      .replace(/\s*,\s*/g, ', ')
      .trim()

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const label = (line.displayText ?? line.text).trim()

    if (line.kind !== 'itemLine' || !label.includes('*')) {
      standardized.push(line)
      continue
    }

    standardized.push(line)

    const section: StyledReceiptLine[] = []
    let cursor = index + 1
    while (cursor < lines.length && !isBoundary(lines[cursor].kind)) {
      section.push(lines[cursor])
      cursor += 1
    }

    const selection = section.find((entry) => entry.kind !== 'modifier' && normalizeSectionText(entry.displayText ?? entry.text))
    const features = section
      .filter((entry) => entry !== selection && entry.kind !== 'modifier')
      .map((entry) => normalizeSectionText(entry.displayText ?? entry.text))
      .filter(Boolean)

    if (selection) {
      const selectionText = normalizeSectionText(selection.displayText ?? selection.text)
      standardized.push({
        text: selectionText,
        displayText: options.showDynamicSelectionLabel === false ? selectionText : `Secim: ${selectionText}`,
        kind: 'dynamicMain',
      })
    }

    if (features.length > 0) {
      standardized.push({
        text: features.join(', '),
        displayText: features.join(', '),
        kind: 'dynamicSummary',
      })
    }

    standardized.push(...section.filter((entry) => entry.kind === 'modifier'))
    index = cursor - 1
  }

  return standardized
}

function mergeStandaloneQuantityIntoPrevious(lines: StyledReceiptLine[]): StyledReceiptLine[] {
  const merged: StyledReceiptLine[] = []

  for (const line of lines) {
    const candidateText = (line.displayText ?? line.text).trim()
    const previous = merged.length > 0 ? merged[merged.length - 1] : undefined

    if (
      previous &&
      isStandaloneQuantityLine(candidateText) &&
      (previous.kind === 'itemLine' || previous.kind === 'product') &&
      !previous.trailingText
    ) {
      previous.trailingText = candidateText
      previous.kind = 'itemLine'
      if (!previous.displayText) {
        previous.displayText = previous.text
      }
      continue
    }

    merged.push(line)
  }

  return merged
}

function normalizeFooterStatuses(lines: StyledReceiptLine[], options: ReceiptBuildOptions = {}): StyledReceiptLine[] {
  if (!options.moveStarredNotesToFooter) {
    return lines
  }

  const body: StyledReceiptLine[] = []
  const seen = new Set<string>()
  const footerStatuses: StyledReceiptLine[] = []

  for (const line of lines) {
    if (line.kind !== 'status') {
      body.push(line)
      continue
    }

    const key = (line.displayText ?? line.text).trim()
    if (!key || seen.has(key)) {
      continue
    }

    seen.add(key)
    footerStatuses.push(line)
  }

  if (footerStatuses.length === 0) {
    return body
  }

  while (body.length > 0 && body[body.length - 1].kind === 'empty') {
    body.pop()
  }

  const lastLine = body.length > 0 ? body[body.length - 1] : undefined
  if (lastLine?.kind !== 'separator') {
    body.push({ text: '--------------------------------', kind: 'separator' })
  }

  body.push(footerStatuses[0])
  return body
}

function applyOrderSequenceBadges(lines: StyledReceiptLine[], options: ReceiptBuildOptions = {}): StyledReceiptLine[] {
  if (!options.showOrderSequenceBadge) {
    return lines
  }

  let sequence = 0
  return lines.map((line) => {
    const label = (line.displayText ?? line.text).trim()
    if (line.kind !== 'itemLine' || label.includes(':') || /çağrı|cagri/i.test(label)) {
      return line
    }

    sequence += 1
    return {
      ...line,
      orderSequence: sequence,
    }
  })
}

function normalizeSearchableText(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
}

function normalizePackageServiceFooter(preview: ReceiptPreviewData, lines: StyledReceiptLine[]): StyledReceiptLine[] {
  const sourceLines = buildDisplayReceiptLines(preview)
    .slice(0, 4)
    .map((line) => normalizeSearchableText(line.trim()))
  const isPackageService =
    sourceLines.some((line) => line.includes('paket servis')) ||
    normalizeSearchableText(preview.title).includes('paket servis')

  if (!isPackageService) {
    return lines
  }

  return lines.map((line) =>
    line.kind === 'status'
      ? {
          ...line,
          text: '***PAKET***',
          displayText: '***PAKET***',
        }
      : line,
  )
}

function buildKioskStyledReceiptLines(preview: ReceiptPreviewData, options: ReceiptBuildOptions): StyledReceiptLine[] {
  const rawLines = buildDisplayReceiptLines(preview)
  const contentLines = rawLines.filter((line) => line.trim().length > 0 && line.trim() !== '--')
  const detailLines = contentLines.filter(
    (line) => !/^NO:\s*\d+/i.test(line.trim()) && !/^\*{2,}.*\*{2,}$/.test(line.trim()) && !isSeparatorLine(line),
  )
  const itemLines = buildKitchenStyledReceiptLines(rawLines).filter((line) =>
    ['itemLine', 'product', 'dynamicMain', 'dynamicOption', 'dynamicSummary', 'content', 'modifier', 'separator', 'summary', 'status', 'empty', 'normal'].includes(line.kind),
  )

  const headerText = options.headerText?.trim() || 'KIOSK'
  const footerText = options.footerText?.trim() || '*** HAZIRLANIYOR ***'
  const deviceCode = getDeviceCode(preview)
  const orderNumber = getOrderNumberCandidate(rawLines, preview)
  const result: StyledReceiptLine[] = []

  result.push({ text: '================================', kind: 'separator' })
  result.push({ text: headerText, kind: 'title' })
  if (deviceCode) {
    result.push({ text: deviceCode, kind: 'subtitle' })
  }
  if (orderNumber) {
    result.push({ text: '', kind: 'empty' })
    result.push({ text: 'SIPARIS NO', kind: 'heading' })
    result.push({ text: orderNumber, kind: 'orderNumber' })
  }
  result.push({ text: '', kind: 'empty' })
  result.push({ text: '--------------------------------', kind: 'separator' })

  for (const line of detailLines.slice(0, 3)) {
    if (isTimeLine(line)) {
      result.push({ text: line.trim(), kind: 'time' })
    } else if (isHeaderRowLine(line) || line.trim().includes('/')) {
      result.push({ text: line.trim(), kind: 'headerRow' })
    } else {
      result.push({ text: line, kind: 'meta' })
    }
  }

  result.push({ text: '--------------------------------', kind: 'separator' })

  for (const line of itemLines) {
    if (line.kind === 'status') {
      continue
    }
    result.push(line)
  }

  const hasSummary = result.some((line) => line.kind === 'summary')
  if (!hasSummary) {
    const itemCount = itemLines.filter((line) => line.kind === 'itemLine').length
    result.push({ text: '--------------------------------', kind: 'separator' })
    result.push({ text: `TOPLAM URUN: ${itemCount}`, kind: 'summary' })
  }

  result.push({ text: '--------------------------------', kind: 'separator' })
  result.push({ text: footerText, kind: 'status' })
  result.push({ text: '================================', kind: 'separator' })

  return result
}

export function buildStyledReceiptLines(preview: ReceiptPreviewData, options: ReceiptBuildOptions = {}): StyledReceiptLine[] {
  const lines = buildDisplayReceiptLines(preview)
  const isManualPreview = preview.sourceFile === 'manuel-onizleme.txt'
  const maybeMergeDynamicOptions = (input: StyledReceiptLine[]) =>
    options.dynamicOptionDisplayMode === 'classic'
      ? input
      : mergeDynamicOptionBlocks(input, options.dynamicOptionDisplayMode === 'compact' ? 'compact' : 'grouped')
  const normalizeDynamicMenus = (input: StyledReceiptLine[]) => normalizeDynamicMenuBlocks(input, options)
  const collapseDynamicMenus = (input: StyledReceiptLine[]) => collapseDynamicMenuSections(input, options)
  const standardizeGroupedDynamics = (input: StyledReceiptLine[]) => standardizeGroupedDynamicSections(input, options)

  if ((options.stylePreset === 'german-doner' || options.stylePreset === 'kiosk-mutfak') && !isManualPreview) {
    return applyOrderSequenceBadges(
      normalizePackageServiceFooter(
        preview,
        mergeStandaloneQuantityIntoPrevious(
          normalizeFooterStatuses(
            standardizeGroupedDynamics(
              maybeMergeDynamicOptions(
                collapseDynamicMenus(
                  normalizeDynamicMenus(mergeAdjacentModifierLines(buildKioskStyledReceiptLines(preview, options), options)),
                ),
              ),
            ),
            options,
          ),
        ),
      ),
      options,
    )
  }

  if (!isManualPreview && preview.detectedFormat === 'text') {
    return applyOrderSequenceBadges(
      normalizePackageServiceFooter(
        preview,
        mergeStandaloneQuantityIntoPrevious(
          normalizeFooterStatuses(
            standardizeGroupedDynamics(
              maybeMergeDynamicOptions(
                collapseDynamicMenus(
                  normalizeDynamicMenus(mergeAdjacentModifierLines(buildKitchenStyledReceiptLines(lines, options), options)),
                ),
              ),
            ),
            options,
          ),
        ),
      ),
      options,
    )
  }

  const firstContentIndex = lines.findIndex((line) => line.trim().length > 0)

  return lines.map((line, index) => {
    const trimmed = line.trim()

    if (!trimmed) {
      return { text: line, kind: 'empty' }
    }
    if (isSeparatorLine(line)) {
      return { text: line, kind: 'separator' }
    }
    if (isHeaderRowLine(line)) {
      return { text: line, kind: 'headerRow' }
    }
    if (isTimeLine(line)) {
      return { text: line, kind: 'time' }
    }
    if (index === firstContentIndex || (index <= 2 && trimmed.length > 0 && !trimmed.includes(':') && !isProductLine(trimmed))) {
      return { text: line, kind: 'title' }
    }
    if (index <= 3 && isSubtitleLine(line)) {
      return { text: line, kind: 'subtitle' }
    }
    if (isLikelyOrderNumber(line)) {
      return { text: line, kind: 'orderNumber' }
    }
    if (isStatusLine(line)) {
      return { text: line, kind: 'status' }
    }
    if (isSummaryLine(line)) {
      return { text: line, kind: 'summary' }
    }
    if (isItemLine(line)) {
      return { text: line, kind: 'itemLine' }
    }
    if (isHeadingLine(line)) {
      return { text: line, kind: 'heading' }
    }
    if (isProductLine(line)) {
      return { text: line, kind: 'product' }
    }
    if (isModifierLine(line)) {
      return { kind: 'modifier', ...parseModifierLine(line) }
    }
    if (isMetaLine(line)) {
      return { text: line, kind: 'meta' }
    }

    return { text: line, kind: 'normal' }
  })
}

export function renderReceiptHtml(
  preview: ReceiptPreviewData,
  general: GeneralSettings,
  printer?: PrinterConfig,
): string {
  const paperWidth = printer?.paperWidth ?? general.previewPaperWidth
  const fontSize = Math.round(general.previewFontSize * (printer?.fontScale ?? 1) * 10) / 10
  const thermalMode = general.thermalPrinterMode !== false
  const stylePresetClass = `style-${(general.previewStylePreset || 'fastrest').replace(/[^a-z0-9-]/gi, '-')}`
  const styledLines = buildStyledReceiptLines(preview, {
    stylePreset: general.previewStylePreset,
    headerText: general.receiptHeaderText,
    footerText: general.receiptFooterText,
    extraLabel: general.receiptExtraLabel,
    removeLabel: general.receiptRemoveLabel,
    customNoteLabel: general.receiptCustomNoteLabel,
    moveStarredNotesToFooter: general.moveStarredNotesToFooter,
    showOrderSequenceBadge: general.showOrderSequenceBadge,
    dynamicOptionDisplayMode: general.dynamicOptionDisplayMode,
    showDynamicSelectionLabel: general.showDynamicSelectionLabel,
    dynamicDrinkLabel: general.dynamicDrinkLabel,
    dynamicSauceLabel: general.dynamicSauceLabel,
    dynamicOtherLabel: general.dynamicOtherLabel,
    extPrefixKeyword: general.extPrefixKeyword,
  })
    .map(({ text, kind, modifierMode, displayText, orderSequence, trailingText }) => {
      const content = escapeHtml(displayText ?? text) || '&nbsp;'
      const modeClass = modifierMode ? ` line-modifier-${modifierMode}` : ''
      const badge = orderSequence ? `<span class="line-number-badge">${orderSequence}</span>` : ''
      if (kind === 'itemLine') {
        const quantity = trailingText ? `<span class="line-trailing-text">${escapeHtml(trailingText)}</span>` : ''
        return `<div class="line line-${kind}${modeClass}">${badge}<span class="line-text line-main-text">${content}</span>${quantity}</div>`
      }
      return `<div class="line line-${kind}${modeClass}">${badge}<span class="line-text">${content}</span></div>`
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="tr">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(preview.title)}</title>
    <style>
      ${thermalMode ? `@page {
        size: ${paperWidth}mm auto;
        margin: 0;
      }` : ''}
      @page {
        margin: ${thermalMode ? '0' : '8mm'};
      }
      body {
        margin: 0;
        padding: ${thermalMode ? '0' : '16px'};
        font-family: ${general.previewFontFamily};
        background: ${thermalMode ? '#ffffff' : '#f4f5f7'};
        color: #111827;
      }
      .receipt {
        width: ${paperWidth}mm;
        margin: ${thermalMode ? '0' : '0 auto'};
        background: white;
        box-shadow: ${thermalMode ? 'none' : '0 10px 30px rgba(15, 23, 42, 0.12)'};
        border-radius: ${thermalMode ? '0' : '12px'};
        padding: ${thermalMode ? '4px 6px' : '14px 16px'};
        box-sizing: border-box;
      }
      .lines {
        font-size: ${fontSize}px;
        line-height: ${general.previewLineHeight};
        letter-spacing: ${general.previewLetterSpacing}px;
      }
      .line {
        white-space: pre-wrap;
        word-break: break-word;
        display: block;
      }
      .line-text {
        vertical-align: middle;
      }
      .line-main-text {
        flex: 1;
      }
      @media print {
        html, body {
          width: ${paperWidth}mm;
          background: #ffffff;
        }
        body {
          overflow: hidden;
        }
        .receipt {
          width: ${paperWidth}mm;
          margin: 0;
          padding: 2px 4px;
          box-shadow: none;
          border-radius: 0;
        }
      }
      .line-trailing-text {
        margin-left: 12px;
        min-width: 1.5em;
        text-align: right;
        font-weight: 800;
      }
      .line-number-badge {
        display: inline-grid;
        place-items: center;
        width: 1.75em;
        height: 1.75em;
        margin-right: 10px;
        background: #111827;
        color: #ffffff;
        border: 2px solid #111827;
        border-radius: 999px;
        font-size: 0.88em;
        font-weight: 800;
        line-height: 1;
        vertical-align: middle;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.18);
      }
      .line-empty {
        min-height: ${Math.max(fontSize * 0.7, 10)}px;
      }
      .line-title {
        text-align: center;
        font-weight: 800;
        font-size: ${Math.round(fontSize * 1.35 * 10) / 10}px;
        letter-spacing: ${Math.max(general.previewLetterSpacing + 0.2, 0.2)}px;
      }
      .line-heading {
        text-align: center;
        font-weight: 800;
        font-size: ${Math.round(fontSize * 1.18 * 10) / 10}px;
      }
      .line-subtitle {
        text-align: center;
        font-weight: 700;
        font-size: ${Math.round(fontSize * 1.1 * 10) / 10}px;
      }
      .line-headerRow {
        font-weight: 800;
        letter-spacing: ${Math.max(general.previewLetterSpacing, 0.2)}px;
      }
      .line-time {
        text-align: center;
        font-weight: 800;
        font-size: ${Math.round(fontSize * 1.28 * 10) / 10}px;
      }
      .line-orderNumber {
        text-align: center;
        font-weight: 800;
        font-size: ${Math.round(fontSize * 2.2 * 10) / 10}px;
        line-height: 1.1;
      }
      .line-itemLine {
        display: flex;
        align-items: center;
        font-size: ${Math.round(fontSize * 1.04 * 10) / 10}px;
        font-weight: 700;
        margin-top: 6px;
        padding-top: 2px;
      }
      .line-product {
        font-weight: 700;
        font-size: ${Math.round(fontSize * 1.04 * 10) / 10}px;
        padding: 2px 0 2px 18px;
        margin-top: 2px;
        border-left: 3px solid #111827;
      }
      .line-dynamicMain {
        padding-left: 28px;
        margin-top: 3px;
        font-size: ${Math.round(fontSize * 0.95 * 10) / 10}px;
        font-weight: 700;
        color: #1e293b;
      }
      .line-dynamicOption {
        padding-left: ${Math.round(general.dynamicOptionIndent)}px;
        font-size: ${Math.round(fontSize * general.dynamicOptionFontScale * 10) / 10}px;
        font-weight: 500;
        color: #334155;
        font-style: normal;
        opacity: ${general.dynamicOptionOpacity};
        line-height: ${general.dynamicOptionLineHeight};
        margin: 2px 0 4px 8px;
        padding-top: 4px;
        padding-bottom: 4px;
        border-left: 2px solid #e2e8f0;
        background: rgba(148, 163, 184, 0.05);
        border-radius: 6px;
      }
      .line-content {
        padding-left: 22px;
        font-size: ${Math.round(fontSize * 0.94 * 10) / 10}px;
        font-weight: 500;
        color: #334155;
        line-height: 1.35;
      }
      .line-dynamicSummary {
        padding-left: 8px;
        font-size: ${Math.round(fontSize * 0.94 * 10) / 10}px;
        font-weight: 500;
        color: #475569;
        line-height: 1.35;
      }
      .line-modifier {
        padding-left: 18px;
        font-size: ${Math.round(fontSize * 0.98 * 10) / 10}px;
      }
      .line-modifier-remove {
        text-decoration: line-through;
        opacity: 0.68;
        color: #64748b;
      }
      .line-modifier-add {
        font-weight: 800;
        color: #0f172a;
      }
      .line-modifier-custom {
        font-style: italic;
        opacity: 0.92;
        color: #475569;
        border-left: 2px solid #cbd5e1;
        padding-left: 12px;
        margin-left: 8px;
      }
      .line-meta {
        font-size: ${Math.round(fontSize * 0.98 * 10) / 10}px;
      }
      .line-summary {
        font-weight: 800;
        font-size: ${Math.round(fontSize * 1.08 * 10) / 10}px;
      }
      .line-status {
        text-align: center;
        font-weight: 800;
        font-size: ${Math.round(fontSize * 1.18 * 10) / 10}px;
        margin-top: 10px;
        padding: 10px 12px;
        border: 2px solid #111827;
        border-radius: 12px;
        background: #f8fafc;
      }
      .line-separator {
        font-size: ${fontSize}px;
        letter-spacing: 0.8px;
      }
      .style-german-doner .receipt {
        border-radius: 20px;
        padding: 18px 18px 22px;
      }
      .style-german-doner .line-title {
        font-size: ${Math.round(fontSize * 1.45 * 10) / 10}px;
        line-height: 1.2;
      }
      .style-german-doner .line-heading {
        font-size: ${Math.round(fontSize * 1.35 * 10) / 10}px;
        line-height: 1.2;
      }
      .style-german-doner .line-subtitle {
        font-size: ${Math.round(fontSize * 1.15 * 10) / 10}px;
        line-height: 1.2;
      }
      .style-german-doner .line-headerRow {
        font-size: ${Math.round(fontSize * 1.08 * 10) / 10}px;
      }
      .style-german-doner .line-time {
        font-size: ${Math.round(fontSize * 1.55 * 10) / 10}px;
      }
      .style-german-doner .line-orderNumber {
        font-size: ${Math.round(fontSize * 2.6 * 10) / 10}px;
        line-height: 1;
        margin: 4px 0 8px;
      }
      .style-german-doner .line-separator {
        text-align: center;
        font-weight: 800;
        letter-spacing: 1.2px;
      }
      .style-german-doner .line-product {
        font-size: ${Math.round(fontSize * 1.04 * 10) / 10}px;
        font-weight: 700;
        padding-left: 20px;
      }
      .style-german-doner .line-dynamicMain {
        padding-left: 30px;
        font-size: ${Math.round(fontSize * 0.94 * 10) / 10}px;
      }
      .style-german-doner .line-dynamicOption {
        margin-left: 20px;
      }
      .style-german-doner .line-content {
        padding-left: 48px;
        font-size: ${Math.round(fontSize * 0.92 * 10) / 10}px;
        font-weight: 500;
      }
      .style-german-doner .line-itemLine {
        font-size: ${Math.round(fontSize * 1.04 * 10) / 10}px;
        font-weight: 700;
        margin-top: 8px;
      }
      .style-german-doner .line-summary {
        font-size: ${Math.round(fontSize * 1.2 * 10) / 10}px;
        margin-top: 6px;
      }
      .style-german-doner .line-status {
        font-size: ${Math.round(fontSize * 1.28 * 10) / 10}px;
        letter-spacing: ${Math.max(general.previewLetterSpacing + 0.6, 0.8)}px;
        margin: 10px 0 4px;
        border-width: 2.5px;
      }
      .style-german-doner .line-modifier {
        padding-left: 28px;
      }
      .style-german-doner .line-product {
        padding-left: 22px;
        border-left-width: 3px;
      }
      .style-german-doner .line-content {
        padding-left: 50px;
      }
      .style-duzenli-fis .receipt {
        border-radius: 18px;
        padding: 16px 16px 20px;
      }
      .style-duzenli-fis .line-title,
      .style-duzenli-fis .line-heading,
      .style-duzenli-fis .line-subtitle {
        text-align: inherit;
      }
      .style-duzenli-fis .line-headerRow {
        font-size: ${Math.round(fontSize * 1.12 * 10) / 10}px;
        font-weight: 800;
      }
      .style-duzenli-fis .line-time {
        font-size: ${Math.round(fontSize * 1.32 * 10) / 10}px;
      }
      .style-duzenli-fis .line-itemLine {
        font-size: ${Math.round(fontSize * 1.02 * 10) / 10}px;
        font-weight: 700;
      }
      .style-duzenli-fis .line-product {
        font-size: ${Math.round(fontSize * 1.02 * 10) / 10}px;
        font-weight: 700;
        padding-left: 18px;
        border-left-width: 2px;
      }
      .style-duzenli-fis .line-dynamicMain {
        padding-left: 28px;
        font-size: ${Math.round(fontSize * 0.94 * 10) / 10}px;
      }
      .style-duzenli-fis .line-dynamicOption {
        margin-left: 16px;
      }
      .style-duzenli-fis .line-content {
        padding-left: 38px;
        font-size: ${Math.round(fontSize * 0.92 * 10) / 10}px;
        font-weight: 500;
      }
      .style-duzenli-fis .line-status {
        text-align: right;
        font-size: ${Math.round(fontSize * 1.08 * 10) / 10}px;
        margin-top: 2px;
        border-width: 1.5px;
      }
      .style-duzenli-fis .line-modifier {
        padding-left: 30px;
      }
      .style-orijinal-fis .receipt {
        border-radius: 20px;
        padding: 16px 18px 18px;
      }
      .style-orijinal-fis .lines {
        letter-spacing: ${Math.max(general.previewLetterSpacing, 0.1)}px;
      }
      .style-orijinal-fis .line-title,
      .style-orijinal-fis .line-heading,
      .style-orijinal-fis .line-subtitle,
      .style-orijinal-fis .line-headerRow,
      .style-orijinal-fis .line-time,
      .style-orijinal-fis .line-orderNumber,
      .style-orijinal-fis .line-summary,
      .style-orijinal-fis .line-status {
        text-align: left;
      }
      .style-orijinal-fis .line-title,
      .style-orijinal-fis .line-heading,
      .style-orijinal-fis .line-subtitle {
        font-size: ${Math.round(fontSize * 1.02 * 10) / 10}px;
        font-weight: 700;
      }
      .style-orijinal-fis .line-headerRow {
        font-size: ${Math.round(fontSize * 1.16 * 10) / 10}px;
        font-weight: 800;
      }
      .style-orijinal-fis .line-time {
        font-size: ${Math.round(fontSize * 1.12 * 10) / 10}px;
        font-weight: 800;
      }
      .style-orijinal-fis .line-orderNumber {
        font-size: ${Math.round(fontSize * 1.18 * 10) / 10}px;
        line-height: ${general.previewLineHeight};
        font-weight: 800;
      }
      .style-orijinal-fis .line-itemLine {
        font-size: ${Math.round(fontSize * 1.04 * 10) / 10}px;
        font-weight: 700;
      }
      .style-orijinal-fis .line-product {
        font-size: ${Math.round(fontSize * 1.04 * 10) / 10}px;
        font-weight: 700;
        padding-left: 18px;
        border-left-width: 2px;
      }
      .style-orijinal-fis .line-dynamicMain {
        padding-left: 28px;
        font-size: ${Math.round(fontSize * 0.94 * 10) / 10}px;
      }
      .style-orijinal-fis .line-dynamicOption {
        margin-left: 16px;
      }
      .style-orijinal-fis .line-content {
        padding-left: 34px;
        font-size: ${Math.round(fontSize * 0.94 * 10) / 10}px;
        font-weight: 500;
      }
      .style-orijinal-fis .line-modifier {
        padding-left: 34px;
      }
      .style-orijinal-fis .line-modifier-add {
        font-size: ${Math.round(fontSize * 1.08 * 10) / 10}px;
      }
      .style-orijinal-fis .line-status {
        padding-left: 44px;
        font-size: ${Math.round(fontSize * 1.02 * 10) / 10}px;
        font-weight: 700;
        border-width: 1.5px;
      }
    </style>
  </head>
  <body>
    <div class="${stylePresetClass}">
      <div class="receipt">
        <div class="lines">${styledLines}</div>
      </div>
    </div>
  </body>
</html>`
}
