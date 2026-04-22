/// <reference types="vite/client" />

declare global {
  interface Window {
    printServerAPI?: {
      loadSettings: () => Promise<import('../shared/types').AppSettings>
      saveSettings: (
        settings: import('../shared/types').AppSettings,
      ) => Promise<import('../shared/types').AppSettings>
      listSystemPrinters: () => Promise<string[]>
      getPrinterDiagnostics: () => Promise<import('../shared/types').PrinterDiagnostics>
      pickDirectory: (title?: string) => Promise<string | null>
      pickPreviewFile: () => Promise<string | null>
      loadPreviewFile: (filePath: string) => Promise<import('../shared/types').ReceiptPreviewData>
      getRuntimeState: () => Promise<import('../shared/types').RuntimeState>
      startWatcher: () => Promise<import('../shared/types').RuntimeState>
      stopWatcher: () => Promise<import('../shared/types').RuntimeState>
      onJob: (callback: (job: import('../shared/types').PrintJobLog) => void) => () => void
    }
  }
}

export {}
