import net from 'node:net'
import { Buffer } from 'node:buffer'
import iconv from 'iconv-lite'
import { BrowserWindow } from 'electron'
import { buildReceiptText, renderReceiptHtml } from '../shared/receipt.js'
import type { AppSettings, PrinterConfig, ReceiptPreviewData } from '../shared/types.js'

function createPrintWindow(): BrowserWindow {
  return new BrowserWindow({
    show: false,
    width: 420,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: false,
    },
  })
}

async function printViaWindows(
  preview: ReceiptPreviewData,
  settings: AppSettings,
  printer: PrinterConfig,
): Promise<void> {
  if (!printer.windowsPrinterName) {
    throw new Error('Windows yazicisi secilmedi.')
  }

  const html = renderReceiptHtml(preview, settings.general, printer)
  const printWindow = createPrintWindow()

  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

    await new Promise<void>((resolve, reject) => {
      const printOptions =
        settings.general.thermalPrinterMode !== false
          ? {
              silent: true,
              deviceName: printer.windowsPrinterName,
              printBackground: false,
              copies: Math.max(1, printer.copies),
              margins: {
                marginType: 'none' as const,
              },
              pageSize: {
                width: Math.round(printer.paperWidth * 1000),
                height: 200000,
              },
            }
          : {
              silent: true,
              deviceName: printer.windowsPrinterName,
              printBackground: false,
              copies: Math.max(1, printer.copies),
            }

      printWindow.webContents.print(
        printOptions,
        (success, failureReason) => {
          if (!success) {
            reject(new Error(failureReason || 'Windows yazdirma basarisiz oldu.'))
            return
          }
          resolve()
        },
      )
    })
  } finally {
    printWindow.close()
  }
}

function buildEscPosBuffer(preview: ReceiptPreviewData, settings: AppSettings): Buffer {
  const receiptText = buildReceiptText(preview).replace(/\n/g, '\r\n')
  const encoding = settings.general.encoding === 'cp857' ? 'cp857' : 'utf8'
  const content = iconv.encode(receiptText, encoding)
  const init = Buffer.from([0x1b, 0x40])
  const normal = Buffer.from([0x1b, 0x21, 0x00])
  const cut = settings.general.cutPaper ? Buffer.from([0x1d, 0x56, 0x00]) : Buffer.alloc(0)
  const feed = Buffer.from('\r\n\r\n', 'ascii')

  return Buffer.concat([init, normal, content, feed, cut])
}

async function printViaEscPos(
  preview: ReceiptPreviewData,
  settings: AppSettings,
  printer: PrinterConfig,
): Promise<void> {
  if (!printer.host) {
    throw new Error('ESC/POS icin IP veya host bilgisi gerekli.')
  }

  const payload = buildEscPosBuffer(preview, settings)

  await new Promise<void>((resolve, reject) => {
    const socket = net.createConnection(
      {
        host: printer.host,
        port: printer.port || 9100,
      },
      () => {
        socket.write(payload)
        socket.end()
      },
    )

    socket.on('close', () => resolve())
    socket.on('error', (error) => reject(error))
  })
}

export async function printReceipt(
  preview: ReceiptPreviewData,
  settings: AppSettings,
  printer: PrinterConfig,
): Promise<void> {
  if (printer.type === 'escpos') {
    await printViaEscPos(preview, settings, printer)
    return
  }

  await printViaWindows(preview, settings, printer)
}
