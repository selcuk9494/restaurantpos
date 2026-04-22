# Device Agent CI Release

Bu dokuman, `@resto/device-agent` icin CI tabanli release, signing ve notarization akislarini netlestirir.

## Workflow

GitHub Actions workflow dosyasi:

- `.github/workflows/device-agent-release.yml`

Tetikleme yollari:

- manuel `workflow_dispatch`
- `device-agent-v*` tag push

## Gerekli Secret'lar

macOS signing ve notarization icin:

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

Windows signing icin tercihen:

- `WIN_CSC_LINK`
- `WIN_CSC_KEY_PASSWORD`

Alternatif olarak Windows da ortak `CSC_LINK` ve `CSC_KEY_PASSWORD` ile calisabilir.

## Lokal Komutlar

Unsigned lokal paketler:

```bash
pnpm dist:device-agent:mac
```

```bash
pnpm dist:device-agent:win:x64
```

Signed mac release:

```bash
pnpm dist:device-agent:mac:signed
```

Signed mac x64 release:

```bash
pnpm dist:device-agent:mac:x64:signed
```

## Notarization Hook

Notarization hook dosyasi:

- `apps/device-agent/scripts/notarize.cjs`

Davranis:

- Apple secret'lari yoksa notarization atlanir
- Secret'lar varsa `notarytool` ile otomatik notarization calisir

## Tag Stratejisi

Onerilen tag formati:

- `device-agent-v0.1.0`

Bu tag push edildiginde workflow secili platform artefact'larini build eder ve GitHub Release'e yukler.

## Artefact Konumlari

- mac arm64 unsigned: `apps/device-agent/release/mac/`
- mac arm64 signed: `apps/device-agent/release/mac-signed/`
- mac x64 unsigned: `apps/device-agent/release/mac-x64/`
- mac x64 signed: `apps/device-agent/release/mac-x64-signed/`
- windows x64: `apps/device-agent/release/win-x64/`
- windows arm64: `apps/device-agent/release/win-arm64/`

## Runbook

Ilk resmi release icin adim adim operasyon listesi:

- `docs/device-agent/RELEASE_RUNBOOK.md`

## Son Not

Bu CI hatti lokal unsigned build akislarini bozmaz; signing secret'lari eklendiginde ayni repo signed release uretebilir.
