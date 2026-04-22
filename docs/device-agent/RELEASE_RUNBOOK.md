# Device Agent Release Runbook

Bu runbook, `@resto/device-agent` icin ilk resmi release'i minimum hata ile cikarmak icin uygulanacak operasyon adimlarini toplar.

## 1. Gerekli Secret'lar

GitHub repository secret olarak gir:

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

Windows icin ayri sertifika kullanilacaksa ek olarak:

- `WIN_CSC_LINK`
- `WIN_CSC_KEY_PASSWORD`

## 2. Lokal On Kontrol

Monorepo kokunden:

```bash
pnpm --filter @resto/device-agent typecheck
```

```bash
pnpm dist:device-agent:mac:signed
```

```bash
pnpm dist:device-agent:win:x64
```

Beklenen sonuc:

- typecheck temiz
- mac artifact olusur
- windows artifact komutu hata vermeden tamamlanir veya hedef ortamda CI'da tamamlanir

## 3. Versiyon Karari

Ilk release icin onerilen tag formati:

```bash
device-agent-v0.1.0
```

Eger paket versiyonu artirildiysa tag de ayni versiyonla cikmalidir.

## 4. Tag Ile Release Baslatma

Repo kokunden:

```bash
git tag device-agent-v0.1.0
```

```bash
git push origin device-agent-v0.1.0
```

Bu islem su workflow'u tetikler:

- `.github/workflows/device-agent-release.yml`

## 5. Alternatif Manuel Calistirma

GitHub Actions uzerinden `Device Agent Release` workflow'unu manuel de calistirabilirsin.

Secilebilir platformlar:

- macOS arm64
- macOS x64
- Windows x64
- Windows arm64

## 6. Workflow Sirasinda Kontrol

Asagidaki job'lari izle:

- `mac-arm64`
- `mac-x64`
- `win-x64`
- `win-arm64`
- `github-release`

Beklenen davranis:

- macOS tarafinda sertifika varsa signing yapilir
- Apple secret'lari varsa notarization calisir
- Secret eksikse notarization bilincli olarak atlanir

## 7. Release Sonrasi Kontrol

GitHub Release ekraninda sunlari dogrula:

- mac arm64 zip artefact'i var
- gerekiyorsa mac x64 zip artefact'i var
- windows x64 exe artefact'i var
- gerekiyorsa windows arm64 exe artefact'i var
- release note otomatik olusmus

## 8. Artefact Isimleri

Beklenen artefact isimleri:

- `resto-device-agent-<version>-arm64.zip`
- `resto-device-agent-<version>-x64.zip`
- `resto-device-agent-<version>-x64.exe`
- `resto-device-agent-<version>-arm64.exe`

## 9. Sahaya Vermeden Once

- mac paketini temiz bir makinede ac
- windows paketini hedef mimaride ac
- ilk acilista ayar ekrani geliyor mu bak
- bridge, watcher ve terminal registration temel akisini kontrol et
- gerekiyorsa sample dosyalariyla smoke test yap

## 10. Sorun Durumunda

Ilk bakilacak yerler:

- GitHub Actions job loglari
- `docs/device-agent/CI_RELEASE.md`
- `docs/device-agent/CANLIYA_ALMA.md`
- `apps/device-agent/INGENICO_SETUP.md`

## 11. Resmi Referanslar

- `../resto-platform/docs/device-agent/CI_RELEASE.md`
- `../resto-platform/docs/device-agent/CANLIYA_ALMA.md`
- `../resto-platform/apps/device-agent/README.md`
